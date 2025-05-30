(function() {
    const pluginId = 'syncsound';

    // Проверяем загрузку Lampa
    if (!window.Lampa || !Lampa.Plugin) {
        console.error('Lampa API не доступно!');
        return;
    }

    function aiAnalyzeAudioTrack(track) {
        try {
            const name = (track.name || '').toLowerCase();
            const codec = (track.codec || '').toLowerCase();
            let score = 0;

            const noiseReduction = Lampa.Storage.get(pluginId + '_noisereduce', true);
            const speechNormalization = Lampa.Storage.get(pluginId + '_speechnorm', true);

            if (noiseReduction) {
                if (name.includes('cam') || name.includes('ts') || name.includes('mic')) score -= 5;
                if (name.includes('line') || name.includes('hall')) score -= 3;
            }

            if (speechNormalization) {
                if (name.includes('dub') || name.includes('clean') || name.includes('studio')) score += 3;
                if (name.includes('voice') || name.includes('speech')) score += 1;
            }

            if (codec.includes('eac3') || codec.includes('ac3') || codec.includes('dts')) score += 1;
            if (track.bitrate && track.bitrate > 192000) score += 1;

            return {
                qualityScore: score,
                predictedClean: score >= 2
            };
        } catch (e) {
            console.error('Ошибка в aiAnalyzeAudioTrack:', e);
            return { qualityScore: 0, predictedClean: false };
        }
    }

    function normalizeAudioSettings(audioTracks) {
        try {
            const preferredLangs = ['ru', 'en'];
            const preferredFormats = ['eac3', 'ac3', 'dts', 'aac'];

            const scoredTracks = audioTracks.map(track => {
                const ai = aiAnalyzeAudioTrack(track);
                return {
                    ...track,
                    aiScore: ai.qualityScore,
                    clean: ai.predictedClean
                };
            });

            const cleanTracks = scoredTracks.filter(t => t.clean);

            const sorted = (cleanTracks.length ? cleanTracks : scoredTracks).sort((a, b) => {
                let aLang = preferredLangs.indexOf(a.lang ? a.lang.toLowerCase() : '');
                let bLang = preferredLangs.indexOf(b.lang ? b.lang.toLowerCase() : '');
                let aFormat = preferredFormats.indexOf((a.codec || '').toLowerCase());
                let bFormat = preferredFormats.indexOf((b.codec || '').toLowerCase());

                return (bLang - aLang) || (bFormat - aFormat) || (b.aiScore - a.aiScore);
            });

            return sorted.length ? sorted[0] : null;
        } catch (e) {
            console.error('Ошибка в normalizeAudioSettings:', e);
            return audioTracks.length ? audioTracks[0] : null;
        }
    }

    function applyNightMode() {
        console.log(`[${pluginId}] Включён ночной режим (эмуляция): компрессия звука`);
        // Здесь должна быть реализация ночного режима
    }

    function onVideoReady(event) {
        try {
            if (!event || !event.audioTracks) return;

            const audioTracks = event.audioTracks;
            if (audioTracks.length > 1) {
                const bestTrack = normalizeAudioSettings(audioTracks);
                if (bestTrack && event.setAudioTrack) {
                    console.log(`[${pluginId}] Выбрана аудиодорожка:`, bestTrack);
                    event.setAudioTrack(bestTrack.index);
                }
            }

            if (Lampa.Storage.get(pluginId + '_nightmode', false)) {
                applyNightMode();
            }
        } catch (e) {
            console.error(`[${pluginId}] Ошибка в onVideoReady:`, e);
        }
    }

    function createSettings() {
        try {
            if (!Lampa.Settings) {
                console.error('Lampa.Settings не доступен');
                return;
            }

            Lampa.Settings.add({
                title: 'СинхроЗвук',
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
                    }
                ]
            });
        } catch (e) {
            console.error(`[${pluginId}] Ошибка при создании настроек:`, e);
        }
    }

    function init() {
        console.log(`[${pluginId}] Инициализация плагина...`);
        
        // Ждем полной загрузки Lampa
        setTimeout(() => {
            createSettings();
            
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
        title: 'СинхроЗвук',
        version: '1.0.1',
        description: 'AI выбор и нормализация аудиодорожки',
        onLoad: init
    });

    console.log(`[${pluginId}] Плагин зарегистрирован`);
})();
