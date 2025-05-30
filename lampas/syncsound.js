(function() {
    const pluginId = 'syncsound';
    const pluginTitle = 'СинхроЗвук';

    // 1. Современный способ проверки Lampa
    function checkLampaAPI() {
        const required = ['Storage', 'Settings', 'Events', 'Menu', 'Activity'];
        return required.every(api => {
            const exists = window.Lampa && Lampa[api];
            if (!exists) console.error(`Lampa.${api} не доступен!`);
            return exists;
        });
    }

    // 2. Альтернативная регистрация плагина
    if (!window.Lampa) {
        console.error('Lampa не обнаружена!');
        return;
    }

    // 3. Основные функции плагина (без изменений)
    // ... (aiAnalyzeAudioTrack, normalizeAudioSettings и др.) ...

    function createSettings() {
        try {
            // Создаем категорию настроек
            Lampa.Settings.addCategory(pluginId, {
                title: pluginTitle,
                icon: 'equalizer',
                component: pluginId
            });

            // Добавляем настройки
            Lampa.Settings.add(pluginId, {
                title: pluginTitle,
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

            // Добавляем пункт в меню (новый способ)
            Lampa.Menu.main.add({
                name: pluginTitle,
                icon: 'equalizer',
                action: () => {
                    Lampa.Activity.push({
                        component: 'settings',
                        url: '',
                        id: pluginId
                    });
                }
            });

        } catch (e) {
            console.error('Ошибка создания настроек:', e);
        }
    }

    // 4. Инициализация с проверкой готовности
    function initPlugin() {
        if (!checkLampaAPI()) return;

        console.log('Инициализация плагина...');
        createSettings();
        
        Lampa.Events.subscribe('video_ready', onVideoReady);
    }

    // 5. Современный способ загрузки плагина
    if (Lampa.API && Lampa.API.addPlugin) {
        // Для новых версий Lampa
        Lampa.API.addPlugin({
            id: pluginId,
            name: pluginTitle,
            callback: initPlugin
        });
    } else {
        // Для старых версий
        document.addEventListener('lampa-loaded', initPlugin);
        if (window.LampaReady) initPlugin();
    }
})();