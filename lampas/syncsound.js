(function() {
    const pluginId = 'syncsound';
    const pluginTitle = 'СинхроЗвук';

    // Усиленная проверка загрузки Lampa
    if (!window.Lampa) {
        console.error('[SyncSound] Lampa не обнаружена!');
        return;
    }

    // Ждём полной инициализации Lampa
    function waitLampaReady(callback) {
        if (Lampa.Plugin && Lampa.Storage && Lampa.Settings) {
            callback();
        } else {
            console.log('[SyncSound] Ожидание загрузки Lampa...');
            setTimeout(() => waitLampaReady(callback), 300);
        }
    }

    // Основные функции плагина (aiAnalyzeAudioTrack, normalizeAudioSettings и т.д.)
    // ... (оставляем без изменений из предыдущего кода) ...

    function createSettingsMenu() {
        try {
            // 1. Создаём категорию настроек
            if (Lampa.Settings && Lampa.Settings.addCategory) {
                Lampa.Settings.addCategory(pluginId, {
                    title: pluginTitle,
                    icon: 'settings_voice', // Используем встроенную иконку
                    component: pluginId + '_settings'
                });
                
                console.log('[SyncSound] Категория настроек создана');
            } else {
                console.error('[SyncSound] Lampa.Settings.addCategory не доступен!');
            }

            // 2. Добавляем настройки
            if (Lampa.Settings && Lampa.Settings.add) {
                Lampa.Settings.add(pluginId + '_settings', {
                    title: pluginTitle,
                    component: pluginId,
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
                        },
                        {
                            name: 'Шумоподавление',
                            type: 'toggle',
                            value: Lampa.Storage.get(pluginId + '_noisereduce', true),
                            onchange: (val) => Lampa.Storage.set(pluginId + '_noisereduce', val)
                        }
                    ]
                });
                
                console.log('[SyncSound] Настройки добавлены');
            }

            // 3. Добавляем пункт в главное меню (новый способ)
            if (Lampa.Menu && Lampa.Menu.add) {
                Lampa.Menu.add({
                    name: pluginTitle,
                    icon: 'settings_voice',
                    group: 'settings',
                    action: () => {
                        Lampa.Activity.push({
                            url: '',
                            component: 'settings',
                            id: pluginId + '_settings'
                        });
                    }
                });
                
                console.log('[SyncSound] Пункт меню добавлен');
            } else {
                console.error('[SyncSound] Lampa.Menu.add не доступен!');
            }

        } catch (e) {
            console.error('[SyncSound] Ошибка при создании меню:', e);
        }
    }

    function init() {
        console.log('[SyncSound] Инициализация плагина...');
        
        // Ждём готовности Lampa
        waitLampaReady(() => {
            createSettingsMenu();
            
            // Подписываемся на события
            if (Lampa.Events) {
                Lampa.Events.subscribe('video_ready', onVideoReady);
            }
        });
    }

    // Регистрация плагина с обработкой ошибок
    try {
        if (Lampa.Plugin && Lampa.Plugin.register) {
            Lampa.Plugin.register({
                name: pluginId,
                title: pluginTitle,
                version: '1.0.3',
                description: 'Интеллектуальный выбор аудиодорожки',
                onLoad: init
            });
            console.log('[SyncSound] Плагин зарегистрирован');
        } else {
            console.error('[SyncSound] Lampa.Plugin.register не доступен!');
        }
    } catch (e) {
        console.error('[SyncSound] Ошибка регистрации плагина:', e);
    }
})();