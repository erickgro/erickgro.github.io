// Initialize variables and get UI elements
let VoiceRecognized = false;
let timer = 0;
let timeoutId = null;
let intervalId = null;
const voiceStatus = document.getElementById('voice-status');
const timerDisplay = document.getElementById('timer');
const transcriptList = document.getElementById('transcript-list');

// Check if SpeechRecognition is available
if (!('webkitSpeechRecognition' in window)) {
    alert("Your Browser does not support the Speech Recognition API. Please try another browser like Chrome.");
} else {
    // Initialize SpeechRecognition
    var recognition = new webkitSpeechRecognition();
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

    recognition.onerror = function(event) {
        console.log('Error occurred in recognition: ' + event.error);
    }
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
    recognition.start();
    startTimer();
}

// Function to stop listening to the microphone
function stopListening() {
    recognition.stop();
    clearTimeout(timeoutId);
    clearInterval(intervalId); // Clear the timer interval
}