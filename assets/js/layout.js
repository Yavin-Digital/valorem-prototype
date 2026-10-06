/* Shared header, screen menu, and footer mount. Loaded after site.js. */
(function () {
  var V = window.Valorem;
  if (!V) return;
  V.mountChrome();
  window.ValoremLayout = {
    mountFooter: function () { V.mountFooter(); }
  };
})();
