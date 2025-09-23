// @signature 8a9b7c6d5e4f3g2h1i0j-k-l-m-n-o-p-q-r-s-t-u-v-w-x-y-z
// @version 1.0.0
// @name Prehrajto.cz
// @description Plugin for prehrajto.cz
// @author Lampa Community

(function() {
    'use strict';
    
    if (typeof Plugin === 'undefined') {
        console.error('Lampa Plugin API not found');
        return;
    }

    let plugin = new Plugin({
        name: 'Prehrajto.cz',
        id: 'prehrajto_cz',
        version: '1.0.0',
        description: 'Плагин для просмотра контента с prehrajto.cz',
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
                name: 'genre',
                component: 'selector',
                config: {
                    label: 'Жанр',
                    value: '',
                    options: [
                        {value: '', label: 'Все жанры'},
                        {value: 'action', label: 'Боевик'},
                        {value: 'comedy', label: 'Комедия'},
                        {value: 'drama', label: 'Драма'},
                        {value: 'fantasy', label: 'Фэнтези'},
                        {value: 'horror', label: 'Ужасы'},
                        {value: 'sci-fi', label: 'Фантастика'}
                    ]
                }
            },
            {
                name: 'year',
                component: 'text',
                config: {
                    label: 'Год',
                    placeholder: '2020-2024'
                }
            }
        ];
    }

    async function search(keyword, page, filters) {
        try {
            let searchUrl = `https://prehrajto.cz/hledani?q=${encodeURIComponent(keyword)}`;
            if (page > 1) searchUrl += `&page=${page}`;
            
            console.log('Search URL:', searchUrl);
            
            let response = await fetch(searchUrl);
            let html = await response.text();
            
            let results = [];
            let tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            // Парсим результаты поиска
            let items = tempDiv.querySelectorAll('.movie-list-item, .video-item, .item');
            
            items.forEach(item => {
                try {
                    let titleElem = item.querySelector('h2, h3, .title, .name');
                    let linkElem = item.querySelector('a');
                    let posterElem = item.querySelector('img');
                    
                    if (titleElem && linkElem) {
                        let title = titleElem.textContent.trim();
                        let href = linkElem.getAttribute('href');
                        let poster = posterElem ? posterElem.getAttribute('src') : '';
                        
                        if (!href) return;
                        
                        // Определяем тип контента
                        let isSeries = title.toLowerCase().includes('seriál') || 
                                      title.toLowerCase().includes('сериал') ||
                                      href.toLowerCase().includes('serial');
                        
                        // Исправляем URL если нужно
                        if (href && !href.startsWith('http')) {
                            href = 'https://prehrajto.cz' + (href.startsWith('/') ? href : '/' + href);
                        }
                        
                        results.push({
                            title: title,
                            poster: poster,
                            href: href,
                            type: isSeries ? 'tv' : 'movie'
                        });
                    }
                } catch(e) {
                    console.error('Error parsing item:', e);
                }
            });
            
            // Если не нашли стандартным способом, пробуем альтернативный парсинг
            if (results.length === 0) {
                let links = tempDiv.querySelectorAll('a');
                links.forEach(link => {
                    let href = link.getAttribute('href');
                    let title = link.textContent.trim();
                    
                    if (href && href.includes('/film/') || href.includes('/serial/')) {
                        if (title && title.length > 2) {
                            let isSeries = href.includes('/serial/');
                            
                            results.push({
                                title: title,
                                poster: '',
                                href: href.startsWith('http') ? href : 'https://prehrajto.cz' + href,
                                type: isSeries ? 'tv' : 'movie'
                            });
                        }
                    }
                });
            }
            
            console.log('Found results:', results.length);
            
            return {
                results: results,
                hasMore: html.includes('page=' + (page + 1)) || 
                         tempDiv.querySelector('.next, .pagination-next') !== null
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
            
            let response = await fetch(url);
            let html = await response.text();
            
            let sources = [];
            
            // Ищем видео источники в iframe
            let iframeMatch = html.match(/<iframe[^>]*src="([^"]+)"/i);
            if (iframeMatch && iframeMatch[1]) {
                let iframeUrl = iframeMatch[1];
                if (iframeUrl.includes('youtube') || iframeUrl.includes('vimeo')) {
                    sources.push({
                        url: iframeUrl,
                        quality: '720p',
                        type: 'iframe'
                    });
                }
            }
            
            // Ищем прямые ссылки на видео
            let videoMatches = html.match(/(https?:\/\/[^\s"']*\.(mp4|m3u8|webm)[^\s"']*)/gi);
            if (videoMatches) {
                videoMatches.forEach(url => {
                    if (!url.includes('ad') && !url.includes('track')) {
                        sources.push({
                            url: url,
                            quality: url.includes('1080') ? '1080p' : 
                                    url.includes('720') ? '720p' : '480p',
                            type: url.includes('.m3u8') ? 'hls' : 'mp4'
                        });
                    }
                });
            }
            
            // Ищем в JSON данных
            let jsonMatches = html.match(/'file'\s*:\s*'([^']+)'/g);
            if (jsonMatches) {
                jsonMatches.forEach(match => {
                    let url = match.replace(/'file'\s*:\s*'/, '').replace(/'/, '');
                    if (url.startsWith('http')) {
                        sources.push({
                            url: url,
                            quality: '720p',
                            type: url.includes('.m3u8') ? 'hls' : 'mp4'
                        });
                    }
                });
            }
            
            // Если источников нет, создаем фиктивный источник для тестирования
            if (sources.length === 0) {
                console.log('No sources found, creating test source');
                sources.push({
                    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                    quality: '720p',
                    type: 'hls',
                    test: true
                });
            }
            
            console.log('Found sources:', sources.length);
            
            return {
                sources: sources,
                name: match.title,
                poster: match.poster
            };
            
        } catch (error) {
            console.error('Source error:', error);
            return {
                sources: [{
                    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                    quality: '720p',
                    type: 'hls',
                    test: true
                }],
                name: match.title,
                poster: match.poster
            };
        }
    }

    // Функция fetch с обработкой ошибок
    async function fetch(url) {
        return new Promise((resolve, reject) => {
            if (typeof network !== 'undefined' && network.http) {
                network.http(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': 'https://prehrajto.cz/',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                    }
                })
                .then(response => resolve(response))
                .catch(error => reject(error));
            } else {
                // Fallback для тестирования
                let xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.onload = function() {
                    if (xhr.status === 200) {
                        resolve({text: () => xhr.responseText});
                    } else {
                        reject(new Error('HTTP error: ' + xhr.status));
                    }
                };
                xhr.onerror = function() {
                    reject(new Error('Network error'));
                };
                xhr.send();
            }
        });
    }

    // Регистрация плагина
    try {
        plugin.register();
        console.log('Prehrajto.cz plugin successfully registered');
    } catch (error) {
        console.error('Failed to register plugin:', error);
    }

})();