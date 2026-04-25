let currentFilter = "glasses";
// Adjustment variables
let filterOffsetX = 0;
let filterOffsetY = 0;
let filterScaleX = 1.0;
let filterScaleY = 1.0;
let filterScale = 1.0;

function adjustFilter(direction) {
  const step = 5;
  const scaleStep = 0.1;
  
  switch(direction) {
    case 'up': filterOffsetY -= step; break;
    case 'down': filterOffsetY += step; break;
    case 'left': filterOffsetX -= step; break;
    case 'right': filterOffsetX += step; break;
    case 'bigger': 
      filterScaleX += scaleStep; 
      filterScaleY += scaleStep; 
      break;
    case 'smaller': 
      filterScaleX = Math.max(0.5, filterScaleX - scaleStep);
      filterScaleY = Math.max(0.5, filterScaleY - scaleStep);
      break;
    case 'wider': filterScaleX += scaleStep; break;
    case 'narrower': filterScaleX = Math.max(0.5, filterScaleX - scaleStep); break;
    case 'taller': filterScaleY += scaleStep; break;
    case 'shorter': filterScaleY = Math.max(0.5, filterScaleY - scaleStep); break;
  }
  
  updateAdjustmentDisplay();
}

function resetFilterAdjustments() {
  filterOffsetX = 0;
  filterOffsetY = 0;
  filterScaleX = 1.0;
  filterScaleY = 1.0;
  filterScale = 1.0;
  updateAdjustmentDisplay();
}

function updateAdjustmentDisplay() {
  const display = document.getElementById('adjustmentDisplay');
  if (display) {
    display.innerHTML = `X:${filterOffsetX}, Y:${filterOffsetY} | W:${filterScaleX.toFixed(1)}x, H:${filterScaleY.toFixed(1)}x`;
  }
}

// Load images with error handling
const glasses = new Image();
glasses.src = "glasses.png";
glasses.onerror = () => console.error('Failed to load glasses.png');
glasses.onload = () => console.log('Glasses loaded');

const tradicap = new Image();
tradicap.src = "tradicap.png";
tradicap.onerror = () => console.error('Failed to load tradicap.png');
tradicap.onload = () => console.log('Tradicap loaded');

const headphones = new Image();
headphones.src = "headphones.png";
headphones.onerror = () => console.error('Failed to load headphones.png');
headphones.onload = () => console.log('Headphones loaded');

const clownface = new Image();
clownface.src = "clownface.png";
clownface.onerror = () => console.error('Failed to load clownface.png');
clownface.onload = () => console.log('Clownface loaded');

const gasmask = new Image();
gasmask.src = "gasmask.png";
gasmask.onerror = () => console.error('Failed to load gasmask.png');
gasmask.onload = () => console.log('Gasmask loaded');

const hardhat = new Image();
hardhat.src = "hardhat.png";
hardhat.onerror = () => console.error('Failed to load hardhat.png');
hardhat.onload = () => console.log('Hardhat loaded');

const pirate = new Image();
pirate.src = "pirate.png";
pirate.onerror = () => console.error('Failed to load pirate.png');
pirate.onload = () => console.log('Pirate loaded');

const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');

// Set canvas dimensions
canvasElement.width = 640;
canvasElement.height = 480;

if (!videoElement) console.error('Video element not found!');
if (!canvasElement) console.error('Canvas element not found!');

