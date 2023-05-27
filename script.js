import { startVisualizer, stopVisualizer } from './visualizer.js';

document.addEventListener('DOMContentLoaded', (event) => {
    // Initialize variables and get UI elements    
    let mediaStream;
    let VoiceRecognized = false;
    let timer = 0;
    let globalTimer = 0;
    let timeoutId = null;
    let intervalId = null;
    let globalIntervalId = null;
    let stopRequested = false;
    let isListening = false;
    let voiceRecognitionStart = 0;
    const voiceStatus = document.getElementById('voice-status');
    const timerDisplay = document.getElementById('timer');
    const transcriptList = document.getElementById('transcript-list');
    const globalTimerDisplay = document.getElementById('global-timer');
    const controlBar = document.getElementById('control-bar');
    let link = document.createElement('a');
    link.href = '#';
    link.classList.add('link-disabled');  // Add the 'link-disabled' class initially


    let recognition;
    let mediaRecorder;
    let recordedChunks = [];
    let audioElement = null;
    let transcripts = [];

    function setupSpeechRecognition() {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-MX';

        recognition.onstart = function() {
            isListening = true;
        }

        recognition.onresult = function(event) {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (VoiceRecognized === false) {
                    voiceRecognitionStart = globalTimer;
                    VoiceRecognized = true;
                }

                if (event.results[i].isFinal) {
                    let transcript = event.results[i][0].transcript;
                    let timestamp = new Date((voiceRecognitionStart - 2) * 1000).toISOString().substr(14, 5);

                    transcripts.push({timestamp: timestamp, transcript: transcript});

                    let listItem = document.createElement('li');
                    let link = document.createElement('a');
                    link.href = '#';

                    let timestampElement = document.createElement('span');
                    timestampElement.className = 'timestamp';
                    timestampElement.textContent = timestamp;

                    if (!stopRequested) {
                        timestampElement.className += ' active-timestamp';
                        } else {
                            timestampElement.className += ' stopped-timestamp';
                        }

                    link.appendChild(timestampElement);

                    link.onclick = function() {
                        let [minutes, seconds] = timestamp.split(':');
                        audioElement.currentTime = minutes * 60 + Number(seconds);
                        audioElement.play();
                        return false; 
                    };

                    listItem.appendChild(link);

                    let transcriptElement = document.createElement('span');
                    transcriptElement.className = 'transcript';
                    transcriptElement.textContent = `${transcript}`;
                    
                    listItem.appendChild(document.createElement('br'));
                    listItem.appendChild(transcriptElement);

                    let copyButton = document.createElement('button');
                    copyButton.className = 'copy-button';

                    let copyIcon = document.createElement('img');
                    copyIcon.src = 'images/copy.svg';
                    copyIcon.alt = 'Copy';

                    copyButton.appendChild(copyIcon);

                    copyButton.addEventListener('click', function() {
                        let textarea = document.createElement('textarea');
                        textarea.textContent = `${timestamp}\n${transcript}`;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
                    });

                    copyButton.addEventListener('mousedown', function() {
                        this.classList.add('copy-button-pressed');
                     });

                    copyButton.addEventListener('mouseup', function() {
                        this.classList.remove('copy-button-pressed');
                    });


                    listItem.appendChild(copyButton);
                    transcriptList.appendChild(listItem);
                }
            }

            voiceStatus.textContent = 'Voice detected';
            voiceStatus.style.color = 'green';

            timer = 0;
            timerDisplay.textContent = timer;

            clearTimeout(timeoutId);
            timeoutId = setTimeout(function() {
                VoiceRecognized = false;
                voiceStatus.textContent = 'Undetected';
                voiceStatus.style.color = 'red';
                startTimer();
            }, 1600);
        }

        recognition.onend = function() {
            isListening = false;
            if(!stopRequested && !isListening)
        {
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

function startTimer() {
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

function startGlobalTimer() {
    globalTimer = 0;
    globalIntervalId = setInterval(function() {
        globalTimer++;
        let minutes = Math.floor(globalTimer / 60);
        let seconds = globalTimer % 60;

        let minutesStr = minutes < 10 ? minutes.toString() : minutes.toString().padStart(2, '0');
        let secondsStr = seconds.toString().padStart(2, '0');

        // Display the timer
        if (minutes > 0) {
            globalTimerDisplay.textContent = `${minutesStr}:${secondsStr}`;
        } else {
            globalTimerDisplay.textContent = `${secondsStr}`;
        }
    }, 1000);
}

function stopGlobalTimer() {
    clearInterval(globalIntervalId);
    globalTimerDisplay.textContent = '0';
}

function startListening() {
    stopRequested = false;
    setupSpeechRecognition();
    if(!isListening) {
        recognition.start();
    }
    startTimer();
    startGlobalTimer();

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
            mediaStream = stream;
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            startVisualizer(mediaStream);  // START VISUALIZER

            mediaRecorder.ondataavailable = function(e) {
                recordedChunks.push(e.data);
            };
        });
}

function stopListening() {
    stopRequested = true;
    recognition.stop();
    clearTimeout(timeoutId);
    clearInterval(intervalId);
    stopGlobalTimer();

    if (mediaRecorder.stream) {
        let tracks = mediaRecorder.stream.getTracks();
        tracks.forEach(track => track.stop());
    }

    mediaRecorder.stop();

    mediaRecorder.onstop = function(e) {
        const blob = new Blob(recordedChunks, {
            'type' : 'audio/ogg; codecs=opus'
        });
        recordedChunks = [];
        let audioURL = window.URL.createObjectURL(blob);

        if (!audioElement) {
            audioElement = new Audio();
            audioElement.controls = true;
        }

        audioElement.src = audioURL;
        controlBar.appendChild(audioElement);
        controlBar.appendChild(copyAllButton);
    };

    stopVisualizer(); // STOP VISUALIZER
}

const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');
const copyAllButton = document.getElementById('copy-all');
const stopButtonContainer = document.getElementById('stop-button-container');

copyAllButton.style.display = 'none';
stopButton.style.display = 'none';

startButton.addEventListener('click', function() {
    let startButtonRect = startButton.getBoundingClientRect();
    let stopButtonRect = stopButton.getBoundingClientRect();
    let stopButtonMarginTop = 41; // stop-button margin from the top

    let moveUpDistance = startButtonRect.top - stopButtonRect.top - stopButtonMarginTop;
    startButton.style.setProperty('--move-up-distance', `${-moveUpDistance}px`);

    startButton.classList.add('moving');

    // Start the listening
    startListening();
    
    startButton.addEventListener('animationend', function() {
        // start to fade out the button
        startButton.style.opacity = '0';
        stopButton.style.display = 'block';

        // Use transitionend event to hide the button after it's faded out
        startButton.addEventListener('transitionend', function() {
            startButton.style.display = 'none';
        });

    });

    // Hide copyAllButton when recording starts
    copyAllButton.style.display = 'none';
});

stopButton.addEventListener('click', function() {
    
    stopListening();
    const timestamps = document.querySelectorAll('.timestamp');
    timestamps.forEach((timestamp) => {
    timestamp.classList.remove('active-timestamp');
    timestamp.classList.add('stopped-timestamp');
});
    stopButtonContainer.style.display = 'none';
    
    startButton.style.display = 'none';

    copyAllButton.style.display = 'block';
});

copyAllButton.addEventListener('click', function() {
    let textarea = document.createElement('textarea');
    let allTranscriptions = transcripts.map(t => `${t.timestamp} - ${t.transcript}`).join('\n');
    textarea.textContent = allTranscriptions;
    
    // Append textarea to audio control bar
    controlBar.appendChild(textarea);

    textarea.select();
    document.execCommand('copy');
    controlBar.removeChild(textarea);

});
});