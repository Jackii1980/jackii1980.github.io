(function() {
    const pluginId = 'syncsound';
    const pluginTitle = 'СинхроЗвук';
    
    // 1. Проверка минимально необходимых компонентов
    if (!window.Lampa || !Lampa.Storage) {
        console.error('Недостаточно API для работы плагина');
        return;
    }

    // 2. Создаем свои настройки в localStorage
    const defaultSettings = {
        nightmode: false,
        speechnorm: true,
        noisereduce: true
    };

    // 3. Альтернативное меню через HTML-инъекцию
    function createCustomMenu() {
        try {
            // Создаем кнопку в интерфейсе
            const menuItem = document.createElement('div');
            menuItem.className = 'selector__card';
            menuItem.innerHTML = `
                <div class="selector__card__side">
                    <div class="selector__card__icon">
                        <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                    </div>
                    <div class="selector__card__title">${pluginTitle}</div>
                </div>
            `;
            
            menuItem.onclick = function() {
                showCustomSettings();
            };

            // Добавляем в интерфейс (адаптируйте селектор под вашу версию Lampa)
            const menuContainer = document.querySelector('.selector__cards');
            if (menuContainer) {
                menuContainer.appendChild(menuItem);
                console.log('Кастомное меню добавлено');
            }
        } catch (e) {
            console.error('Ошибка создания меню:', e);
        }
    }

    // 4. Показываем настройки в всплывающем окне
    function showCustomSettings() {
        const settings = {
            nightmode: Lampa.Storage.get(pluginId + '_nightmode', defaultSettings.nightmode),
            speechnorm: Lampa.Storage.get(pluginId + '_speechnorm', defaultSettings.speechnorm),
            noisereduce: Lampa.Storage.get(pluginId + '_noisereduce', defaultSettings.noisereduce)
        };

        // Создаем интерфейс настроек
        const html = `
            <div class="fullskipper">
                <div class="fullskipper__body">
                    <div class="fullskipper__title">${pluginTitle}</div>
                    
                    <div class="fullskipper__item">
                        <div class="fullskipper__item__name">Ночной режим</div>
                        <div class="fullskipper__item__toggle ${settings.nightmode ? 'active' : ''}" 
                             data-setting="nightmode">
                            <div class="fullskipper__item__toggle__thumb"></div>
                        </div>
                    </div>
                    
                    <div class="fullskipper__item">
                        <div class="fullskipper__item__name">Нормализация речи</div>
                        <div class="fullskipper__item__toggle ${settings.speechnorm ? 'active' : ''}" 
                             data-setting="speechnorm">
                            <div class="fullskipper__item__toggle__thumb"></div>
                        </div>
                    </div>
                    
                    <div class="fullskipper__buttons">
                        <div class="fullskipper__button close">Закрыть</div>
                    </div>
                </div>
            </div>
        `;

        // Добавляем в DOM
        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container);

        // Обработчики событий
        container.querySelectorAll('.fullskipper__item__toggle').forEach(toggle => {
            toggle.addEventListener('click', function() {
                const setting = this.getAttribute('data-setting');
                const newValue = !settings[setting];
                
                this.classList.toggle('active');
                Lampa.Storage.set(pluginId + '_' + setting, newValue);
                settings[setting] = newValue;
            });
        });

        container.querySelector('.close').addEventListener('click', function() {
            document.body.removeChild(container);
        });
    }

    // 5. Основные функции плагина (оставить ваши реализации)
    function onVideoReady(event) {
        // ... ваш код обработки аудиодорожек ...
    }

    // 6. Инициализация
    function init() {
        console.log('Инициализация плагина ' + pluginTitle);
        
        // Ждем загрузки интерфейса
        setTimeout(() => {
            createCustomMenu();
            
            if (Lampa.Events) {
                Lampa.Events.subscribe('video_ready', onVideoReady);
            }
        }, 3000);
    }

    // Запуск
    if (window.LampaReady) {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();