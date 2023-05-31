import { startVisualizer, stopVisualizer } from './visualizer.js';

document.addEventListener('DOMContentLoaded', (event) => {
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
    link.classList.add('link-disabled');

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

                    if (voiceRecognitionStart < 2) {
                        voiceRecognitionStart = 0;
                    } else {
                        voiceRecognitionStart -= 2;
                    }

                    let hours = Math.floor(voiceRecognitionStart / 3600);
                    let minutes = Math.floor((voiceRecognitionStart % 3600) / 60);
                    let seconds = voiceRecognitionStart % 60;

                    let hoursStr = hours.toString();
                    let minutesStr = minutes.toString().padStart(2, '0');
                    let secondsStr = seconds.toString().padStart(2, '0');

                    let timestamp;

                    if (hours > 0) {
                        timestamp = `${hoursStr}:${minutesStr}:${secondsStr}`;
                    } else {
                        timestamp = `${minutesStr}:${secondsStr}`;
                    }
                    
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
                        let [hourOrMinute, minuteOrSecond, second] = timestamp.split(':');
                        if (second === undefined) {  // format is mm:ss
                            audioElement.currentTime = hourOrMinute * 60 + Number(minuteOrSecond);
                        } else {  // format is hh:mm:ss
                            audioElement.currentTime = hourOrMinute * 3600 + minuteOrSecond * 60 + Number(second);
                        }
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
        let hours = Math.floor(globalTimer / 3600);
        let minutes = Math.floor((globalTimer % 3600) / 60);
        let seconds = globalTimer % 60;

        let hoursStr = hours.toString();
        let minutesStr = minutes.toString().padStart(2, '0');
        let secondsStr = seconds.toString().padStart(2, '0');

        if (hours > 0) {
            globalTimerDisplay.textContent = `${hoursStr}:${minutesStr}:${secondsStr}`;
        } else if (minutes > 0) {
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

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
            mediaStream = stream;
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            startVisualizer(mediaStream);  // START VISUALIZER
            startGlobalTimer();
            stopButton.style.border = 'none';

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
    let stopButtonMarginTop = 41;

    let moveUpDistance = startButtonRect.top - stopButtonRect.top - stopButtonMarginTop;
    startButton.style.setProperty('--move-up-distance', `${-moveUpDistance}px`);

    startButton.classList.add('moving');
    startButton.classList.add('clicked');
    startButton.addEventListener('animationend', function() {
        startButton.style.opacity = '0';
        stopButton.style.display = 'block';
        startListening();

        setTimeout(() => {
            startButton.style.display = 'none';
        }, 500);
    });
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
    controlBar.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    controlBar.removeChild(textarea);

});
});