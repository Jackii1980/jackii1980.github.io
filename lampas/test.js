(async function () {
  const plugin = {
    title: 'ČSFD.cz',
    version: '1.0.0',
    description: 'Фильмы с чешской озвучкой',
    icon: 'https://i.imgur.com/5qY9XxD.png', // Иконка ČSFD (можно заменить на свою URL)

    menu: () => {
      return [
        {
          title: 'Поиск ČSFD',
          search_on: true,
          url: 'csfd:search'
        }
      ];
    },

    search: async (query) => {
      try {
        // 1. Ищем фильмы на ČSFD
        const response = await fetch(`https://www.csfd.cz/hledat/?q=${encodeURIComponent(query)}`);
        const html = await response.text();

        // 2. Парсим результаты
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const films = doc.querySelectorAll('.film-title a');

        // 3. Форматируем для Lampa
        const results = [];
        films.forEach((film) => {
          const title = film.textContent.trim();
          const url = film.href;
          const id = url.match(/film\/(\d+)\//)?.[1];

          if (id) {
            results.push({
              title: title,
              url: `csfd:${id}`,
              id: id,
              icon: 'https://i.imgur.com/5qY9XxD.png', // Иконка для каждого результата
              type: 'movie'
            });
          }
        });

        return results;

      } catch (error) {
        console.error('ČSFD Error:', error);
        return [];
      }
    },

    // Детали фильма (опционально)
    item: async (id) => {
      try {
        const filmUrl = `https://www.csfd.cz/film/${id}/`;
        const response = await fetch(filmUrl);
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        return {
          title: doc.querySelector('.film-title')?.textContent.trim() || 'Нет названия',
          description: doc.querySelector('.film-info')?.textContent.trim() || '',
          year: doc.querySelector('.film-year')?.textContent.trim() || '',
          poster: doc.querySelector('.film-poster img')?.src || '',
          icon: 'https://i.imgur.com/5qY9XxD.png' // Иконка в деталях
        };

      } catch (error) {
        console.error('ČSFD Details Error:', error);
        return null;
      }
    }
  };

  // Регистрация плагина
  if (typeof Lampa !== 'undefined' && Lampa.Plugin) {
    Lampa.Plugin.register(plugin);
  }
})();