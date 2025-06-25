// csfd-plugin/plugin.json
{
  "name": "ČSFD Info",
  "version": "1.0.0",
  "description": "Интеграция ČSFD.cz с LAMPA (только метаданные)",
  "plugin": "plugin.js",
  "type": "video",
  "id": "csfd-info"
}

// csfd-plugin/plugin.js
(async function () {
  const plugin = {
    title: 'ČSFD.cz',
    version: '1.0.0',
    description: 'Поиск и метаданные с ČSFD.cz',

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
      const response = await fetch(`https://api.czdb.cz/api/search?q=${encodeURIComponent(query)}`);
      const json = await response.json();
      const results = json.items || [];
      return results.map(item => ({
        title: item.name,
        original_title: item.original_title,
        year: item.year,
        description: item.plot,
        icon: item.poster_url,
        url: `csfd:movie:${item.id}`
      }));
    },

    item: async (url) => {
      const id = url.split(':')[2];
      const response = await fetch(`https://api.czdb.cz/api/detail?id=${id}`);
      const data = await response.json();
      return {
        title: data.name,
        original_title: data.original_title,
        description: data.plot,
        rating: data.rating,
        icon: data.poster_url,
        genres: data.genres,
        country: data.country,
        year: data.year,
        quality: 'HD',
        links: []
      };
    }
  };

  if (window.registerPlugin) {
    window.registerPlugin(plugin);
  }
})();
