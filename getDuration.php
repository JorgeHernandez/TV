<?php
// cuenta de google api d..25051810
// https://console.cloud.google.com
// proyecto: TVsimulator

function getVideoDuration($videoUrl, $apiKey) {
    // Extraer el ID del video de la URL
    parse_str(parse_url($videoUrl, PHP_URL_QUERY), $query);
    $videoId = $query['v'] ?? null;

    if (!$videoId) {
        return "No se pudo encontrar el ID del video.";
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
        return "Error al realizar la solicitud a la API. Código HTTP: " . $httpCode;
    }

    // Decodificar la respuesta JSON
    $data = json_decode($response, true);

    // Verificar si se obtuvo el video
    if (empty($data['items'])) {
        return "No se encontró información para el video.";
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

// Ejemplo de uso
$apiKey = 'AIzaSyDeyUInaQjw6zV2N3IvL753CkU3Wr7jUhA'; // Reemplaza con tu API Key
$videoUrl = 'https://www.youtube.com/watch?v=nuDKz7EaHNE'; // Reemplaza con la URL del video
$durationInSeconds = getVideoDuration($videoUrl, $apiKey);

echo "La duración del video en segundos es: " . $durationInSeconds;

?>