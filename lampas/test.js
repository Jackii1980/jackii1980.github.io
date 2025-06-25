(async function () {
  const plugin = {
    title: 'ČSFD.cz',
    version: '1.0.0',
    description: 'Поиск фильмов и сериалов с ČSFD.cz',

    // Добавляем пункт в меню Lampas
    menu: () => {
      return [
        {
          title: 'Поиск на ČSFD.cz',
          search_on: true,
          url: 'csfd:search'
        }
      ];
    },

    // Функция поиска
    search: async (query) => {
      try {
        // 1. Ищем фильмы на ČSFD (через парсинг HTML)
        const searchUrl = `https://www.csfd.cz/hledat/?q=${encodeURIComponent(query)}`;
        const response = await fetch(searchUrl);
        const html = await response.text();

        // 2. Парсим результаты (используем DOMParser)
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const films = doc.querySelectorAll('.film-title a');

        // 3. Форматируем данные для Lampas
        const results = [];
        films.forEach((film) => {
          const title = film.textContent.trim();
          const url = film.href;
          const id = url.match(/film\/(\d+)\//)?.[1];

          if (id) {
            results.push({
              title: title,
              url: `csfd:film:${id}`, // Уникальный ID для Lampas
              id: id,
              type: 'movie' // или 'series'
            });
          }
        });

        return results;

      } catch (error) {
        console.error('ČSFD Plugin Error:', error);
        return []; // Возвращаем пустой массив при ошибке
      }
    },

    // Дополнительно: получение деталей фильма (опционально)
    item: async (id) => {
      const filmUrl = `https://www.csfd.cz/film/${id}/`;
      const response = await fetch(filmUrl);
      const html = await response.text();

      // Парсим год, описание, постер и т.д.
      // ...

      return {
        title: title,
        description: description,
        poster: posterUrl,
        year: year
      };
    }
  };

  // Регистрируем плагин в Lampas
  if (typeof Lampa !== 'undefined' && Lampa.Plugin) {
    Lampa.Plugin.register(plugin);
  } else {
    console.error('Lampa Plugin API не найден!');
  }
})();