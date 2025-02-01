/*
Mejoras:
-si la hora actual es la hora de inicio, cortar loop señal de ajuste y arrancar el primer programa del 9
-si la hora actual es inicio menos 30 min, cortar loop ruido y poner señal de ajuste
-añadir varios episodios de un mismo show, con numero de orden
-si solo hay un archivo para un show, mostrar siempre el mismo episodio
-maximizar la pantalla
-si no hay siguiente episodio, volver al primero y resetear el json
-si el show indicado en el json no tiene resource, poner un video generico por la duracion (No video available)
-si entra a la hora de la publi, saltar tambien al minuto actual (si 21:52 y duracion 50, ir al minuto 2 de la publi, o restarle 2 minutos)
-ver si es posible integrar con youtube otros shows que no estan bajados

-quitar debugs y titulos 
-cargar el json con info verdadera (hemeroteca)
-normalizar todos los contenidos: showTitle/s01e01.mp4
-ver si es posible iniciar la reproducción con volumen

Implementadas:
    -saltar al minuto actual del show
    -si es antes de ppio de transmision y despues de fin, mostrar ruido
    -incrementar el ultimo episodio en el json
    -mostrar señal de ajuste 30 min antes de inicio de transmision
    -mover la configuración a otro archivo
    -añadir publi (post roll) hasta completar el horario, basado en la duracion
    -PASAR AL PROGRAMA SIGUIENTE: Al finalizar un programa (o el ruido o la señal de ajuste), debe iniciar el siguiente 
    -Crear varios json: 1984, 1985, 1986

BUGS
-si un show empieza a las 23:00 y termina a las 00:00 no lo encuentra: En el json las 0:00 deben indicarse como 24:00
-poner en fullscreen al empezar video.mozRequestFullScreen();
-si la duración del video es 50:42 la reproducción termina a los 50:00
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

    // Función para cargar el programa actual de un canal
    function loadCurrentShow(programs, channel) {
        const now = new Date();
        const currentDayShort = now.toLocaleString('en-US', { weekday: 'short' }).toLowerCase(); // 'Mon', 'Tue', etc.
        const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes(); // Convertir a minutos

        // Buscar el programa correspondiente
        const currentProgram = programs.find(program => {
            return program.channel == channel &&
                   program.weekday.toLowerCase() === currentDayShort &&
                   currentTimeInMinutes >= program.start && currentTimeInMinutes < program.end;
        });

        if (currentProgram) {
            currentShowDiv.innerHTML = `<h2>Programa Actual: ${currentProgram.title}</h2>
                                        <p>Día: ${now.toLocaleString('en-US', { weekday: 'long' })} (${currentDayShort})</p>
                                        <p>Hora Actual: ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}</p>`;
            document.getElementById('video-source').src = currentProgram.resource;
            videoPlayer.load(); // Cargar el nuevo video

            // Calcular el tiempo que debe avanzar el video
            const minutesSinceStart = currentTimeInMinutes - currentProgram.start; // Minutos desde el inicio del programa

            // Asegurarse de que no sea negativo
            if (minutesSinceStart > 0) {
                videoPlayer.currentTime = minutesSinceStart * 60; // Establecer el tiempo actual del video en segundos
            } else {
                videoPlayer.currentTime = 0; // Si el programa no ha comenzado, comienza desde el principio
            }

            videoPlayer.play();//Iniciar la reproducción

            //Incrementar el último episodio visto
            videoPlayer.addEventListener('ended', function(){
                onVideoEnded(currentProgram.resource);
            });
        } else {
            console.log("No hay programas en este momento.");
            document.getElementById('video-source').src = "mi_video.mp4";
            currentShowDiv.innerHTML = `<h2>No hay programas en este momento.</h2>
                                        <p>Canal: ${channel}</p>
                                        <p>Día: ${now.toLocaleString('en-US', { weekday: 'long' })} (${currentDayShort})</p>
                                        <p>Hora Actual: ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}</p>`;
        }
    }

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
    function loadPostRoll(recurso){

        //fuera de transmision no hay publicidad (publicity = 0 en json)
        if(recurso.publicity !== 0){
            //Calcular tiempo disponible para publicidad
            const availableTime = recurso.publicity*60;//en segundos
            
            //buscar una tanda mayor al tiempo disponible, saltar a duracionTanda - tiempoDisponible y play
            //o iniciar una tanda mayor a duración y con un eventlistener, al llegar a disponible + 1 segundo, cargar el siguiente programa
            //debería tener tandas de duracion standard (los shows son de 45 o 50 minutos para un slot de 60)
            //hay que cuidar que no llame al onVideoEnded() (con un flag o cortando ANTES que termine la tanda)
            //la tanda debería tener un blanco al final de 5 segundos

            const postRoll = 'tanda.mp4';//FIX ME
            document.getElementById('video-source').src = postRoll;
            videoPlayer.load();
            videoPlayer.play();//Iniciar la reproducción

            // Escuchar el evento timeupdate durante el postroll
            let alreadyJumped = false;

            function onTimeUpdate() {
                // Verificar si se alcanza el fin del availableTime 
                if (videoPlayer.currentTime > availableTime) {
                    if(!alreadyJumped){
                        alreadyJumped = true;// Marcar que ya se ha saltado
                        //Cargar siguiente programa en el mismo canal
                        loadContent(currentChannel);//FIX ME: esto carga para el default channel, no el canal actual
                    }
                    // Remover el listener para que no se llame múltiples veces
                    videoPlayer.removeEventListener('timeupdate', onTimeUpdate);
                }
            }

            videoPlayer.addEventListener('timeupdate', onTimeUpdate);
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