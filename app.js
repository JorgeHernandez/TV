    //Bugs
    //poster: pone que falla el source. Sacando el <source > del html va bien (pero despues falla la reproduccion)
    //en el if, quitar el elem source, y en el timeout, volver a crearlo

//Symbolic link: 
//mklink "C:\xampp2\htdocs\TV\Fame001.mp4" "E:\video\Videos TV Shows\Fame\Fame TV Series Season 5 Ep 21 - Contacts.mp4"
//con esto se pueden traer todos los videos locales con la nomenclatura esperada sin tener que renombrar ni encarpetar nada

    // Cargar la configuración
    import config from './config.js';

    let currentChannel = config.defaultChannel;
    let isUniqueEpisode = false;
    let isLastEpisode = false;
    let isPublicitySlot = false;
    let programTimeout;
    let youtubeTimeout;
    let currentProgram;
    let player;

    document.addEventListener('DOMContentLoaded', function() {
        const videoPlayer = document.getElementById('video-player');
        const youtubeContainer = document.getElementById("youtubeContainer");

        // Leer el JSON con la grilla de programas
        function loadContent(channel = currentChannel) {
            fetch(config.yearProgramList)
                .then(response => response.json())
                .then(data => {
                    // Buscar el programa actual después de obtener la lista
                    loadCurrentShow(data, channel);
                })
                .catch(error => {
                    console.error('Error al cargar el JSON:', error);
                });
        }

        // Cargar el programa actual de un canal
        function loadCurrentShow(programs, channel) {
            const videocontainer = document.getElementById("videoContainer");
            let videoFile = "";
            const currentTimeInMinutes = getCurrentTimeInMinutes();
            const currentDayShort = getCurrentDayShort();
            currentProgram = programs.find(program => {
                var start = program.start;
                var end = program.end;
                var weekdays = program.weekday.map(day => day.toLowerCase()); // Convertir a minúsculas para comparación

                return program.channel == channel &&
                    weekdays.includes(currentDayShort) && // Verificar si el día actual está en el array
                    currentTimeInMinutes >= start &&
                    currentTimeInMinutes < (end >= start ? end : 1440 + end); // Manejo de programas que cruzan medianoche
            });

            // Limpiar el temporizador anterior si existe
            if (programTimeout) {
                clearTimeout(programTimeout);
            }

            //si no hay recurso, poner como poster la carta de ajuste y establecer un timer para su duracion
            if (!currentProgram.resource) {
                document.getElementById('video-player').poster = config.noShowPoster; //imagen de video no disponible
                var endTimeInMinutes = currentProgram.end;
                var timeRemaining = endTimeInMinutes - currentTimeInMinutes;
                //configurar un temporizador para que al finalizar el slot cargue el programa siguiente
                if (timeRemaining > 0) {
                    programTimeout = setTimeout(() => {
                        // Llamar a loadContent para cargar el siguiente programa
                        loadContent(channel);
                    }, timeRemaining * 60 * 1000); // Convertir minutos a milisegundos
                }
                return;
            }

            if (currentProgram) {
                console.log('Cargando programa:', currentProgram);
                playShow(currentProgram);
            } else {
                console.log('No hay programas disponibles en este momento.');
            }
        }

        function playShow(currentProgram) {
            //si solo hay un episodio, no actualizar last_seen_episode
            let videoFile;
            
            if(Array.isArray(currentProgram.resource)){                
                const videocontainer = document.getElementById("videoContainer");
                const youtubecontainer = document.getElementById("youtubeContainer");

                // Ocultar el contenedor del video local y mostrar el contenedor de YouTube
                videocontainer.style.display = 'none';
                youtubecontainer.style.display = 'block';

                // Calcular el momento de inicio 
                const currentTimeInMinutes = getCurrentTimeInMinutes();
                const minutesSinceStart = currentTimeInMinutes >= currentProgram.start ? currentTimeInMinutes - currentProgram.start : (1440 - start + currentTimeInMinutes);
                let currentTime = minutesSinceStart > 0 ? minutesSinceStart * 60 : 0; // Establecer el tiempo actual del video en segundos

                // Inicializar el reproductor de YouTube
                const youtubePlayer = new YouTubePlayer('youtubeContainer', playPublicity, updateLastSeenEpisode);
                youtubePlayer.init(currentProgram, currentTime);
            }else{
                if (currentProgram.total_episodes === 0) {
                    isUniqueEpisode = true;
                    //el nombre del archivo se forma sin episode number
                    videoFile = currentProgram.resource + ".mp4";
                } else if ((currentProgram.last_seen_episode) < currentProgram.total_episodes) {
                    //si hay mas episodios, reproducir el siguiente al ultimo visto
                    videoFile = currentProgram.resource + (currentProgram.last_seen_episode + 1).toString().padStart(3, '0') + ".mp4";
                } else if (currentProgram.last_seen_episode == currentProgram.total_episodes) {
                    //Si es el ultimo episodio, resetear el last_seen_episode
                    isLastEpisode = true;
                    //volver al primero
                    videoFile = currentProgram.resource + "001.mp4"
                }
                document.getElementById('video-source').src = videoFile;
                videoPlayer.load();
                const currentTimeInMinutes = getCurrentTimeInMinutes();
                const minutesSinceStart = currentTimeInMinutes >= currentProgram.start ? currentTimeInMinutes - currentProgram.start : (1440 - start + currentTimeInMinutes);
                videoPlayer.currentTime = minutesSinceStart > 0 ? minutesSinceStart * 60 : 0; // Establecer el tiempo actual del video en segundos
                videoPlayer.play();

                // Limpiar cualquier evento anterior
                videoPlayer.removeEventListener('ended', handlePublicityEnded);
                videoPlayer.addEventListener('ended', handleShowEnded);
            }
        }

        function handleShowEnded() {
            console.log('Fin del programa. Iniciando slot de publicidad.');
            updateLastSeenEpisode(currentProgram); // Actualizar el último episodio visto
            playPublicity(currentProgram);
        }

        function playPublicity(currentProgram) {
            console.log('Reproduciendo publicidad...');
            // Verificar si el programa tiene publicidad
            if (currentProgram.publicity !== 0) {

                // Generar un número aleatorio entre 1 y 9
                const randomNumber = Math.floor(Math.random() * 9) + 1; // 1 a 9

                // Construir el nombre del video de publicidad
                const postRoll = `tanda_${currentChannel}_${config.year}_${randomNumber}.mp4`;

                document.getElementById('video-source').src = postRoll;
                videoPlayer.load();

                // Obtener la hora actual en minutos
                const currentTimeInMinutes = getCurrentTimeInMinutes();

                //en caso que el programa termine al dia siguiente
                const programEndTime = currentProgram.end >= currentProgram.start ? currentProgram.end : 1440 + currentProgram.end;

                // Calcular en segundos el tiempo disponible para publicidad
                const availableTime = (programEndTime - currentTimeInMinutes)*60; // en segundos

                // Calcular el tiempo de inicio del video publicitario (20 minutos - tiempodisponible hasta fin del slot)
                const startTime = 1200 - availableTime; // en segundos

                videoPlayer.currentTime = startTime; // Ajustar el tiempo de reproducción
                videoPlayer.play(); // Iniciar la reproducción

                // Limpiar cualquier evento anterior
                videoPlayer.removeEventListener('ended', handleShowEnded);
                videoPlayer.addEventListener('ended', handlePublicityEnded);
            } else {
                // Si no se debe mostrar publicidad, buscar el siguiente programa
                loadContent(currentChannel);
            }
        }

        function handlePublicityEnded() {
            console.log('Fin del slot de publicidad. Buscando el siguiente programa.');
            loadContent(currentChannel); // Buscar el siguiente programa
        }

        function getCurrentTimeInMinutes() {
            const now = new Date(); // Obtiene la fecha y hora actual
            const hours = now.getHours(); // Obtiene las horas
            const minutes = now.getMinutes(); // Obtiene los minutos
            return hours * 60 + minutes; // Convierte las horas a minutos y suma los minutos
        }

        function getCurrentDayShort() {
            const now = new Date();
            return now.toLocaleString('en-US', {
                weekday: 'short'
            }).toLowerCase(); // 'mon', 'tue', etc.
        }


        function updateLastSeenEpisode(program) {
            // Verificar si el programa tiene episodios
            if (program.total_episodes > 0) {
                // Incrementar last_seen_episode
                program.last_seen_episode++;

                // Reiniciar a 0 si se alcanzó el total de episodios
                if (program.last_seen_episode === program.total_episodes) {
                    program.last_seen_episode = 0;
                }

                // Enviar la actualización al servidor
                fetch('update_resource.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: program.id,
                        last_seen_episode: program.last_seen_episode
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor: ' + response.statusText);
                    }
                    return response.json(); // Procesar la respuesta JSON si es necesario
                })
                .then(data => {
                    console.log('Actualización exitosa:', data);
                })
                .catch(error => {
                    console.error('Error al actualizar el recurso:', error);
                });
            }
        }


        //************Eventos*****************************//
        //Escuchar el cambio de canales. Los unicos validos son 2, 7, 9, 11 y 13
        let waitingForSecondKey = false;
        document.addEventListener('keydown', function(event) {
            const keyPressed = event.key;

            // Verificar si se presiona 2, 7 o 9
            if (keyPressed === '2' || keyPressed === '7' || keyPressed === '9') {
                currentChannel = keyPressed;
                loadContent(keyPressed);
            }
            // Verificar si se presiona un segundo keypress mientras se espera
            else if (waitingForSecondKey) {
                if (keyPressed === '1') {
                    currentChannel = 11;
                    loadContent(11);
                } else if (keyPressed === '3') {
                    currentChannel = 13;
                    loadContent(13);
                }
                waitingForSecondKey = false; // Reiniciar el estado de espera
            }
            // Verificar si se presiona 1
            else if (keyPressed === '1') {
                waitingForSecondKey = true; // Activar el estado de espera
            }
        });

        // Iniciar la app
        loadContent(currentChannel);
    });

    //************Manejo de Youtube*****************************//
    class YouTubePlayer {
        constructor(containerId, playPublicityFunc, updateLastSeenEpisodeFunc) {
            this.containerId = containerId;
            this.playPublicityFunc = playPublicityFunc;
            this.updateLastSeenEpisodeFunc = updateLastSeenEpisodeFunc;
            this.player = null;
        }

        init(currentProgram, currentTime) {
            //si last_seen_episode = 0, reproducir el primer url del array
            const videoId = YouTubePlayer.extractYouTubeID(currentProgram.resource[currentProgram.last_seen_episode]);
            //const videoId = YouTubePlayer.extractYouTubeID(currentProgram.resource);
            const iframeHTML = `<iframe id="youtube-player" width="600" height="400" src="https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=http://localhost&start=${currentTime}" frameborder="0" allowfullscreen></iframe>`;
            const container = document.getElementById(this.containerId);
            container.innerHTML = iframeHTML;

            //obtener la duracion del video
            this.getYouTubeVideoDuration(currentProgram, currentTime);
        }

        static extractYouTubeID(url) {
            const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^&\n]{11})/;
            const matches = url.match(regex);
            return matches ? matches[1] : null;
        }

        async getYouTubeVideoDuration(currentProgram, currentTime) {
            try {
                // Codificar la URL del video para usarla en la solicitud
                const encodedUrl = encodeURIComponent(currentProgram.resource);

                const apiUrl = `http://localhost/TV/get_video_duration.php?url=${encodedUrl}`;
                console.log("URL de la API:", apiUrl); // Verificar la URL
                
                // Realizar la solicitud al servicio PHP
                const response = await fetch(apiUrl);
                
                // Verificar si la respuesta es exitosa
                if (!response.ok) {
                    //FIX ME: si falla qué hace??
                    return 0; // Regresar 0 en caso de error en la respuesta
                }

                // Obtener la duración en segundos
                const durationInSeconds = await response.text();
                console.log("Duración recibida:", durationInSeconds); 
                this.callPublicityFromYT(currentProgram, durationInSeconds, currentTime);
            } catch (error) {
                console.error('Error al obtener la duración del video:', error);
                return 0; // Regresar 0 en caso de error
            }
        }

        //inicializar un timer del tiempo de reproduccion (duracion menos minutos transcurridos desde el inicio del slot)
        //cuando finaliza el show, cambiar el display, destruir el iframe y llamar a la publicidad
        callPublicityFromYT(currentProgram, durationInSeconds, currentTime){
            //FIX ME: calcular el valor del timeOut. 2940000 millisec son 49 min de los Hart
            console.log('setting timeout for publicity');

            // Limpiar el temporizador anterior si existe
            if (youtubeTimeout) {
                clearTimeout(youtubeTimeout);
            }

            //al alcanzar el fin de duracion, llamar a updateLastSeenEpisode y a playPublicity
            youtubeTimeout = setTimeout(() => {
                const youtubePlayer = document.getElementById('youtube-player');
                if (youtubePlayer) {
                    youtubeContainer.removeChild(youtubePlayer);
                }

                // Ocultar el contenedor del video local y mostrar el contenedor de YouTube
                document.getElementById("videoContainer").style.display = 'block';//document.getElementById("videoContainer")
                document.getElementById("youtubeContainer").style.display = 'none';

                // Cargar publicidad
                this.playPublicityFunc(currentProgram);

                // Actualizar el último episodio visto
                this.updateLastSeenEpisodeFunc(currentProgram);

            }, 2940000); // Convertir minutos a milisegundos
        }
    }

    // Esperar a que la API de YT esté lista
    // onYouTubeIframeAPIReady() function must be defined globally
    //Esto fuera de la clase funciona, dentro no
    //pero los eventos si esta fuera no funcionan (porque la api esta lista antes que el dom y el player esten listos)
    //BUGFIX: los eventos ahora si se ejecuta, onReady una vez, onStateChange varias. A veces si, otras no (tal vez si pausas la ejecucion y le das tiempo)
    window.onYouTubeIframeAPIReady = () => {
        player = new YT.Player('youtube-player', {
                events: {
                    'onReady': ()=>{console.log('YT player onReady')},
                    'onStateChange': ()=>{console.log('YT player onStateChange')}
                }
        });
    };