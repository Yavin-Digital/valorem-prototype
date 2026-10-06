/* Shared header, screen menu, and footer mount. Loaded after site.js. */
(function () {
  var V = window.Valorem;
  if (!V) return;
  V.mountChrome();
  function syncChrome() {
    var top = document.getElementById("chrome-top");
    if (!top) return;
    var h = Math.ceil(top.getBoundingClientRect().height);
    if (h > 0) {
      document.documentElement.style.setProperty("--chrome", h + "px");
      var sticky = getComputedStyle(top).position === "sticky";
      document.documentElement.style.scrollPaddingTop = ((sticky ? h : 0) + 12) + "px";
    }
  }
  syncChrome();
  window.addEventListener("resize", syncChrome);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncChrome);
  window.ValoremLayout = {
    mountFooter: function () { V.mountFooter(); }
  };
})();
