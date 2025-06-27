
(async function () {
  const plugin = {
    title: 'ČSFD.cz',
    version: '1.0.0',
    description: 'Поиск фильмов на ČSFD.cz с видео от HDVB/FanCDN',
    icon: 'https://www.csfd.cz/img/logo.png',

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
        const title = (html.match(/<title>(.*?)\|/) || [])[1]?.trim() || 'Без названия';
        const poster = (html.match(/<img src="([^"]+)"[^>]*class="film-poster"/) || [])[1] || '';
        const description = (html.match(/<p class="plot[^"]*">([^<]+)<\/p>/) || [])[1] || '';
        const year = (html.match(/\b(19|20)\d{2}\b/) || [])[0] || '';

        const searchQuery = encodeURIComponent(title + ' ' + year);
        const links = [];

        // HDVB
        try {
          const hdvb = await fetch(`https://apivb.info/api/videos.json?title=${searchQuery}`);
          const hdvbData = await hdvb.json();
          if (hdvbData && hdvbData.data && hdvbData.data.length) {
            links.push({
              title: 'HDVB',
              url: `https://apivb.info/play/${hdvbData.data[0].id}`,
              quality: 'HD',
              player: true
            });
          }
        } catch {}

        // FanCDN (fallback)
        try {
          const fan = await fetch(`https://apivb.info/api/fansearch?title=${searchQuery}`);
          const fanData = await fan.json();
          if (fanData && fanData.data && fanData.data.length) {
            links.push({
              title: 'FanCDN',
              url: fanData.data[0].iframe,
              quality: 'HD',
              player: true
            });
          }
        } catch {}

        return {
          title: title,
          description: description,
          year: year,
          icon: 'https://www.csfd.cz/img/logo.png',
          poster: poster,
          links: links
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
