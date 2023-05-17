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
    let baseRadius = 200;  // Adjust as needed

    // Calculate the width of each segment of the circle
    let barWidth = (2 * Math.PI) / bufferLength;

    visualizerContext.beginPath();

    for (let i = 0; i < bufferLength; i++) {
        // Calculate the length of the segment
        let barLength = Math.log(1 + dataArray[i]) * 10;  // The factor of 10 can be adjusted as needed

        // Calculate the start and end angles for this segment
        let startAngle = i * barWidth;
        let endAngle = (i + 1) * barWidth;

        // Calculate the start and end points of the segment
        let startX = centerX + baseRadius * Math.cos(startAngle);
        let startY = centerY + baseRadius * Math.sin(startAngle);
        let endX = centerX + (baseRadius + barLength) * Math.cos(startAngle);
        let endY = centerY + (baseRadius + barLength) * Math.sin(startAngle);

        // Draw the segment
        visualizerContext.moveTo(startX, startY);
        visualizerContext.lineTo(endX, endY);
    }

    visualizerContext.closePath();
    visualizerContext.stroke();
}


function stopVisualizer() {
    source.disconnect();
    visualizerCanvas.style.display = 'none';
    cancelAnimationFrame(visualizerAnimationId);
}

export { startVisualizer, stopVisualizer };
