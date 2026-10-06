// Post-processing and environment lighting for Hold the Span.
//   Post: scene -> HalfFloat target (MSAA where cheap) -> bright pass at 1/4 res -> separable blur at 1/4 and 1/8
//         -> composite with ACES tone mapping + sRGB output. Only HDR values above `threshold` bloom, so muzzle
//         flashes, tracers, gate frames, lamps and visors glow while the rest of the frame stays crisp.
//   makeEnvironment: a tiny gradient-sky scene prefiltered with PMREM for image-based light on PBR materials.
import * as THREE from './vendor/three.module.min.js';

const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

export class Post {
  constructor(renderer) {
    this.renderer = renderer;
    this.enabled = true;
    this.strength = 0.9;
    this.threshold = 1.0;
    const opts = { type: THREE.HalfFloatType, depthBuffer: false, stencilBuffer: false };
    this.sceneRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 0 });
    this.a1 = new THREE.WebGLRenderTarget(1, 1, opts); this.b1 = new THREE.WebGLRenderTarget(1, 1, opts);
    this.a2 = new THREE.WebGLRenderTarget(1, 1, opts); this.b2 = new THREE.WebGLRenderTarget(1, 1, opts);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.quad.frustumCulled = false;
    this.fsScene = new THREE.Scene(); this.fsScene.add(this.quad);
    this.brightMat = new THREE.ShaderMaterial({
      uniforms: { tSrc: { value: null }, texel: { value: new THREE.Vector2() }, threshold: { value: 1 }, knee: { value: 0.6 } },
      vertexShader: VERT, toneMapped: false, depthTest: false, depthWrite: false,
      fragmentShader: `uniform sampler2D tSrc; uniform vec2 texel; uniform float threshold, knee; varying vec2 vUv;
        void main() {
          vec3 c = texture2D(tSrc, vUv + texel * vec2(-1.0, -1.0)).rgb + texture2D(tSrc, vUv + texel * vec2(1.0, -1.0)).rgb
                 + texture2D(tSrc, vUv + texel * vec2(-1.0, 1.0)).rgb + texture2D(tSrc, vUv + texel * vec2(1.0, 1.0)).rgb;
          c *= 0.25;
          float l = max(c.r, max(c.g, c.b));
          c *= smoothstep(threshold, threshold + knee, l);
          gl_FragColor = vec4(min(c, vec3(24.0)), 1.0);
        }`,
    });
    this.blurMat = new THREE.ShaderMaterial({
      uniforms: { tSrc: { value: null }, dir: { value: new THREE.Vector2() } },
      vertexShader: VERT, toneMapped: false, depthTest: false, depthWrite: false,
      fragmentShader: `uniform sampler2D tSrc; uniform vec2 dir; varying vec2 vUv;
        void main() {
          vec3 c = texture2D(tSrc, vUv).rgb * 0.227027;
          c += (texture2D(tSrc, vUv + dir * 1.384615).rgb + texture2D(tSrc, vUv - dir * 1.384615).rgb) * 0.316216;
          c += (texture2D(tSrc, vUv + dir * 3.230769).rgb + texture2D(tSrc, vUv - dir * 3.230769).rgb) * 0.070270;
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    this.copyMat = new THREE.ShaderMaterial({
      uniforms: { tSrc: { value: null } }, vertexShader: VERT, toneMapped: false, depthTest: false, depthWrite: false,
      fragmentShader: 'uniform sampler2D tSrc; varying vec2 vUv; void main() { gl_FragColor = texture2D(tSrc, vUv); }',
    });
    this.compMat = new THREE.ShaderMaterial({
      uniforms: { tScene: { value: null }, tB1: { value: null }, tB2: { value: null }, strength: { value: 0.9 } },
      vertexShader: VERT, toneMapped: true, depthTest: false, depthWrite: false,
      fragmentShader: `uniform sampler2D tScene, tB1, tB2; uniform float strength; varying vec2 vUv;
        void main() {
          vec3 c = texture2D(tScene, vUv).rgb + (texture2D(tB1, vUv).rgb * 0.7 + texture2D(tB2, vUv).rgb * 0.9) * strength;
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.w = 1; this.h = 1;
  }
  setSize(w, h, pr) {
    const W = Math.max(1, Math.round(w * pr)), H = Math.max(1, Math.round(h * pr));
    this.w = W; this.h = H;
    // MSAA only where the pixel density is low enough that edges would otherwise shimmer.
    const samples = pr <= 1.5 ? 4 : 0;
    if (this.sceneRT.samples !== samples) { this.sceneRT.dispose(); this.sceneRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples }); }
    this.sceneRT.setSize(W, H);
    const q = (d) => [Math.max(1, Math.round(W / d)), Math.max(1, Math.round(H / d))];
    this.a1.setSize(...q(4)); this.b1.setSize(...q(4)); this.a2.setSize(...q(8)); this.b2.setSize(...q(8));
  }
  pass(mat, target) { this.quad.material = mat; this.renderer.setRenderTarget(target); this.renderer.render(this.fsScene, this.cam); }
  render(scene, camera) {
    const r = this.renderer;
    if (!this.enabled) { r.setRenderTarget(null); r.render(scene, camera); return; }
    r.setRenderTarget(this.sceneRT); r.render(scene, camera);
    const bm = this.brightMat.uniforms;
    bm.tSrc.value = this.sceneRT.texture; bm.texel.value.set(1 / this.w, 1 / this.h); bm.threshold.value = this.threshold;
    this.pass(this.brightMat, this.a1);
    const bl = this.blurMat.uniforms;
    bl.tSrc.value = this.a1.texture; bl.dir.value.set(1 / this.a1.width, 0); this.pass(this.blurMat, this.b1);
    bl.tSrc.value = this.b1.texture; bl.dir.value.set(0, 1 / this.a1.height); this.pass(this.blurMat, this.a1);
    this.copyMat.uniforms.tSrc.value = this.a1.texture; this.pass(this.copyMat, this.a2);
    bl.tSrc.value = this.a2.texture; bl.dir.value.set(1 / this.a2.width, 0); this.pass(this.blurMat, this.b2);
    bl.tSrc.value = this.b2.texture; bl.dir.value.set(0, 1 / this.a2.height); this.pass(this.blurMat, this.a2);
    const cm = this.compMat.uniforms;
    cm.tScene.value = this.sceneRT.texture; cm.tB1.value = this.a1.texture; cm.tB2.value = this.a2.texture; cm.strength.value = this.strength;
    this.pass(this.compMat, null);
  }
}

const envCache = new Map();
export function makeEnvironment(renderer, key, top, horizon, ground, sun) {
  if (envCache.has(key)) return envCache.get(key);
  const s = new THREE.Scene();
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color(top) }, hor: { value: new THREE.Color(horizon) }, gnd: { value: new THREE.Color(ground) }, sun: { value: new THREE.Color(sun) } },
    vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 top, hor, gnd, sun; varying vec3 vDir;
      void main() {
        float y = vDir.y;
        vec3 c = y > 0.0 ? mix(hor, top, pow(y, 0.6)) : mix(hor, gnd, pow(-y, 0.4));
        float s = max(0.0, dot(vDir, normalize(vec3(0.4, 0.55, 0.3))));
        c += sun * pow(s, 64.0) * 6.0 + sun * pow(s, 4.0) * 0.25;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  s.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), mat));
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.02);
  pm.dispose(); mat.dispose();
  envCache.set(key, rt.texture);
  return rt.texture;
}
