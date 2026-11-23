(() => {
  const key = 'aragon-schole-theme';
  const params = new URLSearchParams(window.location.search);
  let theme = params.get('theme');
  if (theme !== 'light' && theme !== 'dark') {
    try {
      theme = window.localStorage.getItem(key);
    } catch {
      theme = null;
    }
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = theme;
})();
