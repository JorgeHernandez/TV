# TO DO

##Mejoras:##
-si solo hay un archivo para un show, mostrar siempre el mismo episodio (total episodes: 1 => aunque sean 24 episodios, solo hay uno)
-si no hay siguiente episodio, volver al primero y resetear el json. Esto podria ser agregando una key total_episodes al json
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

##Implementadas:##
    -si el show indicado en el json no tiene resource, poner un poster generico por la duracion (No video available)
    -hacer aleatoria la tanda publicitaria, ver que no se repita. Varias tandas para cada canal/año, todas de 20': tanda_9_1984_1.mp4
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

##BUGS##
-ver si se acumulan addEventListener al finalizar el programa y la tanda
-poner en fullscreen al empezar video.mozRequestFullScreen();
-si la duración del video es 50:42 la reproducción termina a los 50:00
-si lo que finaliza es una tanda, hace una peticion para intentar actualizar el episodio. 


# TV Application

## Overview

This TV application allows users to watch live TV programs based on their current time and selected channel. The app fetches program data from a JSON file and automatically plays the current show, adjusting the playback to the current minute.

## Features

- Displays the current program based on the user's selected channel and the current time.
- Automatically seeks to the current minute of the program being played.
- User-friendly interface to navigate through channels and programs.
- Supports various video formats (check compatibility).

## Installation

To run this application locally, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/JorgeHernandez/tv1984.git

2. **Navigate to the project directory:**

bash

    cd tv1984

3. **Open the index.html file in your web browser.**

**Usage**

    Select a channel from the available options.
    The application will automatically fetch the current program based on the selected channel and the current time.
    The video player will start playing the program, seeking to the current minute.

**JSON Data Structure**

The application expects a JSON file with the following structure:

json

[
    {
        "title": "News Show",
        "channel": 9,
        "start": "20:00",
        "end": "21:00",
        "weekday": "Mon",
        "resource": "path/to/video.mp4"
    },
    ...
]

    title: The title of the program.
    channel: The channel number.
    start: The start time of the program (HH:MM format).
    end: The end time of the program (HH:MM format).
    weekday: The day of the week the program airs (e.g., "Mon").
    resource: The path to the video file.

## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, please open an issue or submit a pull request.

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.
