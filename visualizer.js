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

    // Overlay a semi-transparent rectangle to gradually fade out the older drawings
    visualizerContext.fillStyle = 'rgba(255, 255, 255, 0.1)';  // Adjust the alpha value (0.1) as needed
    visualizerContext.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    visualizerContext.fillStyle = 'black';

    // Calculate the center and radius of the circle
    let centerX = visualizerCanvas.width / 2;
    let centerY = visualizerCanvas.height / 2;
    let baseRadius = 200;  // Adjust as needed

    // Calculate the width of each segment of the circle
    let barWidth = (2 * Math.PI) / bufferLength;

    visualizerContext.beginPath();

    for (let i = 0; i < bufferLength / 2; i++) {
        // Calculate the length of the segment
        let barLength = Math.log(1 + dataArray[i]) * 10;  // The factor of 10 can be adjusted as needed

        // Calculate the angle for this segment
        let angle = i * barWidth * 2;

        // Calculate the x and y coordinates for this segment
        let x = centerX + (baseRadius + barLength) * Math.cos(angle);
        let y = centerY + (baseRadius + barLength) * Math.sin(angle);

        // Draw the segment
        if (i === 0) {
            visualizerContext.moveTo(x, y);
        } else {
            visualizerContext.lineTo(x, y);
        }
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
