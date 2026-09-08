// Shared lesson initialization — KaTeX rendering, sidebar, keyboard shortcuts
import './katex-init.js';
import './sidebar.js';
import './micro-viz-demos.js';

(function () {
  var BASE = import.meta.env.BASE_URL || '/';

  // Rewrite absolute internal links for GitHub Pages subpath deployment
  if (BASE !== '/') {
    var rewrite = function (a) {
      var h = a.getAttribute('href');
      if (h && h.length > 1 && h.charAt(0) === '/' && !h.startsWith('//') && !h.startsWith(BASE)) {
        a.setAttribute('href', BASE + h.slice(1));
      }
    };
    document.querySelectorAll('a[href^="/"]').forEach(rewrite);
    // handle dynamically added links too
    var obs = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType === 1 && n.tagName === 'A') rewrite(n);
          else if (n.nodeType === 1) n.querySelectorAll && n.querySelectorAll('a[href^="/"]').forEach(rewrite);
        });
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  // Ensure all internal navigation links work
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href === '#' || href.startsWith('http')) return;
    var pagesPrefix = BASE + 'pages/';
    if (href.indexOf('pages/') !== -1 && href.indexOf('.html') !== -1) {
      e.preventDefault();
      window.location.href = href;
    }
  });

  // Table of contents + scroll spy
  var tocToggle = document.getElementById('toc-toggle');
  var contentCol = document.querySelector('.content-col');
  if (tocToggle && contentCol) {
    var panel = document.createElement('div');
    panel.className = 'toc-panel';
    panel.id = 'toc-panel';
    tocToggle.parentNode.insertBefore(panel, tocToggle.nextSibling);

    var headings = contentCol.querySelectorAll('h3');
    if (headings.length > 0) {
      headings.forEach(function (h, i) {
        h.id = 'sec-' + i;
        var a = document.createElement('a');
        a.textContent = h.textContent;
        a.href = '#sec-' + i;
        a.addEventListener('click', function (ev) {
          ev.preventDefault();
          var el = document.getElementById('sec-' + i);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            panel.classList.remove('open');
          }
        });
        panel.appendChild(a);
      });
      tocToggle.style.display = 'flex';
      tocToggle.addEventListener('click', function () {
        panel.classList.toggle('open');
      });
      // scroll spy
      var links = panel.querySelectorAll('a');
      contentCol.addEventListener('scroll', function () {
        var cur = -1;
        headings.forEach(function (h, i) {
          var rect = h.getBoundingClientRect();
          var colRect = contentCol.getBoundingClientRect();
          if (rect.top >= colRect.top - 10 && rect.top < colRect.top + 60) cur = i;
        });
        if (cur >= 0) {
          links.forEach(function (l, j) { l.classList.toggle('cur', j === cur); });
        }
      });
    } else {
      tocToggle.style.display = 'none';
    }
  }

  // Reading progress bar + back-to-top
  var progressBar = document.getElementById('progress-bar');
  var backTop = document.getElementById('back-top');
  var scrollTarget = contentCol || window;
  var onScroll = function () {
    var el = contentCol;
    var scrollTop = el ? el.scrollTop : window.scrollY;
    var scrollHeight = el ? el.scrollHeight - el.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
    var pct = scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0;
    if (progressBar) progressBar.style.width = pct + '%';
    if (backTop) backTop.classList.toggle('show', scrollTop > 400);
  };
  if (contentCol) contentCol.addEventListener('scroll', onScroll);
  else window.addEventListener('scroll', onScroll);
  if (backTop) {
    backTop.addEventListener('click', function () {
      if (contentCol) contentCol.scrollTo({ top: 0, behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        var prev = document.getElementById('prev-lesson');
        if (prev && prev.style.visibility !== 'hidden' && prev.href && prev.href !== '#') {
          window.location.href = prev.href;
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        var next = document.getElementById('next-lesson');
        if (next && next.style.visibility !== 'hidden' && next.href && next.href !== '#') {
          window.location.href = next.href;
        }
        break;
      case 'Escape':
        var sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
        }
        var tocPanel = document.getElementById('toc-panel');
        if (tocPanel) tocPanel.classList.remove('open');
        break;
      case 'b':
      case 'B':
        var sb = document.querySelector('.sidebar');
        if (sb) sb.classList.toggle('open');
        break;
    }
  });
})();
