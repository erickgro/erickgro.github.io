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

    // Calculate the center and radius of the circle
    let centerX = visualizerCanvas.width / 2;
    let centerY = visualizerCanvas.height / 2;
    let radius = 200;  // Adjust as needed

    // Use only the first N values
    let N = 64;  // Adjust as needed
    let barWidth = (2 * Math.PI) / N;

    for (let i = 0; i < N; i++) {
        // Calculate the length of the segment
        let barLength = dataArray[i] / 2;  // Adjust as needed

        // Calculate the start and end angles for this segment
        let startAngle = i * barWidth;
        let endAngle = (i + 1) * barWidth;

        // Draw the segment
        visualizerContext.beginPath();
        visualizerContext.moveTo(centerX, centerY);
        visualizerContext.arc(centerX, centerY, barLength, startAngle, endAngle);
        visualizerContext.lineTo(centerX, centerY);
        visualizerContext.stroke();
    }
}

function stopVisualizer() {
    source.disconnect();
    visualizerCanvas.style.display = 'none';
    cancelAnimationFrame(visualizerAnimationId);
}

export { startVisualizer, stopVisualizer };
