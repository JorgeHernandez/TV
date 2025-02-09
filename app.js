//Cargar la configuración
import config from './config.js';

document.addEventListener('DOMContentLoaded', function() {

    const videoPlayer = document.getElementById('video-player');
    var currentChannel = config.defaultChannel;

    function loadContent(channel = currentChannel) {
        //Leer el json con la grilla de programas
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
        var now = new Date();
        var currentDayShort = now.toLocaleString('en-US', { weekday: 'short' }).toLowerCase(); // 'Mon', 'Tue', etc.
        var currentTimeInMinutes = now.getHours() * 60 + now.getMinutes(); // Convertir a minutos


        // Buscar el programa correspondiente
        const currentProgram = programs.find(program => {
            var start = program.start;
            var end = program.end;
            var weekdays = program.weekday.map(day => day.toLowerCase()); // Convertir a minúsculas para comparación

            return program.channel == channel &&
                   weekdays.includes(currentDayShort) && // Verificar si el día actual está en el array
                   currentTimeInMinutes >= start && 
                   currentTimeInMinutes < (end >= start ? end : 1440 + end); // Manejo de programas que cruzan medianoche
        });

        if (currentProgram) {
            document.getElementById('video-source').src = currentProgram.resource;
            videoPlayer.load();

            const minutesSinceStart = currentTimeInMinutes >= currentProgram.start ? currentTimeInMinutes - currentProgram.start : (1440 - start + currentTimeInMinutes);

            videoPlayer.currentTime = minutesSinceStart > 0 ? minutesSinceStart * 60 : 0; // Establecer el tiempo actual del video en segundos
            videoPlayer.play();

            // Incrementar el último episodio visto
            videoPlayer.addEventListener('ended', function(){
                onVideoEnded(currentProgram.resource);
            });
        } else {
            console.log("No hay programas en este momento.");
            document.getElementById('video-source').src = "mi_video.mp4";
            videoPlayer.load();
            videoPlayer.play();
        }
    }

    function onVideoEnded(resource) {
        console.log("El video ha terminado de reproducirse.");
        videoPlayer.currentTime = 0; // Reiniciar el tiempo de reproducción
        videoPlayer.pause(); // Pausar el video

        // Leer el JSON con la grilla de programas para actualizar last_seen_episode
        // y luego reproducir la tanda publicitaria
        fetch(config.yearProgramList)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al cargar el archivo JSON');
                }
                return response.json();
            })
            .then(data => {
                // Buscamos el programa que se corresponde con el resource de video
                const recurso = data.find(r => r.resource === resource);

                // Si encontramos el recurso, incrementamos last_seen_episode
                if (recurso) {
                    //cargar postroll tanda publicitaria
                    loadPostRoll(recurso);

                    recurso.last_seen_episode += 1;
                    console.log(`Nuevo valor de last_seen_episode para el recurso ${resource}:`, recurso.last_seen_episode);

                    // Enviar la actualización al servidor
                    return fetch('update_resource.php', { // Cambia esto a la URL de tu endpoint
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            resource: resource,
                            last_seen_episode: recurso.last_seen_episode
                        })
                    });
                } else {
                    console.log(`Recurso con resource ${resource} no encontrado.`);
                }
            })
            .then(updateResponse => {
                if (updateResponse && updateResponse.ok) {
                    console.log('Valor de last_seen_episode actualizado en el servidor.');
                } else {
                    console.error('Error al actualizar el valor en el servidor.');
                }
            })
            .catch(error => {
                console.error('Error al cargar el JSON:', error);
            });

    }

    //al finalizar un video, mostrar publicidad hasta la hora de finalización del show
    //las tandas publicitarias son de 20 minutos
    function loadPostRoll(recurso){        
        //fuera de transmision no hay publicidad (publicity = 0 en json)
        if(recurso.publicity !== 0){
            playingAds = true;

            //Calcular tiempo disponible para publicidad
            const availableTime = recurso.publicity*60;//en segundos
            
            const postRoll = 'tanda.mp4';//FIX ME
            document.getElementById('video-source').src = postRoll;
            videoPlayer.load();

            //saltar adelante para ajustar el tiempo de reproducción con el fin de show
            videoPlayer.currentTime = 20*60 - availableTime;//todas las tandas son de 20 minutos

            videoPlayer.play();//Iniciar la reproducción. Al finalizar el evento ended busca el siguiente programa

            videoPlayer.addEventListener('ended', function(){
                playingAds = true;
                loadContent(currentChannel);
            });

        }
    }

    loadContent(currentChannel);

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
});