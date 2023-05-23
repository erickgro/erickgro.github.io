// Audio Visualizer Code
let audioCtx;
let source;
let analyser;
let bufferLength;
let dataArray;
let visualizerCanvas;
let visualizerContext;
let visualizerAnimationId;

function initAudioContext() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
}

visualizerCanvas = document.createElement('canvas');
visualizerCanvas.width = 500;
visualizerCanvas.height = 160;

document.body.appendChild(visualizerCanvas);
visualizerCanvas.style.display = 'none';

visualizerContext = visualizerCanvas.getContext('2d');

function startVisualizer(stream) {
  if (!audioCtx) {
    initAudioContext();
  }
  source = audioCtx.createMediaStreamSource(stream);
  source.connect(analyser);
  visualizerCanvas.style.display = 'block';
  visualize();
}

function visualize() {
  visualizerAnimationId = requestAnimationFrame(visualize);
  analyser.getByteFrequencyData(dataArray);

  // Fill the background with color #0D0C0B
  visualizerContext.fillStyle = '#0D0C0B';
  visualizerContext.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

  let centerX = visualizerCanvas.width / 2;
  let centerY = visualizerCanvas.height / 2;
  let baseRadius = (120/ 2); // Set the minimum diameter to 96px
  let barWidth = (2 * Math.PI) / bufferLength;

  let maxBarLength = (2000 / 2) - baseRadius; // Set the maximum diameter to 140px
  
  // Normalize dataArray values and map to a sensitivity range
  let normalizedDataArray = dataArray.map(value => (value / 255) * 20);
  let newBufferLength = bufferLength / 2;

  // Calculate the root mean square (RMS) of the dataArray
  let rms = Math.sqrt(dataArray.reduce((acc, val) => acc + val ** 2, 0) / dataArray.length);

  // Map rms (0-255) to a sensitivity range, e.g., 11-15
  let sensitivity = map(rms, 0, 255, 11, 15);

  visualizerContext.globalCompositeOperation = 'screen'; // Set blend mode here

  // Draw first line (red)
  visualizerContext.beginPath();
  drawVisualizerLine(centerX, centerY, baseRadius, barWidth, newBufferLength, '#FF0000', sensitivity + 8.5, normalizedDataArray,maxBarLength);
  visualizerContext.stroke();

  // Draw second line (green)
  visualizerContext.beginPath();
  drawVisualizerLine(centerX, centerY, baseRadius, barWidth, newBufferLength, '#00FF00', sensitivity + 5.5, normalizedDataArray,maxBarLength);
  visualizerContext.stroke();

  // Draw third line (blue)
  visualizerContext.beginPath();
  drawVisualizerLine(centerX, centerY, baseRadius, barWidth, newBufferLength, '#0000FF', sensitivity - 2.3, normalizedDataArray,maxBarLength);
  visualizerContext.stroke();

  visualizerContext.globalCompositeOperation = 'source-over'; // Reset blend mode here
}

function map(value, start1, stop1, start2, stop2) {
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}


function drawVisualizerLine(centerX, centerY, baseRadius, barWidth, bufferLength, color, sensitivity, normalizedDataArray, maxBarLength) {
  let localDataArray = [...normalizedDataArray];  // Make a local copy of the data array
  for (let i = 0; i < bufferLength; i++) {
    let barLength = Math.min(localDataArray[i] * sensitivity, maxBarLength);
    barLength = barLength * (baseRadius / maxBarLength);
    let angle = i * barWidth * 2;
    let x = centerX + (baseRadius + barLength) * Math.cos(angle);
    let y = centerY + (baseRadius + barLength) * Math.sin(angle);
    if (i === 0) {
      visualizerContext.moveTo(x, y);
    } else {
      visualizerContext.lineTo(x, y);
    }
  }
  visualizerContext.closePath();
  visualizerContext.strokeStyle = color;
  visualizerContext.stroke();
}


function stopVisualizer() {
  source.disconnect();
  visualizerCanvas.style.display = 'none';
  cancelAnimationFrame(visualizerAnimationId);
}

// Web App Code
const startButton= document.getElementById('start');
const stopButton = document.getElementById('stop');

function getUserMedia(constraints) {
  console.log('getUserMedia called with constraints:', constraints);

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        console.log('getUserMedia success:', stream);
        return stream;
      })
      .catch(error => {
        console.log('getUserMedia error:', error);
        throw error;
      });
  }

  const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  
  return new Promise((resolve, reject) => {
    getUserMedia.call(navigator, constraints, stream => {
      console.log('getUserMedia success:', stream);
      resolve(stream);
    }, error => {
      console.log('getUserMedia error:', error);
      reject(error);
    });
  });
}


export { startVisualizer, stopVisualizer };