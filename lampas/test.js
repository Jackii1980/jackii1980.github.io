
(async function () {
  const plugin = {
    title: 'ČSFD.cz',
    version: '1.0.0',
    description: 'Фильмы с чешской озвучкой',
    icon: 'https://www.csfd.cz/img/logo.png',

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

        const results = [];
        const regex = /<a href="\/film\/(\d+)\/[^"]+"[^>]*>(.*?)<\/a>/g;
        let match;

        while ((match = regex.exec(html)) !== null) {
          results.push({
            title: match[2].trim(),
            url: `csfd:item:${match[1]}`,
            id: match[1],
            icon: 'https://www.csfd.cz/img/logo.png'
          });
        }

        return results;
      } catch (e) {
        console.error('ČSFD Search Error:', e);
        return [];
      }
    },

    item: async (url) => {
      const id = url.split(':')[2];
      try {
        const response = await fetch(`https://www.csfd.cz/film/${id}/`);
        const html = await response.text();

        const title = (html.match(/<h1[^>]*>(.*?)<\/h1>/) || [])[1] || 'Без названия';
        const description = (html.match(/<p class="plot[^"]*">([^<]+)<\/p>/) || [])[1] || 'Без описания';
        const poster = (html.match(/<img src="([^"]+)"[^>]*class="film-poster"/) || [])[1] || '';

        return {
          title: title.trim(),
          description: description.trim(),
          icon: 'https://www.csfd.cz/img/logo.png',
          poster: poster,
          year: '',
          quality: 'HD',
          links: []
        };
      } catch (e) {
        console.error('ČSFD Item Error:', e);
        return null;
      }
    }
  };

  if (typeof Lampa !== 'undefined' && Lampa.Plugin) {
    Lampa.Plugin.register(plugin);
  }
})();
