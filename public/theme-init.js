// Apply the saved appearance before the first paint. Light is the default until a visitor picks dark.
try { document.documentElement.dataset.theme = localStorage.getItem('hugos-theme') === 'dark' ? 'dark' : 'light'; }
catch { document.documentElement.dataset.theme = 'light'; }
