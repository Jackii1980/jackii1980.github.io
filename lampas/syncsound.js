(function() {
    const pluginId = 'syncsound';
    const pluginTitle = 'СинхроЗвук';
    const settingsTitle = 'Настройки СинхроЗвука';

    // 1. Улучшенная проверка API
    function checkLampaAPI() {
        const required = {
            'Storage': ['get', 'set'],
            'Settings': ['add'],
            'Events': ['subscribe'],
            'Menu': ['main', 'add'],
            'Activity': ['push']
        };
        
        for (const module in required) {
            if (!Lampa[module]) {
                console.error(`Lampa.${module} не доступен!`);
                return false;
            }
            for (const method of required[module]) {
                if (!Lampa[module][method]) {
                    console.error(`Lampa.${module}.${method} не доступен!`);
                    return false;
                }
            }
        }
        return true;
    }

    // 2. Основные функции плагина (без изменений)
    // ... (aiAnalyzeAudioTrack, normalizeAudioSettings и др.) ...

    // 3. Создание меню (совместимая версия)
    function createPluginMenu() {
        try {
            // Альтернатива addCategory для старых версий
            const settingsGroup = {
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
            };

            // Совместимое добавление настроек
            if (Lampa.Settings.addCategory) {
                Lampa.Settings.addCategory(pluginId, {
                    title: settingsTitle,
                    icon: 'volume_up',
                    component: pluginId
                });
                Lampa.Settings.add(pluginId, settingsGroup);
            } else {
                // Для старых версий без addCategory
                Lampa.Settings.add(pluginId, settingsGroup);
            }

            // Универсальное добавление в меню
            const menuMethods = [
                () => Lampa.Menu.main.add({...}),
                () => Lampa.Menu.add({...}),
                () => document.dispatchEvent(new CustomEvent('add-menu-item', {
                    detail: {
                        name: pluginTitle,
                        icon: 'volume_up',
                        action: () => Lampa.Activity.push({
                            component: 'settings',
                            url: '',
                            id: pluginId
                        })
                    }
                }))
            ];

            for (const method of menuMethods) {
                try {
                    method();
                    console.log('Пункт меню добавлен');
                    break;
                } catch (e) {
                    console.warn('Способ добавления в меню не сработал:', e);
                }
            }

        } catch (e) {
            console.error('Критическая ошибка в createPluginMenu:', e);
        }
    }

    // 4. Инициализация с улучшенной обработкой ошибок
    function initPlugin() {
        if (!checkLampaAPI()) {
            console.error('Недостаточно API для работы плагина');
            return;
        }

        console.log('Инициализация плагина', pluginTitle);
        
        try {
            createPluginMenu();
            Lampa.Events.subscribe('video_ready', onVideoReady);
        } catch (e) {
            console.error('Ошибка инициализации:', e);
        }
    }

    // 5. Универсальный запуск
    if (window.Lampa) {
        if (Lampa.API?.addPlugin) {
            Lampa.API.addPlugin({
                id: pluginId,
                name: pluginTitle,
                callback: initPlugin
            });
        } else {
            initPlugin();
        }
    } else {
        document.addEventListener('lampa-loaded', initPlugin);
        setTimeout(() => {
            if (!window.Lampa) console.error('Lampa не загрузилась после ожидания');
        }, 5000);
    }
})();