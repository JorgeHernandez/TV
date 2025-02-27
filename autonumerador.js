// Supongamos que este es tu array de objetos
let programs = [
    {
        "channel": 9,
        "weekday": ["Mon", "Tue"],
        "start": 0,
        "end": 60,
        "title": "Programa 1"
    },
    {
        "channel": 10,
        "weekday": ["Wed", "Thu"],
        "start": 60,
        "end": 120,
        "title": "Programa 2"
    }
    // ... hasta 400 objetos
];

// Añadir el campo id autoincremental
programs = programs.map((program, index) => {
    return {
        id: index + 1, // Asignar un id autoincremental comenzando desde 1
        ...program // Mantener el resto de las propiedades del objeto
    };
});

// Mostrar el resultado
console.log(JSON.stringify(programs, null, 2));