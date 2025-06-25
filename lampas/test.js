(async function () {
  const plugin = {
    title: 'ČSFD.cz',
    version: '1.0.0',
    description: 'Фильмы с чешской озвучкой',
    icon: 'https://www.csfd.cz/img/logo.png', // Официальная иконка ČSFD

    menu: () => {
      return [
        {
          title: 'Поиск ČSFD',
          search_on: true,
          url: 'csfd:search'
        },
        {
          title: 'Топ ČSFD',
          url: 'csfd:top'
        }
      ];
    },

    search: async (query) => {
      try {
        const response = await fetch(`https://www.csfd.cz/hledat/?q=${encodeURIComponent(query)}`);
        const html = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const results = [];

        doc.querySelectorAll('.film-title').forEach(item => {
          const link = item.querySelector('a[href^="/film/"]');
          if (link) {
            results.push({
              title: link.textContent.trim(),
              url: link.href,
              id: link.href.match(/film\/(\d+)\//)[1],
              icon: 'https://www.csfd.cz/img/logo.png'
            });
          }
        });

        return results;

      } catch (e) {
        console.error('ČSFD Error:', e);
        return [];
      }
    },

    item: async (id) => {
      try {
        const response = await fetch(`https://www.csfd.cz/film/${id}/`);
        const html = await response.text();
        
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return {
          title: doc.querySelector('.film-title')?.textContent.trim() || '',
          description: doc.querySelector('.film-info')?.textContent.trim() || '',
          year: doc.querySelector('.film-year')?.textContent.trim() || '',
          poster: doc.querySelector('.film-poster img')?.src || '',
          icon: 'https://www.csfd.cz/img/logo.png'
        };
      } catch (e) {
        console.error('ČSFD Item Error:', e);
        return null;
      }
    }
  };

  // Регистрация плагина (как в вашем примере)
  if (typeof Lampa !== 'undefined' && Lampa.Plugin) {
    Lampa.Plugin.register(plugin);
  }
})();