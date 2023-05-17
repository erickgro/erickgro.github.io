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
visualizerCanvas.style.border = '1px solid red';

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
    
    // Clear the canvas
    visualizerContext.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    
    // Draw the frequency data
    for(let i = 0; i < bufferLength; i++) {
        // Calculate the height of the bar for this frequency
        let barHeight = dataArray[i] / 2;  // Divide by 2 to fit the canvas height
        
        // Draw the bar
        visualizerContext.fillRect(i * 4, visualizerCanvas.height - barHeight, 2, barHeight);
    }
}

function stopVisualizer() {
    source.disconnect();
    visualizerCanvas.style.display = 'none';
    cancelAnimationFrame(visualizerAnimationId);
}

export { startVisualizer, stopVisualizer };
