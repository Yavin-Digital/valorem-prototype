/* Precinct Rumble: all pixel art is generated here in code (no image files). */
(function () {
  'use strict';
  const E = window.RetroEngine, P = E.P;
  const ART = window.PR_ART = {};
  ART.K = 1.25; // figure scale: cops stand about 45 units (90 display px) tall; bosses use their own larger k
  const CW = 64, CH = 70, CX = 32, BASE = 66;
  const DIM = { leg: 15, torso: 12, tw: 11, hw: 9, hh: 9, lw: 3, aw: 3, hand: 3 };

  // ---------------------------------------------------------------- keyframes (facing right)
  // Limbs are [knee/elbow dx, dy, foot/hand dx, dy] from the hip / shoulder. Most frames are solved with 2-bone IK
  // from a foot or fist target so limb lengths stay constant through the animation.
  const LEG = 7.5, ARM = 5.6;
  function ik(fx, fy, L1, L2, bend) {
    const D = Math.max(0.01, Math.min(Math.hypot(fx, fy), L1 + L2 - 0.02)), a = Math.atan2(fy, fx);
    const c = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D)))), ang = a - bend * c;
    return [Math.cos(ang) * L1, Math.sin(ang) * L1];
  }
  const Lg = (fx, fy) => { const k = ik(fx, fy, LEG, LEG, 1); return [k[0], k[1], fx, fy]; };
  const Am = (hx, hy, bend) => { const k = ik(hx, hy, ARM, ARM, bend === undefined ? -1 : bend); return [k[0], k[1], hx, hy]; };
  const stance = (hy, f, b) => ({ hy, legF: Lg(f === undefined ? 4.5 : f, 15 - hy), legB: Lg(b === undefined ? -4 : b, 15 - hy) });
  const guard = (b) => ({ armF: Am(7.2, -0.6 + b), armB: Am(5.2, 1.4 + b) });
  const POSE = {};
  // idle: fighting stance with a slow breath (ping-pong 0-1-2-1)
  [0, 0.5, 1, 0.5].forEach((b, i) => { POSE['idle' + i] = Object.assign(stance(0.8 + b * 0.5), guard(b * 0.6), { ty: -b * 0.35, lean: 0.4 }); });
  POSE.idle = POSE.idle0;
  // walk: 6-frame cycle with hip bob, contrapposto sway and counter-swinging arms
  for (let i = 0; i < 6; i++) {
    const th = i / 6 * Math.PI * 2, c = Math.cos(th), s = Math.sin(th), hy = 0.35 + 0.55 * Math.cos(th * 2);
    const ff = [3.6 * c + 0.6, 15 - hy - Math.max(0, -s) * 2.6], fb = [-3.6 * c + 0.6, 15 - hy - Math.max(0, s) * 2.6];
    POSE['walk' + i] = { hy, hx: 0.4 * s, lean: 1.1, legF: Lg(ff[0], ff[1]), legB: Lg(fb[0], fb[1]), armF: Am(6.4 - 1.6 * c, 0.4 + 0.5 * Math.abs(s)), armB: Am(4.6 + 1.6 * c, 1.8) };
    POSE['ewalk' + i] = { hy, hx: 0.4 * s, lean: 0.6, legF: Lg(ff[0], ff[1]), legB: Lg(fb[0], fb[1]), armF: Am(1.8 - 3.2 * c, 9.6, 1), armB: Am(0.8 + 3.2 * c, 9.6, 1) };
  }
  [0, 0.5, 1, 0.5].forEach((b, i) => { POSE['eidle' + i] = Object.assign(stance(0.4 + b * 0.4, 3, -3.5), { ty: -b * 0.3, lean: 0.8, hdx: 0.4, armF: Am(2.6, 9.4 - b * 0.4, 1), armB: Am(1.2, 9.6 - b * 0.4, 1) }); });
  Object.assign(POSE, {
    // punches: wind-up, strike, follow-through
    jabW: Object.assign(stance(0.9), { lean: -0.2, armF: Am(4.2, 0.4), armB: Am(5, 2) }),
    jab: Object.assign(stance(0.8, 5.6), { lean: 1.9, armF: Am(11.1, -0.8), armB: Am(4.4, 2.4) }),
    jabF: Object.assign(stance(0.8, 5.2), { lean: 1.3, armF: Am(9, 0), armB: Am(4.6, 2.2) }),
    crossW: Object.assign(stance(1.1), { lean: -1.3, armF: Am(1.2, 3.4), armB: Am(6.4, -0.2) }),
    cross: Object.assign(stance(0.9, 5.4, -5.6), { lean: 3.1, armF: Am(11, -1.6), armB: Am(2.2, 5) }),
    crossF: Object.assign(stance(0.9, 5.2, -5.2), { lean: 2.2, armF: Am(8.4, -0.6), armB: Am(3, 4) }),
    hookW: Object.assign(stance(1.6), { lean: -0.8, armF: Am(2.4, 6.2), armB: Am(5.6, 0.6) }),
    hook: Object.assign(stance(0.4, 5), { lean: 1.7, armF: Am(8.6, -6.2), armB: Am(3, 3.6) }),
    hookF: Object.assign(stance(0.2, 4.6), { lean: 1.2, hdy: -0.4, armF: Am(5.6, -9.4), armB: Am(3, 3.6) }),
    kickW: { hy: 0.6, lean: -1, legF: [5.2, 1.2, 3.2, 8.4], legB: Lg(-2, 14.4), armF: Am(5, 1.5), armB: Am(3.5, 3) },
    kick: { hy: 0.6, lean: -3, legF: [6.2, 0.2, 14, -1.2], legB: Lg(-1.6, 14.4), armF: Am(1.5, 7.5, 1), armB: Am(-3.5, 6.5, 1) },
    kickF: { hy: 0.6, lean: -1.6, legF: [5.4, 2.4, 9.6, 7.4], legB: Lg(-1.8, 14.4), armF: Am(3.5, 4), armB: Am(-1.5, 6, 1) },
    jump: { legF: [4, 5, 2, 10], legB: [-1, 6, -3, 11], armF: Am(6.5, -3), armB: Am(4.5, -0.5) },
    jumpkick: { legF: [5.5, 3, 13, 4], legB: [-1, 6, -4.5, 10], lean: -1.2, armF: Am(-1.5, 6, 1), armB: Am(-4, 5, 1) },
    grab: Object.assign(stance(0.8, 5), { lean: 1.3, armF: Am(10, 3.5), armB: Am(9, 5) }),
    knee: { hy: 0.4, legF: [6, 3, 4, 9], legB: Lg(-1.2, 14.6), lean: 1.2, armF: Am(10, 4), armB: Am(9, 5.2) },
    throw: Object.assign(stance(0.6, 3, -5), { lean: -3, armF: Am(-4, -9, 1), armB: Am(-5, -8, 1) }),
    hurt: Object.assign(stance(0.6, 2, -4.4), { lean: -3.6, hdx: -1.6, hdy: 0.4, armF: Am(3.6, -7.5, 1), armB: Am(-5.5, -3, 1) }),
    win: Object.assign(stance(0, 2.4, -2.4), { armF: Am(2.5, -10.6, 1), armB: Am(4, 8.6, 1) }),
    windup: Object.assign(stance(1), { lean: -1.2, armF: Am(-6, 2, 1), armB: Am(-4, 7, 1) }),
    slash: Object.assign(stance(0.9, 5.4), { lean: 2.4, armF: Am(11, 3), armB: Am(2.5, 6, 1) }),
    throw0: Object.assign(stance(0.8), { lean: -2.2, armF: Am(-4, -8.8, 1), armB: Am(4, 2.5) }),
    throw1: Object.assign(stance(0.8, 5), { lean: 2.2, armF: Am(10.6, -1.5), armB: Am(-2, 5.6, 1) }),
    charge: { hy: 1, legF: Lg(7, 14), legB: Lg(-6, 13.4), lean: 4.2, hdx: 0.6, armF: Am(10, 4), armB: Am(8, 6) },
    slamup: Object.assign(stance(0), { armF: Am(4, -10.5, 1), armB: Am(2, -10.8, 1) }),
    slam: { hy: 4, legF: Lg(5, 11), legB: Lg(-4, 11), lean: 2.2, armF: Am(9, 10), armB: Am(8, 10.2) },
    point: Object.assign(stance(0, 2, -2), { armF: Am(11, -3), armB: Am(2, 9.4, 1) }),
    swingHi: Object.assign(stance(0.8), { lean: -1, armF: Am(4, -9.6, 1), armB: Am(4, 2.5) }),
    swingMid: Object.assign(stance(0.8, 5.4), { lean: 2.2, armF: Am(11, 0), armB: Am(-1, 5.8, 1) }),
    swingLo: Object.assign(stance(0.8, 5.4), { lean: 2.2, armF: Am(9.6, 6.5), armB: Am(-1, 5.8, 1) }),
    carry0: Object.assign(stance(0.4, 3, -3), { armF: Am(2.5, -10.8, 1), armB: Am(1, -10.9, 1) }),
    carry1: { hy: -0.6, legF: Lg(-2.4, 15.6), legB: Lg(3.6, 15.6), armF: Am(2.5, -10.8, 1), armB: Am(1, -10.9, 1) },
    laugh: Object.assign(stance(0, 2, -2), { lean: -2, hdy: -1, hdx: -0.6, armF: Am(5, 7.5, 1), armB: Am(4, 8, 1) }),
    lie: { legF: Lg(0.8, 14.8), legB: [3, 5.6, 0.6, 13], armF: Am(4.5, 7, 1), armB: Am(-3, 8.4, 1), hdx: 0.4 }
  });
  ART.POSE = POSE;

  function human(def, pose, extra) {
    const box = def.box || [CW, CH, CX, BASE], c = E.makeCanvas(box[0], box[1]), p = E.painter(c.getContext('2d'));
    const d = def.d || DIM, ps = Object.assign({}, POSE[pose], extra || {}), ls = d.leg / 15;
    if (ls !== 1) for (const k of ['legF', 'legB']) if (ps[k]) ps[k] = ps[k].map(v => v * ls);
    const as = Math.max(1, d.torso / 12); if (as !== 1) for (const k of ['armF', 'armB']) if (ps[k]) ps[k] = ps[k].map(v => v * as); // longer arms on tall torsos
    E.human(p, Object.assign({}, def, { k: def.k || ART.K, cx: box[2], base: box[3], d, pose: ps }));
    E.outline(c, '#000000');
    return E.finish(c, box[2], box[3]);
  }
  function lying(sprite) { return E.finishAuto(E.rotate90(sprite.src, false)); }
  function frames(def, list, enemy) {
    const f = {};
    for (const n of list) {
      const src = enemy && /^(idle|walk)\d$/.test(n) ? 'e' + n : n; // thugs slouch and swagger, cops keep their guard up
      f[n] = human(def, src);
    }
    f.down = lying(human(def, 'lie'));
    return f;
  }

  // ---------------------------------------------------------------- heroes
  const COP = { shirt: P.azure, shirt2: P.royal, sleeve: P.azure, pants: P.navy, pants2: P.blue, shoes: '#18141C', belt: '#16161C', hat: P.navy, accent: P.gold };
  ART.HEROES = [
    {
      id: 'turbo', name: 'TINA "TURBO" VASQUEZ', short: 'TURBO', role: 'ROOKIE SPRINTER', special: 'TURBO TORNADO',
      blurb: 'Fastest legs in the precinct. Spinning kick special.',
      stats: { speed: 1.5, power: 0.85, hp: 36, reach: 0, cost: 5 }, bars: [5, 2, 3],
      d: Object.assign({}, DIM, { tw: 10 }), hat: 'cappony', badge: true, cop: true, fem: true, sleeve: 'short',
      pal: Object.assign({}, COP, { skin: '#E8A878', hair: '#B83C14', shirt: P.cornflower, sleeve: P.cornflower, shirt2: P.azure, eye: '#3C6C2C' })
    },
    {
      id: 'bo', name: 'SGT. BO BRANNIGAN', short: 'BIG BO', role: 'HEAVY HITTER', special: 'PRECINCT QUAKE',
      blurb: 'Slow, strong, and built like a mailbox. Ground-pound special.',
      stats: { speed: 0.95, power: 1.45, hp: 52, reach: 2, cost: 7 }, bars: [2, 5, 5],
      d: Object.assign({}, DIM, { tw: 15, torso: 13, lw: 4, aw: 4, hw: 10, hand: 4 }), hat: 'cap', badge: true, cop: true, mustache: true, sleeve: 'short', build: 'heavy', jaw: 'square',
      pal: Object.assign({}, COP, { skin: '#F0B890', hair: '#C84820', shirt: P.royal, shirt2: P.navy, sleeve: P.royal })
    },
    {
      id: 'dana', name: 'OFC. DANA KIM + PEPPER', short: 'DANA', role: 'K-9 HANDLER', special: 'PEPPER POUNCE',
      blurb: 'Partnered with Pepper, the bravest pup in town. K-9 dash special.',
      stats: { speed: 1.2, power: 1.0, hp: 42, reach: 0, cost: 5 }, bars: [4, 3, 4],
      d: DIM, hat: 'bun', badge: true, cop: true, fem: true, sleeve: 'long',
      pal: Object.assign({}, COP, { skin: '#E8B48C', hair: '#14101C', shirt: P.navy, shirt2: P.blue, sleeve: P.navy, vest: '#2C5C44', pants: '#2C2C38', pants2: '#18181E' })
    },
    {
      id: 'hale', name: 'DET. MARCUS HALE', short: 'HALE', role: 'BATON DETECTIVE', special: 'BATON WHIRL',
      blurb: 'Twenty years on the case. Long baton reach and a spinning sweep.',
      stats: { speed: 1.1, power: 1.1, hp: 40, reach: 9, cost: 6 }, bars: [3, 4, 4],
      d: DIM, hat: 'fedora', item: 'baton', mustache: true, sleeve: 'long', jaw: 'square',
      pal: { skin: '#A8643C', skin2: '#8C4C28', hair: '#18100C', shirt: '#E8E0D0', shirt2: '#B8B0A0', top: '#E8E0D0', tie: '#A8102C', sleeve: '#7C6C40', coat: '#7C6C40', pants: '#3C3C44', pants2: '#24242C', shoes: '#2C1810', belt: '#3C2410', hat: '#4C3820', hat2: '#14100C', accent: P.gold }
    }
  ];
  const HERO_FRAMES = ['idle0', 'idle1', 'idle2', 'idle3', 'walk0', 'walk1', 'walk2', 'walk3', 'walk4', 'walk5', 'jabW', 'jab', 'jabF', 'crossW', 'cross', 'crossF', 'hookW', 'hook', 'hookF', 'kickW', 'kick', 'kickF',
    'jump', 'jumpkick', 'grab', 'knee', 'throw', 'hurt', 'win', 'slamup', 'slam', 'point', 'swingHi', 'swingMid', 'swingLo', 'carry0', 'carry1', 'charge', 'throw1'];
  ART.WALKN = 6;

  // ---------------------------------------------------------------- syndicate (the Crooked Crown)
  const BIG = { leg: 16, torso: 14, tw: 15, hw: 10, hh: 10, lw: 4, aw: 4, hand: 4 };
  ART.ENEMIES = {
    grunt: { name: 'HOODLUM', d: DIM, hat: 'hood', shoe: 'sneaker', sleeve: 'long', pal: { skin: '#E8A880', hat: '#4C2C8C', shirt: '#6C44B8', shirt2: '#4C2C8C', sleeve: '#6C44B8', pants: '#2C3C7C', pants2: '#1C2858', shoes: '#ECECF4', shoeStripe: '#E40058' } },
    grunt2: { name: 'HOODLUM', d: DIM, hat: 'hood', shoe: 'sneaker', sleeve: 'long', pal: { skin: '#B87048', hat: '#1C6C34', shirt: '#2C9C4C', shirt2: '#1C6C34', sleeve: '#2C9C4C', pants: '#3C3C44', pants2: '#24242C', shoes: '#ECECF4', shoeStripe: '#2C7CE4' } },
    dasher: { name: 'DASHER', d: Object.assign({}, DIM, { tw: 9 }), hat: 'bandana', item: 'knife', shoe: 'sneaker', sleeve: 'none', tank: true, build: 'lean', limbK: 0.82, face: 'angry',
      pal: { skin: '#D89868', hair: '#14101C', hat: '#C8102C', shirt: '#C8102C', top: '#C8102C', sleeve: '#D89868', pants: '#1C1C24', pants2: '#101016', shoes: '#B8B8C4', shoeStripe: '#C8102C' } },
    brick: { name: 'BRICK', d: BIG, k: 1.38, box: [72, 78, 36, 74], hat: 'bald', face: 'angry', sleeve: 'none', tank: true, build: 'huge', jaw: 'square', headK: 0.94, limbK: 1.1,
      pal: { skin: '#F0B088', skin2: '#D88C68', shirt: '#F4F4F0', top: '#F4F4F0', sleeve: '#F0B088', pants: '#2C4C9C', pants2: '#1C347C', shoes: '#4C2C14', belt: '#3C2410', chain: '#F0BC3C' } },
    pitcher: { name: 'PITCHER', d: DIM, hat: 'beanie', item: 'wrench', sleeve: 'long',
      pal: { skin: '#E0A070', hair: '#4C2C14', hat: '#E8B020', hat2: '#8C6C10', shirt: '#4C4C58', sleeve: '#4C4C58', vest: '#F07818', pants: '#5C5C24', pants2: '#3C3C14', shoes: '#18141C', belt: '#3C2410' } }
  };
  const EN_FRAMES = ['idle0', 'idle1', 'idle2', 'idle3', 'walk0', 'walk1', 'walk2', 'walk3', 'walk4', 'walk5', 'jabW', 'jab', 'jabF', 'windup', 'slash', 'throw0', 'throw1', 'hurt', 'charge', 'win', 'kick', 'laugh', 'carry0', 'carry1'];
  // boss extras drawn behind the body: Duke's cape, Gus's stone wings
  const cape = col => (g, J, T) => { const { sh, hip, cw, u } = J;
    T.part(g, T.pathOf(g, [[sh[0] - cw * 0.9, sh[1] - u * 0.2], [sh[0] + cw * 0.5, sh[1] - u * 0.4], [hip[0] - cw * 0.2, hip[1] + u * 9], [hip[0] - cw * 1.6, hip[1] + u * 10.5, hip[0] - cw * 2.4, hip[1] + u * 9], [hip[0] - cw * 2.1, hip[1], sh[0] - cw * 0.9, sh[1] - u * 0.2]]), col, { r: cw, spec: true });
    g.strokeStyle = '#F0BC3C'; g.lineWidth = u * 0.6; g.beginPath(); g.moveTo(hip[0] - cw * 0.2, hip[1] + u * 9); g.quadraticCurveTo(hip[0] - cw * 1.6, hip[1] + u * 10.5, hip[0] - cw * 2.4, hip[1] + u * 9); g.stroke(); };
  const wings = col => (g, J, T) => { const { sh, cw, u } = J, x = sh[0] - cw * 0.5, y = sh[1] + u;
    T.part(g, T.pathOf(g, [[x, y], [x - cw * 1.2, y - u * 6], [x - cw * 2.6, y - u * 7.5], [x - cw * 2.4, y - u * 2], [x - cw * 2.1, y + u * 2.5], [x - cw * 1.6, y + u * 1.2], [x - cw * 1.3, y + u * 4], [x - cw * 0.9, y + u * 2.4], [x - cw * 0.5, y + u * 5]]), col, { r: cw * 0.8, spec: true });
    g.strokeStyle = T.ramp(col).d2; g.lineWidth = u * 0.4; g.beginPath(); g.moveTo(x - cw * 1.2, y - u * 6); g.lineTo(x - cw * 1.6, y + u * 1.2); g.moveTo(x - cw * 2.6, y - u * 7.5); g.lineTo(x - cw * 2.1, y + u * 2.5); g.stroke(); };
  const BOSSBOX = [88, 88, 44, 84];
  ART.BOSSES = {
    rocco: { name: 'ROCCO "THE HYDRANT" BRUTTI', k: 1.5, box: BOSSBOX, d: { leg: 15, torso: 15, tw: 17, hw: 11, hh: 10, lw: 5, aw: 5, hand: 5 }, hat: 'beanie', mustache: true, face: 'angry', build: 'huge', belly: true, sleeve: 'long', shoe: 'sneaker', jaw: 'square', headK: 1.0,
      pal: { skin: '#E8A07C', skin2: '#C8805C', hair: '#18100C', hat: '#E8B020', hat2: '#8C6C10', shirt: '#D01C2C', shirt2: '#9C0C1C', sleeve: '#D01C2C', stripe: '#F4F4F0', pants: '#D01C2C', pants2: '#9C0C1C', shoes: '#F4F4F0', shoeStripe: '#D01C2C', chain: '#F0BC3C' } },
    tess: { name: 'TURNSTILE TESS', k: 1.56, box: BOSSBOX, d: Object.assign({}, DIM, { leg: 17, tw: 10 }), hat: 'long', face: 'shades', fem: true, sleeve: 'long', studs: true,
      pal: { skin: '#F0C0A0', hair: '#E01C9C', shirt: '#9C64DC', shirt2: '#6C3CB0', sleeve: '#6C3CB0', top: '#9C64DC', top2: '#1C1C24', pants: '#18181E', pants2: '#0C0C10', shoes: '#F4F4F0', belt: '#F0BC3C', lips: '#E0307C' } },
    gus: { name: 'GARGOYLE GUS', k: 1.5, box: BOSSBOX, d: { leg: 16, torso: 16, tw: 19, hw: 11, hh: 10, lw: 6, aw: 6, hand: 5 }, hat: 'bald', beard: true, face: 'angry', build: 'huge', stone: true, horns: '#8C8C9C', sleeve: 'none', jaw: 'square', headK: 0.95,
      rigBack: wings('#6C6C7C'),
      pal: { skin: '#A8A8B8', skin2: '#8C8C9C', hair: '#5C5C6C', shirt: '#A8A8B8', top: '#A8A8B8', sleeve: '#A8A8B8', pants: '#3C3C48', pants2: '#24242C', shoes: '#24242C', belt: '#18181E', eye: '#F02C2C' } },
    duke: { name: 'DUKE DELLACROIX', k: 1.45, box: BOSSBOX, d: { leg: 16, torso: 14, tw: 12, hw: 10, hh: 10, lw: 3, aw: 3, hand: 3 }, hat: 'crown', monocle: true, mustache: true, item: 'cane', sleeve: 'long', jaw: 'square',
      rigBack: cape('#A8102C'),
      pal: { skin: '#F0C0A0', hair: '#F4F4F0', shirt: '#6C2C8C', shirt2: '#4C1C6C', sleeve: '#6C2C8C', vest: '#E8B020', pants: '#4C1C6C', pants2: '#30104C', shoes: '#14101C', belt: '#14101C', glove: '#F4F4F0', glove2: '#D8D8E0' } }
  };

  // ---------------------------------------------------------------- K-9 partner
  function dog(f) {
    return E.sprite(30, 20, p => {
      const legs = [[0, 2], [1, 1], [2, 0], [1, 1]][f], tan = P.tangerine, dk = P.dbrown;
      p.r(5, 7, 15, 6, tan); p.r(8, 7, 9, 3, dk); // body + saddle
      p.r(19, 4, 6, 6, tan); p.r(23, 7, 4, 3, tan); p.px(26, 7, P.black); p.r(20, 2, 2, 3, dk); p.r(23, 2, 2, 3, dk); p.px(22, 6, P.black); // head
      p.r(1, 6 - legs[1], 5, 2, dk); // tail
      p.r(6 + legs[0], 13, 2, 5, tan); p.r(10 - legs[0], 13, 2, 5, dk); p.r(15 + legs[2], 13, 2, 5, tan); p.r(18 - legs[2], 13, 2, 5, dk);
      p.r(17, 9, 3, 2, P.azure); p.px(18, 11, P.gold); // collar + tag
    }, { ax: 15, ay: 19 });
  }

  // ---------------------------------------------------------------- items, props, fx
  const ITEMS = {
    pizza: { rows: ['.cccccccccc.', 'cCCCCCCCCCCc', '.yyryyyyryy.', '..yyyyyryy..', '..yryyyyy...', '...yyyyy....', '....yyry....', '.....yy.....'], map: { c: P.orange, C: P.tangerine, y: P.gold, r: P.crimson } },
    hotdog: { rows: ['..bbbbbbbbbb..', '.bssssssssssb.', 'bsyysyysyysysb', 'bbbbbbbbbbbbbb', '.bbbbbbbbbbbb.'], map: { b: P.tangerine, s: P.scarlet, y: P.gold } },
    pretzel: { rows: ['.oo....oo.', 'o..o..o..o', 'o...oo...o', '.o..oo..o.', '..oo..oo..', '..o....o..'], map: { o: P.orange } },
    donut: { rows: ['..pppppp..', '.pPpppPpp.', 'ppPpppppPp', 'ppp....ppp', 'ppp....ppp', 'pppPpppPpp', '.oppppppo.', '..oooooo..'], map: { p: P.pink, P: P.white, o: P.orange } },
    medal: { rows: ['r.....b', 'rr...bb', '.rr.bb.', '..rbb..', '..ggg..', '.gGGGg.', '.gGwGg.', '.gGGGg.', '..ggg..'], map: { r: P.crimson, b: P.royal, g: P.gold, G: P.cream, w: P.white } },
    badge: { rows: ['....g....', '...ggg...', 'gggGGGggg', '.ggGwGgg.', '..gGGGg..', '.gg...gg.', 'g.......g'], map: { g: P.gold, G: P.cream, w: P.white } }
  };
  ART.items = {};
  for (const k in ITEMS) ART.items[k] = E.fromStrings(ITEMS[k].rows, ITEMS[k].map);
  ART.trash = E.sprite(16, 20, p => { p.r(2, 4, 12, 15, P.gray); for (let x = 3; x < 14; x += 3) p.r(x, 5, 1, 13, P.lgray); p.r(1, 2, 14, 3, P.lgray); p.r(6, 0, 4, 2, P.lgray); });
  ART.crate = E.sprite(20, 18, p => { p.r(1, 1, 18, 16, P.orange); p.r(1, 1, 18, 2, P.tangerine); p.line(2, 3, 17, 15, 2, P.rust); p.r(1, 8, 18, 1, P.rust); });
  ART.newsbox = E.sprite(14, 20, p => { p.r(1, 2, 12, 12, P.royal); p.r(3, 4, 8, 5, P.ice); p.r(4, 14, 2, 5, P.dgray); p.r(9, 14, 2, 5, P.dgray); });
  // ---------------------------------------------------------------- breakable street objects
  ART.hydrant = E.sprite(14, 20, p => { p.r(3, 5, 8, 13, P.scarlet); p.r(4, 6, 2, 11, P.salmon); p.r(2, 3, 10, 3, P.crimson); p.r(5, 0, 4, 3, P.crimson); p.r(0, 9, 3, 3, P.crimson); p.r(11, 9, 3, 3, P.crimson); p.r(2, 17, 10, 3, P.crimson); p.px(7, 11, P.gold); });
  ART.hydrantBroken = E.sprite(14, 8, p => { p.r(3, 2, 8, 4, P.crimson); p.r(2, 5, 10, 3, P.crimson); p.r(5, 1, 4, 1, P.dgray); });
  ART.barrel = E.sprite(16, 20, p => { p.r(2, 1, 12, 18, P.royal); p.r(3, 1, 3, 18, P.azure); p.r(1, 4, 14, 2, P.dgray); p.r(1, 13, 14, 2, P.dgray); p.r(2, 0, 12, 2, P.lgray); p.r(7, 8, 3, 3, P.gold); });
  ART.bench = E.sprite(34, 16, p => { p.r(1, 2, 32, 3, P.orange); p.r(1, 6, 32, 3, P.tangerine); p.r(1, 2, 32, 1, P.gold); p.r(3, 9, 3, 7, P.lgray); p.r(28, 9, 3, 7, P.lgray); p.r(1, 9, 32, 2, P.dgray); });
  ART.vent = E.sprite(20, 20, p => { p.r(2, 7, 16, 12, P.lgray); p.r(2, 7, 16, 2, P.white); for (let y = 11; y < 18; y += 2) p.r(4, y, 12, 1, P.dgray); p.ell(10, 5, 6, 3, P.gray); p.r(9, 0, 2, 3, P.dgray); });
  ART.manhole = E.sprite(22, 7, p => { p.ell(11, 3, 10, 3, P.dgray); p.ell(11, 3, 8, 2, P.gray); p.r(6, 3, 10, 1, P.dgray); }, { ax: 11, ay: 3 });
  ART.manholeOpen = E.sprite(22, 7, p => { p.ell(11, 3, 10, 3, P.dgray); p.ell(11, 3, 8, 2, P.black); }, { ax: 11, ay: 3 });
  ART.doorway = E.sprite(22, 34, p => { p.r(0, 0, 22, 34, P.dbrown); p.r(2, 2, 18, 32, P.black); p.r(3, 3, 6, 30, '#1C1C1C'); p.r(0, 0, 22, 2, P.gold); }, { ax: 11, ay: 33 });
  ART.windowOpen = E.sprite(24, 22, p => { p.r(0, 0, 24, 22, P.lgray); p.r(2, 2, 20, 18, P.black); p.r(2, 2, 20, 4, P.crimson); p.r(0, 20, 24, 2, P.white); }, { ax: 12, ay: 21 });
  // debris colours used by the pixel burst when each object breaks
  ART.debris = {
    hydrant: [P.scarlet, P.crimson, P.salmon, P.white], trash: [P.gray, P.lgray, P.white, P.dgray], newsbox: [P.royal, P.ice, P.white, P.dgray],
    crate: [P.orange, P.tangerine, P.rust, P.gold], barrel: [P.royal, P.azure, P.dgray, P.lgray], bench: [P.orange, P.tangerine, P.lgray, P.gold],
    vent: [P.lgray, P.white, P.gray, P.dgray], lid: [P.lgray, P.gray, P.white], cone: [P.tangerine, P.white, P.orange]
  };
  // ---------------------------------------------------------------- throwables (loose objects you can pick up)
  ART.obj = {
    lid: E.sprite(16, 7, p => { p.ell(8, 3, 7, 2, P.lgray); p.r(2, 3, 12, 2, P.gray); p.r(6, 0, 4, 2, P.lgray); }, { ax: 8, ay: 6 }),
    cone: E.sprite(12, 15, p => { p.r(0, 12, 12, 3, P.tangerine); for (let y = 0; y < 12; y++) { const w = 2 + Math.floor(y * 0.6); p.r(6 - (w >> 1), y, w, 1, y > 4 && y < 8 ? P.white : P.tangerine); } }),
    crate: E.sprite(16, 14, p => { p.r(1, 1, 14, 12, P.orange); p.r(1, 1, 14, 2, P.tangerine); p.line(2, 3, 13, 12, 1, P.rust); p.r(1, 7, 14, 1, P.rust); }),
    barrel: E.sprite(20, 14, p => { p.r(1, 2, 18, 11, P.royal); p.r(1, 3, 18, 2, P.azure); p.r(4, 1, 2, 13, P.dgray); p.r(14, 1, 2, 13, P.dgray); p.ell(18, 7, 2, 5, P.lgray); })
  };
  ART.barrelRoll = [0, 1].map(f => E.sprite(20, 14, p => { p.r(1, 2, 18, 11, P.royal); p.r(1, 3 + f * 5, 18, 2, P.azure); p.r(4 + f * 4, 1, 2, 13, P.dgray); p.r(12 + f * 4, 1, 2, 13, P.dgray); }));
  ART.wrench = [0, 1, 2, 3].map(f => E.sprite(12, 12, p => {
    const a = f * Math.PI / 4, cx = 6, cy = 6, dx = Math.cos(a) * 4, dy = Math.sin(a) * 4;
    p.line(cx - dx, cy - dy, cx + dx, cy + dy, 2, P.lgray); p.r(cx + dx - 1, cy + dy - 1, 3, 3, P.lgray);
  }, { ax: 6, ay: 6 }));
  ART.token = E.sprite(8, 8, p => { p.ell(4, 4, 3, 3, P.gold); p.r(3, 3, 2, 2, P.olive); }, { ax: 4, ay: 4 });
  ART.cane = [0, 1, 2, 3].map(f => E.sprite(16, 16, p => { const a = f * Math.PI / 4, dx = Math.cos(a) * 6, dy = Math.sin(a) * 6; p.line(8 - dx, 8 - dy, 8 + dx, 8 + dy, 2, P.dbrown); p.r(8 + dx - 1, 8 + dy - 1, 3, 3, P.gold); }, { ax: 8, ay: 8 }));
  ART.spark = [0, 1].map(f => E.sprite(16, 16, p => {
    const c = f ? P.white : P.gold, r = f ? 6 : 4;
    p.line(8 - r, 8, 8 + r, 8, 1, c); p.line(8, 8 - r, 8, 8 + r, 1, c); p.line(8 - r + 2, 8 - r + 2, 8 + r - 2, 8 + r - 2, 1, c); p.line(8 - r + 2, 8 + r - 2, 8 + r - 2, 8 - r + 2, 1, c); p.r(7, 7, 3, 3, P.white);
  }, { ax: 8, ay: 8, outline: false }));
  ART.dust = [0, 1, 2].map(f => E.sprite(14, 10, p => { const r = 2 + f; p.ell(4, 6, r, r - 1, P.lgray); p.ell(9, 6, r, r - 1, P.white); }, { ax: 7, ay: 9, outline: false }));
  ART.star = E.sprite(7, 7, p => { p.rows(['...y...', '..yyy..', 'yyyyyyy', '.yyyyy.', '.yy.yy.', 'y.....y'], { y: P.gold }, 0, 0); }, { ax: 3, ay: 3, outline: false });
  ART.cuffs = E.sprite(16, 9, p => { p.ell(4, 4, 3, 3, P.lgray); p.ell(11, 4, 3, 3, P.lgray); p.r(3, 3, 3, 3, P.black); p.r(10, 3, 3, 3, P.black); p.r(7, 4, 2, 1, P.white); }, { ax: 8, ay: 4 });
  function softShadow(w, h) { // soft contact shadow at display resolution (drawn at w x h units)
    const R = E.RES, c = E.makeCanvas(w * R, h * R), g = c.getContext('2d');
    g.setTransform(1, 0, 0, h / w, 0, 0); const gr = g.createRadialGradient(c.width / 2, c.width / 2, 0, c.width / 2, c.width / 2, c.width / 2);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.width); return c;
  }
  ART.shadow = softShadow(28, 8);
  ART.shadowBig = softShadow(44, 10);
  ART.goBig = E.sprite(44, 20, p => { p.text('GO', 1, 6, P.gold, 2); p.rows(['y......', 'yyy....', 'yyyyy..', 'yyyyyyy', 'yyyyy..', 'yyy....', 'y......'].map(r => r.replace(/y/g, 'y')), { y: P.gold }, 27, 3); p.rows(['y......', 'yyy....', 'yyyyy..', 'yyyyyyy', 'yyyyy..', 'yyy....', 'y......'], { y: P.tangerine }, 33, 3); }, { ax: 22, ay: 10 });
  ART.goArrow = E.sprite(30, 14, p => { p.text('GO', 1, 3, P.gold); p.rows(['y....', 'yy...', 'yyy..', 'yyyy.', 'yyyyy', 'yyyy.', 'yyy..', 'yy...', 'y....'], { y: P.gold }, 15, 2); }, { ax: 15, ay: 7 });
  ART.shock = [0, 1, 2].map(f => E.sprite(20, 14, p => { const h = 4 + f * 3; p.r(4, 13 - h, 3, h, P.ice); p.r(9, 13 - h - 2, 3, h + 2, P.white); p.r(14, 13 - h, 3, h, P.ice); }, { ax: 10, ay: 13 }));

  // portrait: crop head area from idle frame
  function portrait(fr) {
    const R = E.RES, hd = fr.idle0.src.head, c = E.makeCanvas(18 * R, 18 * R), g = c.getContext('2d');
    if (!hd) { g.drawImage(fr.idle0.src, CX - 9, BASE - 40, 18, 18, 0, 0, 18 * R, 18 * R); return c; }
    const sz = Math.max(hd.hw, hd.hh) + 6, x0 = hd.hx + hd.hw / 2 - sz / 2 - 0.5, y0 = hd.hy + hd.hh / 2 - sz / 2 - 1.5;
    g.drawImage(fr.idle0.img, x0 * R, y0 * R, sz * R, sz * R, 0, 0, 18 * R, 18 * R); return c;
  }

  ART.build = function () {
    ART.hero = ART.HEROES.map(h => { const f = frames(h, HERO_FRAMES); f.portrait = portrait(f); return f; });
    ART.enemy = {}; for (const k in ART.ENEMIES) ART.enemy[k] = frames(ART.ENEMIES[k], EN_FRAMES, true);
    ART.boss = {}; for (const k in ART.BOSSES) { const f = frames(ART.BOSSES[k], EN_FRAMES.concat(['jump', 'slamup', 'slam', 'swingHi', 'swingMid', 'swingLo']), true); ART.boss[k] = f; }
    ART.dog = [0, 1, 2, 3].map(dog);
    ART.hurtLying = lying;
  };
})();