// Helper function to get face measurements
function getFaceMeasurements(landmarks, canvasWidth, canvasHeight) {
  // Helper to convert normalized coordinates to pixels
  const toPixels = (point) => {
    if (!point) return { x: 0, y: 0 };
    return {
      x: (1 - point.x) * canvasWidth,
      y: point.y * canvasHeight
    };
  };
  
  // Extract key landmarks
  const leftEyeOuter = landmarks[33];
  const leftEyeInner = landmarks[133];
  const leftEyeCenter = landmarks[468];
  
  const rightEyeOuter = landmarks[263];
  const rightEyeInner = landmarks[362];
  const rightEyeCenter = landmarks[473];
  
  const noseTip = landmarks[1];
  const noseBridge = landmarks[168];
  const noseBottom = landmarks[2];
  
  const mouthLeft = landmarks[61];
  const mouthRight = landmarks[291];
  const mouthTop = landmarks[13];
  const mouthBottom = landmarks[14];
  
  const foreheadTop = landmarks[10];
  const foreheadLeft = landmarks[54];
  const foreheadRight = landmarks[284];
  
  const faceTop = landmarks[10];
  const faceBottom = landmarks[152];
  const faceLeft = landmarks[234];
  const faceRight = landmarks[454];
  
  const leftEyebrow = landmarks[70];
  const rightEyebrow = landmarks[300];
  
  // Convert to pixels
  const leftEyePx = toPixels(leftEyeCenter || leftEyeOuter);
  const rightEyePx = toPixels(rightEyeCenter || rightEyeOuter);
  const leftEyeOuterPx = toPixels(leftEyeOuter);
  const rightEyeOuterPx = toPixels(rightEyeOuter);
  
  // Calculate distances
  const eyeDistance = Math.sqrt(
    Math.pow(rightEyePx.x - leftEyePx.x, 2) + 
    Math.pow(rightEyePx.y - leftEyePx.y, 2)
  );
  
  // Face dimensions
  const faceLeftPx = toPixels(faceLeft);
  const faceRightPx = toPixels(faceRight);
  const faceTopPx = toPixels(faceTop);
  const faceBottomPx = toPixels(faceBottom);
  
  const faceWidth = Math.abs(faceRightPx.x - faceLeftPx.x);
  const faceHeight = Math.abs(faceBottomPx.y - faceTopPx.y);
  
  // Eye center (midpoint between eyes)
  const eyeCenterX = (leftEyePx.x + rightEyePx.x) / 2;
  const eyeCenterY = (leftEyePx.y + rightEyePx.y) / 2;
  
  // Forehead position
  const foreheadPx = toPixels(foreheadTop);
  
  return {
    eyes: {
      left: leftEyePx,
      right: rightEyePx,
      leftOuter: leftEyeOuterPx,
      rightOuter: rightEyeOuterPx,
      center: { x: eyeCenterX, y: eyeCenterY },
      distance: eyeDistance
    },
    nose: {
      tip: toPixels(noseTip),
      bridge: toPixels(noseBridge),
      bottom: toPixels(noseBottom)
    },
    mouth: {
      left: toPixels(mouthLeft),
      right: toPixels(mouthRight),
      top: toPixels(mouthTop),
      bottom: toPixels(mouthBottom),
      center: toPixels(mouthTop)
    },
    forehead: {
      top: foreheadPx,
      left: toPixels(foreheadLeft),
      right: toPixels(foreheadRight)
    },
    eyebrows: {
      left: toPixels(leftEyebrow),
      right: toPixels(rightEyebrow)
    },
    face: {
      top: faceTopPx,
      bottom: faceBottomPx,
      left: faceLeftPx,
      right: faceRightPx,
      width: faceWidth,
      height: faceHeight,
      center: { 
        x: faceLeftPx.x + faceWidth / 2, 
        y: faceTopPx.y + faceHeight / 2 
      }
    }
  };
}

// Function to draw rotated image
function drawRotatedImage(ctx, image, x, y, width, height, rotationDegrees) {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(rotationDegrees * Math.PI / 180);
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  ctx.restore();
}

// Calculate face rotation
function calculateFaceAngle(measurements) {
  const leftEye = measurements.eyes.left;
  const rightEye = measurements.eyes.right;
  const deltaY = rightEye.y - leftEye.y;
  const deltaX = rightEye.x - leftEye.x;
  return Math.atan2(deltaY, deltaX) * 180 / Math.PI;
}

