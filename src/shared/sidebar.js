// Shared sidebar loader — fetches curriculum.json and renders navigation
// Uses import.meta.env.BASE_URL so links work under GitHub Pages subpaths.
(function () {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  const BASE = import.meta.env.BASE_URL || '/';
  const pagesBase = BASE + 'pages/';

  fetch(BASE + 'curriculum.json')
    .then((r) => r.json())
    .then((lessons) => {
      const cats = {};
      lessons.forEach((l) => {
        const cat = l.category || '其他';
        if (!cats[cat]) cats[cat] = [];
        cats[cat].push(l);
      });

      let html = '';
      const tierNames = { '★': '基础', '★★': '核心', '★★★': '前沿' };
      for (const tier of ['★', '★★', '★★★']) {
        const tierName = tierNames[tier];
        html += '<h3>' + tier + ' ' + tierName + '</h3>';

        const tierCats = {};
        lessons.forEach((l) => {
          if ((l.tier || '★★') !== tier) return;
          const cat = l.category || '其他';
          if (!tierCats[cat]) tierCats[cat] = [];
          tierCats[cat].push(l);
        });

        for (const [cat, items] of Object.entries(tierCats)) {
          html += '<h4 class="cat-head">' + cat + '</h4>';
          items.forEach((l) => {
            html +=
              '  <a href="' + pagesBase + l.id + '.html" class="cat-link">' +
              l.emoji +
              ' ' +
              l.title +
              '</a>';
          });
        }
      }

      sidebar.insertAdjacentHTML('beforeend', html);

      // Mark active link
      var page = location.pathname.split('/').pop().replace('.html', '');
      var links = sidebar.querySelectorAll('a');
      links.forEach(function (a) {
        if (a.getAttribute('href') === pagesBase + page + '.html')
          a.classList.add('active');
        // Ensure clicks navigate even if default behavior is blocked
        a.addEventListener('click', function (e) {
          var href = a.getAttribute('href');
          if (href && href !== '#') {
            e.preventDefault();
            window.location.href = href;
          }
        });
      });
    });
})();
