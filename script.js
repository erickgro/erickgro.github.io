// Initialize variables and get UI elements
let VoiceRecognized = false;
let timer = 0;
let timeoutId = null;
let intervalId = null;
let stopRequested = false;  // Flag to indicate if stop was requested
const voiceStatus = document.getElementById('voice-status');
const timerDisplay = document.getElementById('timer');
const transcriptList = document.getElementById('transcript-list');

let recognition;

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

                // Add transcript to the list
                let listItem = document.createElement('li');
                listItem.textContent = transcript;
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

// Function to start listening to the microphone
function startListening() {
    // Reset stopRequested flag
    stopRequested = false;
    setupSpeechRecognition();
    recognition.start();
    startTimer();
}

// Function to stop listening to the microphone
function stopListening() {
    // Set stopRequested flag
    stopRequested = true;
    recognition.stop();
    clearTimeout(timeoutId);
    clearInterval(intervalId); // Clear the timer interval
}