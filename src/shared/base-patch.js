// Rewrite absolute internal links to respect the deployment base path.
// Used on hand-written pages (index/learn/quals/graph) so they work under
// GitHub Pages project subpaths, e.g. https://user.github.io/vibe_math/
const BASE = import.meta.env.BASE_URL || '/';

if (BASE !== '/' && location.hostname !== 'localhost' && !location.hostname.includes('127.0.0.1')) {
  document.querySelectorAll('a[href^="/"]').forEach(function (a) {
    var h = a.getAttribute('href');
    // skip protocol-relative and already-prefixed links
    if (h.length > 1 && !h.startsWith('//') && !h.startsWith(BASE)) {
      a.setAttribute('href', BASE + h.slice(1));
    }
  });
}
