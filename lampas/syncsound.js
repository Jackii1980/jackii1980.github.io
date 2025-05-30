(function() {
    const pluginId = 'syncsound';
    const pluginTitle = 'СинхроЗвук';
    const settingsTitle = 'Настройки СинхроЗвука';

    // 1. Проверка основных компонентов Lampa
    if (!window.Lampa || !Lampa.Storage || !Lampa.Settings) {
        console.error('Недостаточно API для работы плагина');
        return;
    }

    // 2. Основные функции плагина
    function aiAnalyzeAudioTrack(track) {
        // ... (ваша реализация) ...
    }

    function normalizeAudioSettings(audioTracks) {
        // ... (ваша реализация) ...
    }

    // 3. Создание меню (совместимый способ)
    function createPluginMenu() {
        try {
            // Добавление настроек
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

            // Добавление в главное меню
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
                console.log('Пункт меню успешно добавлен');
            }
        } catch (e) {
            console.error('Ошибка создания меню:', e);
        }
    }

    // 4. Инициализация
    function init() {
        console.log('Инициализация плагина', pluginTitle);
        createPluginMenu();
        
        if (Lampa.Events) {
            Lampa.Events.subscribe('video_ready', onVideoReady);
        }
    }

    // 5. Старт плагина
    if (window.LampaReady) {
        init();
    } else {
        document.addEventListener('lampa-loaded', init);
    }
})();