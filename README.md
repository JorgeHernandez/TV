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
