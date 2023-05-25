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

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

visualizerCanvas = document.createElement('canvas');
visualizerCanvas.width = 580;
visualizerCanvas.height = 200;

document.getElementById('control-bar').appendChild(visualizerCanvas);
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

  visualizerContext.fillStyle = '#0D0C0B';
  visualizerContext.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

  let centerX = visualizerCanvas.width / 2;
  let centerY = visualizerCanvas.height / 2;
  let baseRadius = (120/ 2); // Set the minimum diameter to 96px
  let barWidth = (2 * Math.PI) / bufferLength;

  let maxBarLength = (1280 / 2) - baseRadius; // Set the maximum diameter to 140px
  

  let normalizedDataArray = dataArray.map(value => (value / 255) * 20);
  let newBufferLength = bufferLength / 2;

  let rms = Math.sqrt(dataArray.reduce((acc, val) => acc + val ** 2, 0) / dataArray.length);

  //console.log("RMS Value: " + rms);

  // Map rms (0-255) to a sensitivity range, e.g., 11-15
  let sensitivity = map(rms, 0, 255, 2, 35);

  visualizerContext.globalCompositeOperation = 'screen';

  let displacementScale = 0.012; // Change this value to your desired scaling factor
  let displacement = rms > 96 ? displacementScale * (rms - 10) : 0;

  let centerXRed = centerX + displacement;
  let centerYRed = centerY + displacement;
  let centerXBlue = centerX - displacement;
  let centerYBlue = centerY - displacement;


  visualizerContext.beginPath();
  drawVisualizerLine(centerXRed, centerYRed, baseRadius, barWidth, newBufferLength, '#EC5545', sensitivity + 13, normalizedDataArray, maxBarLength, rms, 2.8, -displacement, true);
  visualizerContext.stroke();

  visualizerContext.beginPath();
  drawVisualizerLine(centerX, centerY, baseRadius, barWidth, newBufferLength, '#00FF00', sensitivity + 10, normalizedDataArray,maxBarLength, rms, 2.8);
  visualizerContext.stroke();

  visualizerContext.beginPath();
  drawVisualizerLine(centerXBlue, centerYBlue, baseRadius, barWidth, newBufferLength, '#0000FF', sensitivity +11.5, normalizedDataArray, maxBarLength, rms, 4.1, +displacement);
  visualizerContext.stroke();

  visualizerContext.globalCompositeOperation = 'source-over';
}

function map(value, start1, stop1, start2, stop2) {
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

  function drawVisualizerLine(centerX, centerY, baseRadius, barWidth, bufferLength, color, sensitivity, normalizedDataArray, maxBarLength, rms, maxLineWidth, displacement = 0, staticOpacity = false) {

  let localDataArray = [...normalizedDataArray];
  
  for (let i = 0; i < bufferLength / 4; i++) {
    let intensity = (1 - i / (bufferLength / 4)); 
    localDataArray[i] = (localDataArray[i] * (1 - intensity) + localDataArray[bufferLength - i - 1] * intensity);
  }
  
  for (let i = 0; i < bufferLength; i++) {
    let barLength = Math.min(localDataArray[i] * sensitivity, maxBarLength);
    barLength = barLength * (baseRadius / maxBarLength);
    let angle = i * barWidth * 2;
    let x = centerX + (baseRadius + barLength) * Math.cos(angle) - displacement;
    let y = centerY + (baseRadius + barLength) * Math.sin(angle) - displacement;

    if (i === 0) {
      visualizerContext.moveTo(x, y);
    } else {
      visualizerContext.lineTo(x, y);
    }
  }
  visualizerContext.closePath();
  
  // Dynamically adjust lineWidth based on sound volume and set a maximum value
  visualizerContext.lineWidth = Math.min(map(rms, 0, 255, 1, sensitivity), maxLineWidth);

  let opacity;
  if (staticOpacity) {
    opacity = 1; // static opacity for the red line
    color = rms < 5 ? '#230E0B' : '#FF0000'; // Change color based on rms value
  } else {
    if (rms < 5) {
      opacity = 0; // If rms is near zero, make line fully transparent
    } else {
      opacity = map(rms, 0, 255, 0.8, 1); // Map rms to a opacity range of 0.2 - 1
    }
  }
  
let rgbColor = hexToRgb(color);
visualizerContext.strokeStyle = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${opacity})`;

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