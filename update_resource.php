<?php
// Ruta al archivo JSON
$jsonFile = 'data.json';

// Verificamos si se recibió una solicitud POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Obtenemos el contenido de la solicitud
    $data = json_decode(file_get_contents('php://input'), true);
    error_log(print_r($data, true)); // Para ver qué datos se están recibiendo en el log

    // Verificamos que se haya recibido el recurso y el nuevo valor
    if (isset($data['resource']) && isset($data['last_seen_episode'])) {
        // Cargamos el contenido actual del archivo JSON
        $jsonData = json_decode(file_get_contents($jsonFile), true);

        // Verificamos si la carga del JSON fue exitosa
        if ($jsonData === null) {
            error_log("Error al decodificar el JSON: " . json_last_error_msg());
            echo json_encode(['status' => 'error', 'message' => 'Error al leer el archivo JSON.']);
            exit;
        }

        // Buscamos el recurso correspondiente
        foreach ($jsonData as &$program) {
            if ($program['resource'] === $data['resource']) {
                // Actualizamos el valor de last_seen_episode
                $program['last_seen_episode'] = $data['last_seen_episode'];
                break; // Salimos del bucle una vez que encontramos el recurso
            }
        }

        // Codificamos de nuevo el JSON
        $jsonOutput = json_encode($jsonData, JSON_PRETTY_PRINT);
        if ($jsonOutput === false) {
            error_log("Error al codificar el JSON: " . json_last_error_msg());
            echo json_encode(['status' => 'error', 'message' => 'Error al codificar el JSON.']);
            exit;
        }

        // Hacemos una copia de seguridad del archivo JSON antes de sobrescribirlo
        if (!copy($jsonFile, $jsonFile . '.bak')) {
            error_log("Error al crear una copia de seguridad del archivo JSON.");
            echo json_encode(['status' => 'error', 'message' => 'Error al crear una copia de seguridad.']);
            exit;
        }

        // Guardamos los cambios de nuevo en el archivo JSON
        if (file_put_contents($jsonFile, $jsonOutput) === false) {
            error_log("Error al escribir en el archivo JSON.");
            echo json_encode(['status' => 'error', 'message' => 'Error al actualizar el archivo JSON.']);
            exit;
        }

        // Respondemos con un mensaje de éxito
        echo json_encode(['status' => 'success', 'message' => 'Valor actualizado correctamente.']);
    } else {
        // Respondemos con un error si faltan datos
        echo json_encode(['status' => 'error', 'message' => 'Datos incompletos.']);
    }
} else {
    // Respondemos con un error si no es una solicitud POST
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido.']);
}
?>

