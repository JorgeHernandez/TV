//Cargar la configuración
import config from './config.js';

document.addEventListener('DOMContentLoaded', function() {

    const videoPlayer = document.getElementById('video-player');
    var currentChannel = config.defaultChannel;
    var isUniqueEpisode = false;
    var isLastEpisode = false;
    var isPublicitySlot = false;


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
        var videoFile = "";

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



//si total episodes === 0, solo hay uno, reproducir siempre el mismo, no incrementar last_seen (siempre 0)
//los programas que solo hay un video, no llevan sufijo de episodio: telejuegos => telejuegos.mp4
//si hay 3 episodios, total_episodes es 3
//los videos de los episodios se empiezan a numerar desde 1 (Airwolf001, Airwolf002, ...). 
//last_seen_episode inicialmente vale 0
//si total_episodes != 0, reproducir [show_name][episode+1].mp4 Airwolf001.mp4
//la primera vez last_seen_episode es 0, 0+1=1, se reproduce  el 001: Airwolf001.mp4
//al terminar se incrementa last_Seen_episode: 1 
//la segunda vez se reproduce el 1 Airwolf002
//al terminar, incrementar last_seen_episode
//la tercera vez se reproduce el 2 Airwolf003
//al terminar, incrementar last_seen_episode

/*
si total episodes: 3

    total espisode  last_seen   reprod                      avanzar?
        0 != 3;     0           [show][last_seen + 1]       0+1<3 si
        1 != 3;     1           [show][last_seen + 1]       1+1<3 si
        2 != 3;     2           [show][last_seen + 1]       2+1<3 no
*/

//si last_seen_episode+1 == total_episodes, volver a 0


        if (currentProgram) {
            isPublicitySlot = false;
            //si solo hay un episodio, no actualizar last_seen_episode
            if(currentProgram.total_episodes===0){
                isUniqueEpisode = true;
                //el nombre del archivo se forma sin episode number
                videoFile = currentProgram.resource + ".mp4";
            }else if((currentProgram.last_seen_episode)<currentProgram.total_episodes){
                //si hay mas episodios, reproducir el siguiente al ultimo visto
                videoFile = currentProgram.resource + (currentProgram.last_seen_episode+1).toString().padStart(3, '0') + ".mp4";
            }else if(currentProgram.last_seen_episode == currentProgram.total_episodes){
                //Si es el ultimo episodio, resetear el last_seen_episode
                isLastEpisode = true;
                //volver al primero
                videoFile = currentProgram.resource + "001.mp4"
            }
            document.getElementById('video-source').src = videoFile;
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
            //si no hay nada en la grilla de programación, mostrar un video genérico
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

            // Si encontramos el recurso, manejamos last_seen_episode
            if (recurso) {
                // Cargar postroll tanda publicitaria
                if(!isPublicitySlot){
                    isPublicitySlot = true;
                    loadPostRoll(recurso);
                }

                // Verificar si el programa tiene episodios
                if (recurso.total_episodes > 0) {
                    // Incrementar last_seen_episode
                    recurso.last_seen_episode++;

                    // Si alcanzamos el total de episodios, reiniciar a 0
                    if (recurso.last_seen_episode === recurso.total_episodes) {
                        recurso.last_seen_episode = 0;
                    }

                    console.log(`Nuevo valor de last_seen_episode para el recurso ${resource}:`, recurso.last_seen_episode);

                    // Enviar la actualización al servidor
                    return fetch('update_resource.php', {
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
                    console.log(`El recurso ${resource} no tiene episodios, no se actualizará last_seen_episode.`);
                }
            } else {
                console.log(`Recurso con resource ${resource} no encontrado.`);
            }
        })
        .then(updateResponse => {
            if (updateResponse && updateResponse.ok) {
                console.log('Valor de last_seen_episode actualizado en el servidor.');
            } else {
                console.error('Error al actualizar el valor de last_seen_episode en el servidor.');
            }
        })
        .catch(error => {
            console.error('Error al cargar el JSON o al actualizar el recurso:', error);
        });
    }

    //al finalizar un video, mostrar publicidad hasta la hora de finalización del show
    //las tandas publicitarias son de 20 minutos
    function loadPostRoll(recurso){        
        //fuera de transmision no hay publicidad (publicity = 0 en json)
        if(recurso.publicity !== 0){

            //Calcular tiempo disponible para publicidad
            const availableTime = recurso.publicity*60;//en segundos

            // Generar un número aleatorio entre 1 y 9
            const randomNumber = Math.floor(Math.random() * 9) + 1; // 1 a 9

            // Construir el nombre del video de publicidad
            const postRoll = `tanda_${currentChannel}_${config.year}_${randomNumber}.mp4`;

            document.getElementById('video-source').src = postRoll;
            videoPlayer.load();

            //saltar adelante para ajustar el tiempo de reproducción con el fin de show
            videoPlayer.currentTime = 20*60 - availableTime;//todas las tandas son de 20 minutos

            videoPlayer.play();//Iniciar la reproducción. Al finalizar el evento ended busca el siguiente programa

            videoPlayer.addEventListener('ended', function(){
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