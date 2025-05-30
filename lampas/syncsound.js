(function() {
    const pluginId = 'syncsound';
    const pluginTitle = 'СинхроЗвук';
    const settingsTitle = 'Настройки СинхроЗвука';

    // 1. Функция ожидания готовности Lampa
    function waitForLampa(callback, attempts = 10) {
        if (window.Lampa && Lampa.Storage && Lampa.Settings && Lampa.Menu) {
            callback();
        } else if (attempts > 0) {
            setTimeout(() => waitForLampa(callback, attempts - 1), 300);
        } else {
            console.error('Lampa API не загрузилось после 10 попыток');
        }
    }

    // 2. Основные функции плагина (без изменений)
    // ... (оставляем ваши функции aiAnalyzeAudioTrack, normalizeAudioSettings и др.) ...

    // 3. Создание настроек с гарантированным добавлением в меню
    function createPluginMenu() {
        try {
            // Создаем категорию настроек
            Lampa.Settings.addCategory(pluginId, {
                title: settingsTitle,
                icon: 'volume_up',
                component: pluginId
            });

            // Добавляем сами настройки
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

            // ГАРАНТИРОВАННОЕ добавление в меню (3 разных способа)
            const menuItem = {
                name: pluginTitle,
                icon: 'volume_up',
                action: () => {
                    Lampa.Activity.push({
                        component: 'settings',
                        url: '',
                        id: pluginId
                    });
                }
            };

            // Способ 1 (современные версии)
            if (Lampa.Menu.main && Lampa.Menu.main.add) {
                Lampa.Menu.main.add(menuItem);
            } 
            // Способ 2 (старые версии)
            else if (Lampa.Menu.add) {
                Lampa.Menu.add(menuItem);
            }
            // Способ 3 (экстренный)
            else {
                document.addEventListener('lampa-menu-ready', () => {
                    Lampa.Menu.main.add(menuItem);
                });
            }

            console.log('Пункт меню успешно добавлен');

        } catch (e) {
            console.error('Ошибка при создании меню:', e);
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

    // 5. Запуск плагина с максимальной совместимостью
    waitForLampa(() => {
        // Способ 1: Через новый API
        if (Lampa.API && Lampa.API.addPlugin) {
            Lampa.API.addPlugin({
                id: pluginId,
                name: pluginTitle,
                callback: initPlugin
            });
        } 
        // Способ 2: Через старый API
        else if (Lampa.Plugin && Lampa.Plugin.register) {
            Lampa.Plugin.register({
                name: pluginId,
                title: pluginTitle,
                version: '1.0.5',
                description: 'Улучшенная обработка звука',
                onLoad: initPlugin
            });
        }
        // Способ 3: Вручную после загрузки
        else {
            initPlugin();
        }
    });

    // 6. Дублирующая инициализация для старых версий
    document.addEventListener('lampa-loaded', initPlugin);
})();