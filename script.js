// Initialize variables and get UI elements
let VoiceRecognized = false;
let timer = 0;
let globalTimer = 0;
let timeoutId = null;
let intervalId = null;
let globalIntervalId = null;
let stopRequested = false;  // Flag to indicate if stop was requested
const voiceStatus = document.getElementById('voice-status');
const timerDisplay = document.getElementById('timer');
const transcriptList = document.getElementById('transcript-list');
const globalTimerDisplay = document.getElementById('global-timer');

let recognition;
let mediaRecorder;
let chunks = [];

function setupMediaRecorder(stream) {
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function(e) {
        chunks.push(e.data);
    };
}

navigator.mediaDevices.getUserMedia({audio: true})
    .then(setupMediaRecorder);

// Set up SpeechRecognition
function setupSpeechRecognition() {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-MX'; // Set language to Spanish (Mexico)

    // Define SpeechRecognition event handlers
    recognition.onresult = function(event) {
        for (let i = event.resultIndex; i < event.results.length; i++) {
            // Only add final results to the list
            if (event.results[i].isFinal) {
                // Get transcript
                let transcript = event.results[i][0].transcript;

                // Add timestamp to the transcript
                let timestamp = new Date(globalTimer * 1000).toISOString().substr(14, 5);

                // Add transcript to the list
                let listItem = document.createElement('li');
                listItem.textContent = `${timestamp} - ${transcript}`;

                // Create "Play" button for this transcript
                let playButton = document.createElement('button');
                playButton.textContent = 'Play';
                playButton.onclick = function() {
                    let blob = new Blob(chunks, {'type': 'audio/ogg; codecs=opus'});
                    let audioURL = URL.createObjectURL(blob);
                    let audio = new Audio(audioURL);
                    audio.play();
                };

                // Create "Pause" button for this transcript
                let pauseButton = document.createElement('button');
                pauseButton.textContent = 'Pause';
                pauseButton.onclick = function() {
                    let blob = new Blob(chunks, {'type': 'audio/ogg; codecs=opus'});
                    let audioURL = URL.createObjectURL(blob);
                    let audio = new Audio(audioURL);
                    audio.pause();
                };

                listItem.appendChild(playButton);
                listItem.appendChild(pauseButton);
                transcriptList.appendChild(listItem);
            }
        }

        // Set VoiceRecognized to true when human voice is detected
        VoiceRecognized = true;
        voiceStatus.textContent = 'Voice detected';
        voiceStatus.style.color = 'green';

        // Reset timer
        timer = 0;
        timerDisplay.textContent = timer;

        // Set VoiceRecognized to false after 2 seconds of not hearing a human voice
        clearTimeout(timeoutId);
        timeoutId = setTimeout(function() {
            VoiceRecognized = false;
            voiceStatus.textContent = 'Undetected';
            voiceStatus.style.color = 'red';
            startTimer();

            // Stop recording when no voice is detected
            mediaRecorder.stop();
        }, 2000);

        // Start recording when voice is detected
        if (mediaRecorder.state === 'inactive') {
            chunks = [];  // Clear the old recorded chunks
            mediaRecorder.start();
        }
    }

     // Restart the service when it ends
    recognition.onend = function() {
        // Check if the stopListening function was called, if not restart the service
        if(!stopRequested) {
            recognition.start();
        }
    }

    recognition.onerror = function(event) {
        console.log('Error occurred in recognition: ' + event.error);
        if (event.error === 'no-speech') {
            recognition.start();
        }
    };
}

// Function to start the timer
function startTimer() {
    // Clear existing interval
    if (intervalId) {
        clearInterval(intervalId);
    }
    timer = 0;
    intervalId = setInterval(function() {
        if (!VoiceRecognized) {
            timer++;
            timerDisplay.textContent = timer;
        }
    }, 1000);
}

// Function to start the global timer
function startGlobalTimer() {
    globalTimer = 0;
    globalIntervalId = setInterval(function() {
        globalTimer++;
        // Convert the timer value to mm:ss format and display it in the UI
        let minutes = Math.floor(globalTimer / 60);
        let seconds = globalTimer % 60;
        globalTimerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Function to stop the global timer
function stopGlobalTimer() {
    clearInterval(globalIntervalId);
    // Reset the global timer display in the UI
    globalTimerDisplay.textContent = '0';
}

// Function to start listening to the microphone
function startListening() {
    // Reset stopRequested flag
    stopRequested = false;
    setupSpeechRecognition();
    recognition.start();
    startTimer();
    startGlobalTimer();  // Start the global timer
}

// Function to stop listening to the microphone
function stopListening() {
    // Set stopRequested flag
    stopRequested = true;
    recognition.stop();
    clearTimeout(timeoutId);
    clearInterval(intervalId); // Clear the timer interval
    stopGlobalTimer();  // Stop the global timer

    // Stop recording when the user presses the "Stop" button
    if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
}

// Get the Start and Stop buttons
const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');

// Set up button event listeners
startButton.addEventListener('click', startListening);
stopButton.addEventListener('click', stopListening);