// Draw filter based on type
function drawFilter(ctx, filterImg, measurements, filterType, offsets) {
  if (!filterImg.complete) return;
  
  const { offsetX = 0, offsetY = 0, scaleX = 1, scaleY = 1 } = offsets;
  const faceAngle = -calculateFaceAngle(measurements);
  
  let x, y, width, height;
  
  switch(filterType) {
    case 'glasses':
      width = measurements.eyes.distance * 2.5 * scaleX;
      height = width * 0.4 * scaleY;
      x = measurements.eyes.center.x - width / 2 + offsetX;
      y = measurements.eyes.center.y - height / 2 - (height * 0.15) + offsetY;
      drawRotatedImage(ctx, filterImg, x, y, width, height, faceAngle);
      break;
      
    case 'headphones':
      width = measurements.face.width * 1.2 * scaleX;
      height = width * 0.55 * scaleY;
      x = measurements.face.center.x - width / 2 + offsetX;
      y = measurements.forehead.top.y - height * 0.6 + offsetY;
      ctx.drawImage(filterImg, x, y, width, height);
      break;
      
    case 'hardhat':
      width = measurements.face.width * 1.1 * scaleX;
      height = width * 0.55 * scaleY;
      x = measurements.face.center.x - width / 2 + offsetX;
      y = measurements.forehead.top.y - height * 0.5 + offsetY;
      ctx.drawImage(filterImg, x, y, width, height);
      break;
      
    case 'tradicap':
      width = measurements.face.width * 1.15 * scaleX;
      height = width * 0.55 * scaleY;
      x = measurements.face.center.x - width / 2 + offsetX;
      y = measurements.forehead.top.y - height * 0.45 + offsetY;
      ctx.drawImage(filterImg, x, y, width, height);
      break;
      
    case 'clownface':
      width = measurements.face.width * 1.2 * scaleX;
      height = measurements.face.height * 0.85 * scaleY;
      x = measurements.face.center.x - width / 2 + offsetX;
      y = measurements.face.top.y - height * 0.1 + offsetY;
      ctx.drawImage(filterImg, x, y, width, height);
      break;
      
    case 'gasmask':
      width = measurements.face.width * 1.1 * scaleX;
      height = width * 0.9 * scaleY;
      x = measurements.face.center.x - width / 2 + offsetX;
      y = measurements.nose.tip.y - height * 0.4 + offsetY;
      ctx.drawImage(filterImg, x, y, width, height);
      break;
      
    case 'pirate':
      width = measurements.eyes.distance * 1.8 * scaleX;
      height = width * 0.9 * scaleY;
      x = measurements.eyes.left.x - width / 2 + offsetX;
      y = measurements.eyes.left.y - height / 2 + offsetY;
      drawRotatedImage(ctx, filterImg, x, y, width, height, faceAngle * 0.5);
      break;
      
    default:
      console.warn('Unknown filter type:', filterType);
  }
}

// Initialize FaceMesh
const faceMesh = new FaceMesh({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
  }
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

faceMesh.onResults(results => {
  // Clear canvas
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Draw video with mirror effect
  canvasCtx.translate(canvasElement.width, 0);
  canvasCtx.scale(-1, 1);
  canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.restore();

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    for (const landmarks of results.multiFaceLandmarks) {
      // Get face measurements once
      const measurements = getFaceMeasurements(landmarks, canvasElement.width, canvasElement.height);
      
      // Map filter names to types
      const filterMap = {
        glasses: { img: glasses, type: 'glasses' },
        headphones: { img: headphones, type: 'headphones' },
        tradicap: { img: tradicap, type: 'tradicap' },
        clownface: { img: clownface, type: 'clownface' },
        gasmask: { img: gasmask, type: 'gasmask' },
        hardhat: { img: hardhat, type: 'hardhat' },
        pirate: { img: pirate, type: 'pirate' }
      };
      
      const filter = filterMap[currentFilter];
      if (filter && filter.img.complete) {
        drawFilter(canvasCtx, filter.img, measurements, filter.type, {
          offsetX: filterOffsetX,
          offsetY: filterOffsetY,
          scaleX: filterScaleX,
          scaleY: filterScaleY
        });
      }
    }
  }
});

// Initialize camera
const camera = new Camera(videoElement, {
  onFrame: async () => {
    if (videoElement.readyState >= 2) {
      await faceMesh.send({ image: videoElement });
    }
  },
  width: 640,
  height: 480
});

camera.start().then(() => {
  console.log('Camera started successfully');
}).catch(err => {
  console.error('Error starting camera:', err);
  alert('Cannot access camera. Please make sure you have granted permission and are using HTTPS or localhost.');
});

function takePhoto() {
  const link = document.createElement('a');
  link.download = 'snapshot-' + new Date().getTime() + '.png';
  link.href = canvasElement.toDataURL('image/png');
  link.click();
}

function setFilter(filter) {
  currentFilter = filter;
  
  // Reset adjustments when changing filters
  filterOffsetX = 0;
  filterOffsetY = 0;
  filterScaleX = 1.0;
  filterScaleY = 1.0;
  updateAdjustmentDisplay();
  
  // Update active button styling
  document.querySelectorAll('.filter-chip, .btn-filter-custom').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtn = document.getElementById("filter" + filter);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
  
  console.log('Filter changed to:', filter);
}

window.addEventListener('load', () => {
  console.log('Page loaded, initializing...');
});
