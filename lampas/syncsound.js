(function() {
    const pluginId = 'syncsound';
    const pluginTitle = 'СинхроЗвук';
    const settingsTitle = 'Настройки СинхроЗвука';

    // 1. Ожидание полной загрузки Lampa
    function waitForLampa(callback) {
        if (window.Lampa && Lampa.Storage && Lampa.Settings) {
            callback();
        } else {
            setTimeout(() => waitForLampa(callback), 100);
        }
    }

    // 2. Основные функции плагина (без изменений)
    function aiAnalyzeAudioTrack(track) {
        // ... ваша реализация ...
    }

    function normalizeAudioSettings(audioTracks) {
        // ... ваша реализация ...
    }

    function onVideoReady(event) {
        // ... ваша реализация ...
    }

    // 3. Совместимое создание меню
    function createPluginMenu() {
        try {
            // Альтернатива для старых версий без addCategory
            Lampa.Settings.add(pluginId, {
                title: settingsTitle,
                items: [
                    {
                        name: 'Ночной режим',
                        type: 'toggle',
                        value: Lampa.Storage.get(pluginId + '_nightmode', false),
                        onchange: (val) => Lampa.Storage.set(pluginId + '_nightmode', val)
                    },
                    {
                        name: 'Нормализация речи',
                        type: 'toggle',
                        value: Lampa.Storage.get(pluginId + '_speechnorm', true),
                        onchange: (val) => Lampa.Storage.set(pluginId + '_speechnorm', val)
                    }
                ]
            });

            // Универсальное добавление в меню
            if (Lampa.Menu && Lampa.Menu.add) {
                Lampa.Menu.add({
                    name: pluginTitle,
                    icon: 'volume_up',
                    action: function() {
                        Lampa.Activity.push({
                            component: 'settings',
                            url: '',
                            id: pluginId
                        });
                    }
                });
                console.log('Пункт меню добавлен');
            }

        } catch (e) {
            console.error('Ошибка создания меню:', e);
        }
    }

    // 4. Инициализация плагина
    function initPlugin() {
        console.log('Инициализация плагина ' + pluginTitle);
        createPluginMenu();
        
        if (Lampa.Events) {
            Lampa.Events.subscribe('video_ready', onVideoReady);
        }
    }

    // 5. Запуск плагина
    waitForLampa(() => {
        // Для самых старых версий
        if (typeof Lampa.Plugin !== 'undefined') {
            Lampa.Plugin.register({
                name: pluginId,
                title: pluginTitle,
                version: '1.0.6',
                description: 'Оптимизация аудиодорожек',
                onLoad: initPlugin
            });
        } else {
            // Прямая инициализация
            initPlugin();
        }
    });

    // 6. Дублирующий вызов для надежности
    document.addEventListener('DOMContentLoaded', initPlugin);
    if (document.readyState === 'complete') initPlugin();
})();