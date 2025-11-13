(function () {
  var browserBanner = document.getElementById('unsupported-browser');
  if (!browserBanner) return;

  var hasModernApis = typeof window.fetch === 'function' && typeof window.Promise === 'function';
  if (!hasModernApis) {
    browserBanner.classList.add('is-visible');
  }
})();
