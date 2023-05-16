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

                    let timestamp = new Date(voiceRecognitionStart * 1000).toISOString().substr(14, 5);

                    transcripts.push({timestamp: timestamp, transcript: transcript});

                    let listItem = document.createElement('li');
                    let link = document.createElement('a');
                    link.href = '#';
                    link.textContent = timestamp;
                    link.onclick = function() {
                        let [minutes, seconds] = timestamp.split(':');
                        audioElement.currentTime = minutes * 60 + Number(seconds);
                        audioElement.play();
                        return false; 
                    };
                    listItem.appendChild(link);
                    listItem.appendChild(document.createTextNode(` - ${transcript}`));

                    let copyButton = document.createElement('button');
                    copyButton.textContent = 'Copy';
                    copyButton.className = 'copy-button';
                    copyButton.addEventListener('click', function() {
                        let textarea = document.createElement('textarea');
                        textarea.textContent = `${timestamp} - ${transcript}`;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
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
            }, 2000);

            if (transcripts.length === 1) {
                // Enable the "Copy all" button when the first transcription is added
                let copyAllButton = document.getElementById('copy-all');
                copyAllButton.disabled = false;

                // Set up the "Copy all" button
                copyAllButton.addEventListener('click', function() {
                    let allTranscriptions = transcripts.map(t => `${t.timestamp} - ${t.transcript}`).join('\n');
                    navigator.clipboard.writeText(allTranscriptions)
                        .then(function() {
                            /* clipboard successfully set */
                            console.log('Clipboard successfully set');
                        }, function() {
                            /* clipboard write failed */
                            console.log('Clipboard write failed');
                        });
                });
            }
        }

        recognition.onend = function() {
            isListening = false;
            if(!stopRequested && !isListening) {
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
            globalTimerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

            let audioControlBar = document.getElementById('audio-control-bar');
            audioControlBar.appendChild(audioElement);
        };
    }

    const startButton = document.getElementById('start-button');
    const stopButton = document.getElementById('stop-button');

    startButton.addEventListener('click', startListening);
    stopButton.addEventListener('click', stopListening);

    document.getElementById('copy-all').addEventListener('click', function() {
        let allTranscriptions = transcripts.map(t => `${t.timestamp} - ${t.transcript}`).join('\n');
        navigator.clipboard.writeText(allTranscriptions)
            .then(function() {
                console.log('Clipboard successfully set');
            }, function() {
                console.log('Clipboard write failed');
            });
    });
});