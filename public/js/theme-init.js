/* Runs before the page paints so the chosen theme never flashes the wrong colours. */
(function () {
  var t = null;
  try { t = JSON.parse(localStorage.getItem('rm-theme')); } catch (e) { t = null; }
  if (t !== 'light' && t !== 'dark') {
    t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', t);
})();
