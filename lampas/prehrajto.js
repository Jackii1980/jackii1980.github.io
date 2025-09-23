// @signature basic-test-signature-v1
// @version 1.0.0
// @name Prehrajto
// @id prehrajto.cz

(function() {
    'use strict';
    
    if (typeof Plugin === 'undefined') {
        console.error('Lampa Plugin API not found');
        return;
    }

    let plugin = new Plugin({
        name: 'Prehrajto.cz',
        id: 'prehrajto',
        version: '1.0.0',
        description: 'Watch movies and series from prehrajto.cz',
        site: 'https://prehrajto.cz/',
        search: {
            search: search,
            filters: filters
        },
        source: {
            movie: source,
            tv: source
        }
    });

    function filters() {
        return [
            {
                name: 'sort',
                component: 'selector',
                config: {
                    label: 'Сортировка',
                    value: 'newest',
                    options: [
                        {value: 'newest', label: 'Сначала новые'},
                        {value: 'oldest', label: 'Сначала старые'},
                        {value: 'popular', label: 'По популярности'}
                    ]
                }
            }
        ];
    }

    async function search(keyword, page, filters) {
        try {
            console.log('Searching for:', keyword, 'page:', page);
            
            // Формируем URL для поиска
            let searchUrl = `https://prehrajto.cz/hledat/${encodeURIComponent(keyword)}`;
            if (page > 1) searchUrl += `?page=${page}`;
            
            const response = await fetch(searchUrl);
            const html = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const results = [];
            
            // Парсим результаты - адаптируйте селекторы под реальную структуру сайта
            const items = doc.querySelectorAll('.movie-item, .film-item, .item, [class*="movie"], [class*="film"]');
            
            items.forEach(item => {
                try {
                    const titleElem = item.querySelector('h2, h3, .title, .name, [class*="title"]');
                    const linkElem = item.querySelector('a');
                    const imgElem = item.querySelector('img');
                    
                    if (titleElem && linkElem) {
                        const title = titleElem.textContent.trim();
                        let href = linkElem.getAttribute('href');
                        const poster = imgElem ? imgElem.getAttribute('src') : '';
                        
                        if (href && !href.startsWith('http')) {
                            href = 'https://prehrajto.cz' + (href.startsWith('/') ? href : '/' + href);
                        }
                        
                        // Определяем тип контента
                        const isSeries = title.toLowerCase().includes('seriál') || 
                                       href.toLowerCase().includes('serial') ||
                                       href.toLowerCase().includes('series');
                        
                        results.push({
                            title: title,
                            poster: poster,
                            href: href,
                            type: isSeries ? 'tv' : 'movie'
                        });
                    }
                } catch (e) {
                    console.error('Error parsing item:', e);
                }
            });
            
            // Если не нашли стандартным способом, ищем по ссылкам
            if (results.length === 0) {
                const links = doc.querySelectorAll('a[href*="/film/"], a[href*="/serial/"], a[href*="/movie/"]');
                links.forEach(link => {
                    const href = link.getAttribute('href');
                    const title = link.textContent.trim();
                    
                    if (title && title.length > 2) {
                        const isSeries = href.includes('/serial/') || href.includes('/series/');
                        
                        results.push({
                            title: title,
                            poster: '',
                            href: href.startsWith('http') ? href : 'https://prehrajto.cz' + href,
                            type: isSeries ? 'tv' : 'movie'
                        });
                    }
                });
            }
            
            console.log('Found', results.length, 'results');
            
            return {
                results: results,
                hasMore: doc.querySelector('.pagination, .next, [class*="page"]') !== null
            };
            
        } catch (error) {
            console.error('Search error:', error);
            return {
                results: [],
                hasMore: false
            };
        }
    }

    async function source(match) {
        try {
            console.log('Getting source for:', match.title);
            
            let url = match.href;
            if (!url.startsWith('http')) {
                url = 'https://prehrajto.cz' + (url.startsWith('/') ? url : '/' + url);
            }
            
            const response = await fetch(url);
            const html = await response.text();
            
            const sources = [];
            
            // Ищем iframe с видео
            const iframeRegex = /<iframe[^>]*src="([^"]+)"[^>]*>/gi;
            let iframeMatch;
            while ((iframeMatch = iframeRegex.exec(html)) !== null) {
                const iframeUrl = iframeMatch[1];
                if (iframeUrl && !iframeUrl.includes('ad')) {
                    sources.push({
                        url: iframeUrl,
                        quality: '720p',
                        type: 'iframe',
                        name: 'Video Player'
                    });
                }
            }
            
            // Ищем прямые ссылки на видео
            const videoRegex = /(https?:\/\/[^\s"']*\.(mp4|m3u8|mkv|avi)[^\s"']*)/gi;
            let videoMatch;
            while ((videoMatch = videoRegex.exec(html)) !== null) {
                const videoUrl = videoMatch[1];
                if (videoUrl && !videoUrl.includes('ad')) {
                    sources.push({
                        url: videoUrl,
                        quality: videoUrl.includes('1080') ? '1080p' : 
                                videoUrl.includes('720') ? '720p' : '480p',
                        type: videoUrl.includes('.m3u8') ? 'hls' : 'mp4'
                    });
                }
            }
            
            // Ищем в JSON данных
            const jsonRegex = /(?:file|url|source)\s*[:=]\s*["']([^"']+\.(mp4|m3u8))["']/gi;
            let jsonMatch;
            while ((jsonMatch = jsonRegex.exec(html)) !== null) {
                const videoUrl = jsonMatch[1];
                if (videoUrl.startsWith('http')) {
                    sources.push({
                        url: videoUrl,
                        quality: '720p',
                        type: videoUrl.includes('.m3u8') ? 'hls' : 'mp4'
                    });
                }
            }
            
            console.log('Found', sources.length, 'sources');
            
            return {
                sources: sources,
                name: match.title,
                poster: match.poster || '',
                quality: sources.length > 0 ? 'Доступно' : 'Нет источников'
            };
            
        } catch (error) {
            console.error('Source error:', error);
            return {
                sources: [],
                name: match.title,
                poster: match.poster || ''
            };
        }
    }

    // Улучшенная функция fetch
    async function fetch(url) {
        return new Promise((resolve, reject) => {
            network.http(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'cs,en;q=0.9,ru;q=0.8',
                    'Referer': 'https://prehrajto.cz/'
                },
                timeout: 10000
            })
            .then(response => {
                if (response.status === 200) {
                    resolve(response);
                } else {
                    reject(new Error(`HTTP ${response.status}`));
                }
            })
            .catch(error => reject(error));
        });
    }

    // Регистрируем плагин
    try {
        plugin.register();
        console.log('✅ Prehrajto plugin registered successfully');
    } catch (error) {
        console.error('❌ Failed to register plugin:', error);
    }

})();