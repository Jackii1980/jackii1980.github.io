// plugin.js
(function() {
  const plugin = {
    id: 'csfd_cz',
    title: 'ČSFD.cz',
    icon: 'https://i.imgur.com/5qY9XxD.png',
    description: 'База данных чешских фильмов',
    
    // Меню в Lampa
    menu: () => [{
      title: 'ČSFD Поиск',
      search_on: true,
      params: { type: 'csfd' }
    }],
    
    // Поиск фильмов
    search: async (query) => {
      try {
        const html = await fetch(`https://www.csfd.cz/hledat/?q=${encodeURIComponent(query)}`)
          .then(r => r.text());
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const items = [];
        
        doc.querySelectorAll('.film-title').forEach(el => {
          const link = el.querySelector('a');
          if (link) {
            items.push({
              title: link.textContent.trim(),
              url: link.href,
              id: link.href.match(/film\/(\d+)\//)?.[1]
            });
          }
        });
        
        return items.map(item => ({
          title: item.title,
          url: `csfd:${item.id}`,
          icon: 'https://i.imgur.com/5qY9XxD.png'
        }));
        
      } catch (e) {
        console.error('ČSFD Error:', e);
        return [];
      }
    },
    
    // Загрузка деталей
    item: async (id) => {
      const html = await fetch(`https://www.csfd.cz/film/${id}/`)
        .then(r => r.text());
      
      // Парсинг описания, года и постера
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return {
        title: doc.querySelector('.film-title')?.textContent.trim(),
        description: doc.querySelector('.film-description')?.textContent.trim(),
        year: doc.querySelector('.film-year')?.textContent.trim(),
        poster: doc.querySelector('.film-poster img')?.src
      };
    }
  };

  // Регистрация
  if (typeof Lampa !== 'undefined') {
    Lampa.Plugin.register(plugin);
  }
})();