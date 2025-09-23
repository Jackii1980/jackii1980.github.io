// prehrajto.js
let plugin = new Plugin({
    name: 'Prehrajto',
    id: 'prehrajto',
    version: '1.0.0',
    search: {
        search: search,
        filters: filters
    },
    source: {
        movie: source,
        tv: source
    }
});

function filters(){
    return [
        {
            name: 'genre',
            component: 'selector',
            config: {
                label: 'Жанр',
                value: '',
                options: [
                    {value: '', label: 'Все жанры'},
                    {value: 'akcni', label: 'Боевик'},
                    {value: 'komedie', label: 'Комедия'},
                    {value: 'drama', label: 'Драма'},
                    {value: 'fantasy', label: 'Фэнтези'},
                    {value: 'horor', label: 'Ужасы'},
                    {value: 'scifi', label: 'Научная фантастика'},
                    {value: 'thriller', label: 'Триллер'}
                ]
            }
        },
        {
            name: 'year',
            component: 'text',
            config: {
                label: 'Год',
                placeholder: 'Например: 2023'
            }
        }
    ]
}

async function search(keyword, page, filters){
    let url = 'https://prehrajto.cz/vyhledavani?query=' + encodeURIComponent(keyword);
    
    if(filters.genre) url += '&genre=' + filters.genre;
    if(filters.year) url += '&year=' + filters.year;
    
    if(page > 1) url += '&page=' + page;
    
    let html = await fetch(url);
    let parser = new DOMParser();
    let doc = parser.parseFromString(html, 'text/html');
    
    let results = [];
    
    // Парсинг результатов поиска
    let items = doc.querySelectorAll('.movie-item, .video-item');
    
    items.forEach(item => {
        let titleElem = item.querySelector('.title, h3');
        let posterElem = item.querySelector('.poster, img');
        let linkElem = item.querySelector('a');
        
        if(titleElem && linkElem){
            let title = titleElem.textContent.trim();
            let poster = posterElem ? posterElem.getAttribute('src') : '';
            let href = linkElem.getAttribute('href');
            
            // Проверка, фильм это или сериал
            let isSeries = title.toLowerCase().includes('seriál') || 
                          href.toLowerCase().includes('serial');
            
            results.push({
                title: title,
                poster: poster,
                href: href,
                type: isSeries ? 'tv' : 'movie'
            });
        }
    });
    
    return {
        results: results,
        hasMore: doc.querySelector('.pagination .next') !== null
    };
}

async function source(match){
    let html = await fetch('https://prehrajto.cz' + match.href);
    let parser = new DOMParser();
    let doc = parser.parseFromString(html, 'text/html');
    
    let sources = [];
    
    // Поиск видео источников
    let videoPlayers = doc.querySelectorAll('video, iframe, [data-video]');
    
    videoPlayers.forEach(player => {
        let src = player.getAttribute('src') || 
                 player.getAttribute('data-src') || 
                 player.getAttribute('data-video');
        
        if(src && !src.includes('ads')){
            // Проверка качества видео
            let quality = '720p';
            let qualityMatch = src.match(/(\d+p)/);
            if(qualityMatch) quality = qualityMatch[1];
            
            sources.push({
                url: src,
                quality: quality,
                type: src.includes('m3u8') ? 'hls' : 'mp4'
            });
        }
    });
    
    // Если прямые источники не найдены, пробуем извлечь из JavaScript
    if(sources.length === 0){
        let scriptTags = doc.querySelectorAll('script');
        for(let script of scriptTags){
            let scriptContent = script.textContent;
            
            // Поиск видео URL в JavaScript
            let videoUrlMatches = scriptContent.match(/(https?:\/\/[^\s"']*\.(mp4|m3u8|webm)[^\s"']*)/gi);
            if(videoUrlMatches){
                videoUrlMatches.forEach(url => {
                    if(!url.includes('ads')){
                        sources.push({
                            url: url,
                            quality: '720p',
                            type: url.includes('m3u8') ? 'hls' : 'mp4'
                        });
                    }
                });
            }
        }
    }
    
    return {
        sources: sources,
        name: match.title,
        poster: match.poster
    };
}

// Функция для fetch с заголовками
async function fetch(url){
    return new Promise((resolve, reject) => {
        network.http(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://prehrajto.cz/',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        })
        .then(response => resolve(response.text()))
        .catch(error => reject(error));
    });
}

// Регистрация плагина
plugin.register();