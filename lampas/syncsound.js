(function() {
    const pluginId = 'syncsound';
    const pluginTitle = 'СинхроЗвук';

    // Проверяем загрузку Lampa
    if (!window.Lampa || !Lampa.Plugin) {
        console.error('Lampa API не доступно!');
        return;
    }

    // Функции aiAnalyzeAudioTrack, normalizeAudioSettings, applyNightMode и onVideoReady
    // остаются без изменений (как в предыдущем коде)

    function createSettingsMenu() {
        try {
            if (!Lampa.Settings) {
                console.error('Lampa.Settings не доступен');
                return;
            }

            // Создаем отдельную категорию в настройках
            Lampa.Settings.addCategory(pluginId, {
                title: pluginTitle,
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>',
                component: pluginId + '_settings'
            });

            // Добавляем настройки в созданную категорию
            Lampa.Settings.add(pluginId + '_settings', {
                title: pluginTitle,
                component: pluginId,
                items: [
                    {
                        name: 'Ночной режим',
                        type: 'toggle',
                        value: Lampa.Storage.get(pluginId + '_nightmode', false),
                        onchange: (val) => {
                            Lampa.Storage.set(pluginId + '_nightmode', val);
                        }
                    },
                    {
                        name: 'Нормализация речи (AI)',
                        type: 'toggle',
                        value: Lampa.Storage.get(pluginId + '_speechnorm', true),
                        onchange: (val) => {
                            Lampa.Storage.set(pluginId + '_speechnorm', val);
                        }
                    },
                    {
                        name: 'Шумоподавление (AI)',
                        type: 'toggle',
                        value: Lampa.Storage.get(pluginId + '_noisereduce', true),
                        onchange: (val) => {
                            Lampa.Storage.set(pluginId + '_noisereduce', val);
                        }
                    },
                    {
                        name: 'Информация',
                        type: 'select',
                        values: [
                            { name: 'Версия 1.0.1', value: 'version' },
                            { name: 'О плагине', value: 'about' }
                        ],
                        onselect: (val) => {
                            if (val === 'about') {
                                Lampa.Noty.show('Плагин для интеллектуального выбора аудиодорожки');
                            }
                        }
                    }
                ]
            });

            // Добавляем пункт в главное меню
            if (Lampa.Menu && Lampa.Menu.add) {
                Lampa.Menu.add({
                    name: pluginTitle,
                    icon: 'settings',
                    action: () => {
                        Lampa.Settings.show(pluginId + '_settings');
                    }
                });
            }

        } catch (e) {
            console.error(`[${pluginId}] Ошибка при создании меню настроек:`, e);
        }
    }

    function init() {
        console.log(`[${pluginId}] Инициализация плагина...`);
        
        // Ждем полной загрузки Lampa
        setTimeout(() => {
            createSettingsMenu();
            
            if (Lampa.Events) {
                Lampa.Events.subscribe('video_ready', onVideoReady);
            } else {
                console.error('Lampa.Events не доступен');
            }
        }, 1000);
    }

    // Регистрируем плагин
    Lampa.Plugin.register({
        name: pluginId,
        title: pluginTitle,
        version: '1.0.2',
        description: 'AI выбор и нормализация аудиодорожки',
        onLoad: init
    });

    console.log(`[${pluginId}] Плагин зарегистрирован`);
})();