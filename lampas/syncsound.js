(function() {
    const pluginId = 'syncsound';
    const pluginTitle = 'СинхроЗвук';
    const settingsTitle = 'Настройки СинхроЗвука';

    // Проверка и ожидание загрузки Lampa
    function waitForLampa(callback) {
        if (window.Lampa && Lampa.Storage && Lampa.Settings) {
            callback();
        } else {
            setTimeout(() => waitForLampa(callback), 100);
        }
    }

    // Основные функции плагина остаются без изменений
    // ... (aiAnalyzeAudioTrack, normalizeAudioSettings, applyNightMode, onVideoReady) ...

    function createPluginSettings() {
        try {
            // Создаем отдельную категорию настроек
            Lampa.Settings.addCategory(pluginId, {
                title: settingsTitle,  // Используем новое название
                icon: 'graphic_eq',   // Иконка эквалайзера
                component: pluginId + '_settings'
            });

            // Настройки плагина
            Lampa.Settings.add(pluginId + '_settings', {
                title: settingsTitle,  // Новое название в заголовке
                items: [
                    {
                        name: 'Ночной режим',
                        description: 'Уменьшает громкость резких звуков',
                        type: 'toggle',
                        value: Lampa.Storage.get(pluginId + '_nightmode', false),
                        onchange: (val) => Lampa.Storage.set(pluginId + '_nightmode', val)
                    },
                    {
                        name: 'Нормализация речи',
                        description: 'Усиливает голоса в аудиодорожке',
                        type: 'toggle',
                        value: Lampa.Storage.get(pluginId + '_speechnorm', true),
                        onchange: (val) => Lampa.Storage.set(pluginId + '_speechnorm', val)
                    },
                    {
                        name: 'Автовыбор дорожки',
                        description: 'Автоматически выбирать лучшую аудиодорожку',
                        type: 'toggle',
                        value: Lampa.Storage.get(pluginId + '_autoselect', true),
                        onchange: (val) => Lampa.Storage.set(pluginId + '_autoselect', val)
                    }
                ]
            });

            // Добавляем пункт в главное меню
            if (Lampa.Menu && Lampa.Menu.main) {
                Lampa.Menu.main.add({
                    name: pluginTitle,
                    icon: 'graphic_eq',
                    action: () => {
                        Lampa.Activity.push({
                            component: 'settings',
                            url: '',
                            id: pluginId + '_settings'
                        });
                    }
                });
            }

        } catch (e) {
            console.error('Ошибка создания настроек:', e);
        }
    }

    // Инициализация плагина
    function initPlugin() {
        console.log('Инициализация плагина ' + pluginTitle);
        createPluginSettings();
        
        if (Lampa.Events) {
            Lampa.Events.subscribe('video_ready', onVideoReady);
        }
    }

    // Совместимость с разными версиями Lampa
    waitForLampa(() => {
        if (Lampa.Plugin && Lampa.Plugin.register) {
            Lampa.Plugin.register({
                name: pluginId,
                title: pluginTitle,
                version: '1.0.4',
                description: 'Интеллектуальная обработка звука',
                onLoad: initPlugin
            });
        } else if (Lampa.API && Lampa.API.addPlugin) {
            Lampa.API.addPlugin({
                id: pluginId,
                name: pluginTitle,
                callback: initPlugin
            });
        } else {
            document.addEventListener('lampa-loaded', initPlugin);
        }
    });
})();