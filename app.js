/*
Mejoras:
-hacer aleatoria la tanda publicitaria, ver que no se repita. Varias tandas para cada canal/año, todas de 20': tanda_9_1984_1.mp4
-maximizar la pantalla
-si solo hay un archivo para un show, mostrar siempre el mismo episodio (total episodes: 1 => aunque sean 24 episodios, solo hay uno)
-si no hay siguiente episodio, volver al primero y resetear el json. Esto podria ser agregando una key total_episodes al json
-si el show indicado en el json no tiene resource, poner un video generico por la duracion (No video available)
-si el resource es de youtube, crear el iframe on the fly, reproducir y con la api de yt detectar el final de la repr para la publicidad

-symbolic link para acceder al hd externo
-formar el src del video con el show mas el episodio: SheriffLobo_ + 04 = SheriffLobo_04.mp4

-probar los mkv y los avi
-cargar el json con info verdadera (hemeroteca)
-añadir varios episodios de un mismo show, con numero de orden
-en el caso de los ciclos de cine, ver de poner un array de resources
-si el programa hay que componerlo (funcion privada: intro, noticiero, pelicula, charla, corto, cierre), ver de ingresar varios segmentos
-Añadir Locomotion / MTV la 1996

-quitar debugs y titulos html
-normalizar todos los contenidos: showTitle/s01e01.mp4
-ver si es posible iniciar la reproducción con volumen

Implementadas:
    -si el programa es diario, en lugar del dia de la semana, usar un array ['Mon','Tue','Wed'...]
    -saltar al minuto actual del show
    -si entra a la hora de la publi, saltar tambien al minuto actual (si 21:52 y duracion 50, ir al minuto 2 de la publi, o restarle 2 minutos)
    -si es antes de ppio de transmision y despues de fin, mostrar ruido
    -incrementar el ultimo episodio en el json
    -mostrar señal de ajuste 30 min antes de inicio de transmision
    -mover la configuración a otro archivo
    -añadir publi (post roll) hasta completar el horario, basado en la duracion
    -PASAR AL PROGRAMA SIGUIENTE: Al finalizar un programa (o el ruido o la señal de ajuste), debe iniciar el siguiente 
    -Crear varios json: 1984, 1985, 1986
    -cambio de canales

BUGS
-ver si se acumulan addEventListener al finalizar el programa y la tanda
-poner en fullscreen al empezar video.mozRequestFullScreen();
-si la duración del video es 50:42 la reproducción termina a los 50:00
-si lo que finaliza es una tanda, hace una peticion para intentar actualizar el episodio. 
  al entrar en publi poner un flag, y al terminar una reprod si el flag en true, ivertir
*/

/* Ctrl + Shift + R to avoid cache */

//Cargar la configuración
import config from './config.js';
//formato video mp4
//duracion en minutos totales (1 hora 30 minutos = 90)
//start y end en minutos transcurridos del dia (10:00 = 600; 11:30 = 690)

document.addEventListener('DOMContentLoaded', function() {

    const content = document.getElementById('content');
    const videoPlayer = document.getElementById('video-player');
    const currentShowDiv = document.getElementById('current-show');
    var currentChannel = config.defaultChannel;
    var playingAds = false;//FIX ME: unused

    function loadContent(channel = currentChannel) {
        //Leer el json con la grilla de programas
        fetch(config.yearProgramList)
            .then(response => response.json())
            .then(data => {
                let programsList = '<h1>Programas de Televisión</h1><ul>';
                data.forEach(program => {
                    programsList += `<li>${program.title} - Canal ${program.channel} - Dia ${program.weekday} - ${program.start} a ${program.end} - Duración ${program.duration})</li>`;
                });
                programsList += '</ul>';
                content.innerHTML = programsList;

                // Cargar el programa actual después de obtener la lista
                loadCurrentShow(data, channel);
            })
            .catch(error => {
                console.error('Error al cargar el JSON:', error);
            });
    }

    // Cargar el programa actual de un canal
    function loadCurrentShow(programs, channel) {
        const now = new Date();
        const currentDayShort = now.toLocaleString('en-US', { weekday: 'short' }).toLowerCase(); // 'Mon', 'Tue', etc.
        const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes(); // Convertir a minutos

        // Buscar el programa correspondiente
        const currentProgram = programs.find(program => {
            const start = parseInt(program.start, 10);
            const end = parseInt(program.end, 10);
            const weekdays = program.weekday.map(day => day.toLowerCase()); // Convertir a minúsculas para comparación

            return program.channel == channel &&
                   weekdays.includes(currentDayShort) && // Verificar si el día actual está en el array
                   currentTimeInMinutes >= start && 
                   currentTimeInMinutes < (end >= start ? end : 1440 + end); // Manejo de programas que cruzan medianoche
        });


        if (currentProgram) {
            currentShowDiv.innerHTML = `<h2>Programa Actual: ${currentProgram.title}</h2>
                                        <p>Día: ${now.toLocaleString('en-US', { weekday: 'long' })} (${currentDayShort})</p>
                                        <p>Hora Actual: ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}</p>`;
            document.getElementById('video-source').src = currentProgram.resource;
            videoPlayer.load();

            const minutesSinceStart = currentTimeInMinutes >= start ? currentTimeInMinutes - start : (1440 - start + currentTimeInMinutes);

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

            currentShowDiv.innerHTML = `<h2>No hay programas en este momento.</h2>
                                        <p>Canal: ${channel}</p>
                                        <p>Día: ${now.toLocaleString('en-US', { weekday: 'long' })} (${currentDayShort})</p>
                                        <p>Hora Actual: ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}</p>`;
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