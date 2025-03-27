<?php
// cuenta de google api d..25051810
// https://console.cloud.google.com
// proyecto: TVsimulator

function getVideoDuration($videoUrl, $apiKey) {
    // Extraer el ID del video de la URL
    parse_str(parse_url($videoUrl, PHP_URL_QUERY), $query);
    $videoId = $query['v'] ?? null;

    if (!$videoId) {
        return 0; // Regresar 0 en caso de error
    }

    // Construir la URL de la API
    $apiUrl = "https://www.googleapis.com/youtube/v3/videos?id={$videoId}&key={$apiKey}&part=contentDetails";

    // Usar cURL para realizar la solicitud a la API
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        return 'bbbb'; // Regresar 0 en caso de error
    }

    // Decodificar la respuesta JSON
    $data = json_decode($response, true);

    // Verificar si se obtuvo el video
    if (empty($data['items'])) {
        return 'cccc'; // Regresar 0 en caso de error
    }

    // Obtener la duración del video
    $duration = $data['items'][0]['contentDetails']['duration'];

    // Convertir la duración a segundos
    $seconds = convertDurationToSeconds($duration);

    return $seconds;
}

function convertDurationToSeconds($duration) {
    // Eliminar el prefijo 'PT'
    $duration = substr($duration, 2);
    
    $seconds = 0;
    $matches = [];
    
    // Expresión regular para capturar minutos y segundos
    preg_match('/(?:(\d+)M)?(?:(\d+)S)?/', $duration, $matches);
    
    // Sumar los minutos y segundos convertidos a segundos
    $minutes = isset($matches[1]) ? (int)$matches[1] : 0; // Convertir a entero
    $secondsPart = isset($matches[2]) ? (int)$matches[2] : 0; // Convertir a entero

    $seconds += $minutes * 60; // Minutos a segundos
    $seconds += $secondsPart; // Segundos

    return $seconds;
}

// Obtener la URL del video desde la solicitud GET
if (isset($_GET['url'])) {
    $videoUrl = $_GET['url'];
    $apiKey = ''; // Reemplaza con tu API Key
    $durationInSeconds = getVideoDuration($videoUrl, $apiKey);
    
    // Devolver la duración en segundos
    echo $durationInSeconds;
} else {
    // Si no se proporciona la URL, devolver 0
    echo 'aaaaa';
}
?>
