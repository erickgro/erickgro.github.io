// Initialize variables and get UI elements
let VoiceRecognized = false;
let timer = 0;
let globalTimer = 0;
let timeoutId = null;
let intervalId = null;
let globalIntervalId = null;
let stopRequested = false;
let isListening = false;
const voiceStatus = document.getElementById('voice-status');
const timerDisplay = document.getElementById('timer');
const transcriptList = document.getElementById('transcript-list');
const globalTimerDisplay = document.getElementById('global-timer');

let recognition;
let mediaRecorder;
let recordedChunks = [];
let audioElement;

// Set up SpeechRecognition
function setupSpeechRecognition() {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-MX'; // Set language to Spanish (Mexico)

    // Define SpeechRecognition event handlers
    recognition.onstart = function() {
        isListening = true; // Set isListening to true when the service starts
    }

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
                let link = document.createElement('a');
                link.href = '#';
                link.textContent = `${timestamp} - ${transcript}`;
                link.onclick = function() {
                    // Convert timestamp to seconds and set as current time for audio element
                    let [minutes, seconds] = timestamp.split(':');
                    audioElement.currentTime = minutes * 60 + Number(seconds);
                    audioElement.play();
                };
                listItem.appendChild(link);
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
        }, 2000);
    }

    // Restart the service when it ends
    recognition.onend = function() {
        isListening = false; // Set isListening to false when the service ends
        // Check if the stopListening function was called, if not restart the service
        if(!stopRequested && !isListening) { // Check if the service is not already running
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
    if(!isListening) { // Check if the service is not already running
        recognition.start();
    }
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
}

// Function to setup recording
function setupRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();

        mediaRecorder.ondataavailable = function(e) {
            recordedChunks.push(e.data);
        };
    });
}

// Function to stop recording
function stopRecording() {
    mediaRecorder.stop();

    // Process the recorded audio data into an ogg file with opus codec
    mediaRecorder.onstop = function(e) {
        const blob = new Blob(recordedChunks, {
            'type' : 'audio/ogg; codecs=opus'
        });
        recordedChunks = [];
        let audioURL = window.URL.createObjectURL(blob);

        // Create a new audio element and set the source to the processed audio
        audioElement = new Audio(audioURL);

        // Add the audio element to the UI
        let audioListItem = document.createElement('li');
        let audioPlayer = document.createElement('audio');
        audioPlayer.controls = true;
        audioPlayer.src = audioURL;
        audioListItem.appendChild(audioPlayer);
        transcriptList.appendChild(audioListItem);
    };
}

// Get the Start and Stop buttons
const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');

// Set up button event listeners
startButton.addEventListener('click', function() {
    startListening();
    setupRecording(); // Start recording immediately when the button is clicked
});

stopButton.addEventListener('click', function() {
    stopListening();
    stopRecording(); // Stop recording immediately when the button is clicked
});
