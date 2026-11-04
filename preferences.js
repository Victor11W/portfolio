// Apply preferences before paint; storage may be unavailable in private browsing.
try {
  var savedTheme = localStorage.getItem('vw-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') document.documentElement.dataset.theme = savedTheme;
} catch {}
