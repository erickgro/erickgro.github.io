let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let source;
let analyser = audioCtx.createAnalyser();
let bufferLength;
let dataArray;
let visualizerCanvas;
let visualizerContext;
let visualizerAnimationId;

analyser.fftSize = 256;
bufferLength = analyser.frequencyBinCount;
dataArray = new Uint8Array(bufferLength);

visualizerCanvas = document.createElement('canvas');
visualizerCanvas.width = 500;
visualizerCanvas.height = 500;
document.body.appendChild(visualizerCanvas);
visualizerCanvas.style.display = 'none';

visualizerContext = visualizerCanvas.getContext('2d');

function startVisualizer(stream) {
    source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    visualizerCanvas.style.display = 'block';
    visualize();
}

function visualize() {
    visualizerAnimationId = requestAnimationFrame(visualize);
    analyser.getByteFrequencyData(dataArray);
    // ... (rest of the visualize function)
}

function stopVisualizer() {
    source.disconnect();
    visualizerCanvas.style.display = 'none';
    cancelAnimationFrame(visualizerAnimationId);
}

export { startVisualizer, stopVisualizer };
