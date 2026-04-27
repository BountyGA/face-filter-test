// ─────────────────────────────────────────────
//  FILTER STATE
// ─────────────────────────────────────────────
let currentFilter = "glasses";

let filterOffsetX = 0;
let filterOffsetY = 0;
let filterScaleX  = 1.0;
let filterScaleY  = 1.0;

// ─────────────────────────────────────────────
//  ADJUSTMENT CONTROLS
// ─────────────────────────────────────────────
function adjustFilter(direction) {
  const step      = 5;
  const scaleStep = 0.1;

  switch (direction) {
    case 'up':       filterOffsetY -= step; break;
    case 'down':     filterOffsetY += step; break;
    case 'left':     filterOffsetX -= step; break;
    case 'right':    filterOffsetX += step; break;
    case 'bigger':
      filterScaleX += scaleStep;
      filterScaleY += scaleStep;
      break;
    case 'smaller':
      filterScaleX = Math.max(0.3, filterScaleX - scaleStep);
      filterScaleY = Math.max(0.3, filterScaleY - scaleStep);
      break;
    case 'wider':
      filterScaleX += scaleStep;
      break;
    case 'narrower':
      filterScaleX = Math.max(0.3, filterScaleX - scaleStep);
      break;
    case 'taller':
      filterScaleY += scaleStep;
      break;
    case 'shorter':
      filterScaleY = Math.max(0.3, filterScaleY - scaleStep);
      break;
  }

  updateAdjustmentDisplay();
}

function resetFilterAdjustments() {
  filterOffsetX = 0;
  filterOffsetY = 0;
  filterScaleX  = 1.0;
  filterScaleY  = 1.0;
  updateAdjustmentDisplay();
}

function updateAdjustmentDisplay() {
  const display = document.getElementById('adjustmentDisplay');
  if (display) {
    display.innerHTML =
      `X:${filterOffsetX}, Y:${filterOffsetY} | W:${filterScaleX.toFixed(1)}x, H:${filterScaleY.toFixed(1)}x`;
  }
}

// ─────────────────────────────────────────────
//  HELPER – safe image-ready check
// ─────────────────────────────────────────────
function isImageReady(img) {
  return img.complete && img.naturalWidth > 0;
}

// ─────────────────────────────────────────────
//  LOAD FILTER IMAGES
// ─────────────────────────────────────────────
function loadImage(src) {
  const img = new Image();
  img.src = src;
  img.onerror = () => console.warn(`Failed to load image: ${src}`);
  img.onload  = () => console.log(`Loaded: ${src}`);
  return img;
}

const filterImages = {
  glasses:   loadImage("glasses.png"),
  headphones:loadImage("headphones.png"),
  hardhat:   loadImage("hardhat.png"),
  tradicap:  loadImage("tradicap.png"),
  clownface: loadImage("clownface.png"),
  gasmask:   loadImage("gasmask.png"),
  pirate:    loadImage("pirate.png"),
};

// ─────────────────────────────────────────────
//  CANVAS & VIDEO SETUP
// ─────────────────────────────────────────────
const videoElement  = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx     = canvasElement.getContext('2d');

canvasElement.width  = 640;
canvasElement.height = 480;

// CSS mirror so the user sees a selfie-style view.
// All landmark X coords are flipped with (1 - x) so filters
// align correctly with the mirrored visual.
canvasElement.style.transform = 'scaleX(-1)';

// ─────────────────────────────────────────────
//  MIRROR HELPER  –  flips an X landmark coord
// ─────────────────────────────────────────────
function mx(landmarkX) {
  // Mirrors the normalised x so it matches the CSS scaleX(-1) view
  return (1 - landmarkX) * canvasElement.width;
}
function my(landmarkY) {
  return landmarkY * canvasElement.height;
}

// ─────────────────────────────────────────────
//  DRAW FILTER HELPER
// ─────────────────────────────────────────────
function drawFilter(img, centerX, centerY, width, height) {
  canvasCtx.drawImage(
    img,
    centerX - width  / 2 + filterOffsetX,
    centerY - height / 2 + filterOffsetY,
    width,
    height
  );
}

// ─────────────────────────────────────────────
//  FACE MESH RESULTS HANDLER
// ─────────────────────────────────────────────
function onResults(results) {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

  if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;

  for (const landmarks of results.multiFaceLandmarks) {

    // ── Key landmarks (X is mirrored via mx()) ──────────────────
    const leftEye  = landmarks[33];   // MediaPipe left  → appears on right in mirror
    const rightEye = landmarks[263];  // MediaPipe right → appears on left  in mirror

    // Eye centres (mirrored X)
    const eyeLX = mx(leftEye.x),  eyeLY = my(leftEye.y);
    const eyeRX = mx(rightEye.x), eyeRY = my(rightEye.y);

    const eyeDistance = Math.sqrt((eyeRX - eyeLX) ** 2 + (eyeRY - eyeLY) ** 2);
    const eyeCenterX  = (eyeLX + eyeRX) / 2;
    const eyeCenterY  = (eyeLY + eyeRY) / 2;

    // Face bounding landmarks
    const faceLeft   = landmarks[234];
    const faceRight  = landmarks[454];
    const faceTop    = landmarks[10];
    const faceBottom = landmarks[152];

    // After mirror flip, faceLeft/faceRight X positions are swapped visually
    // but we just want centre & width so the math stays the same.
    const faceLeftX  = mx(faceLeft.x);
    const faceRightX = mx(faceRight.x);
    const faceTopY   = my(faceTop.y);
    const faceBottomY= my(faceBottom.y);

    const faceWidth   = Math.abs(faceRightX - faceLeftX);
    const faceHeight  = Math.abs(faceBottomY - faceTopY);
    const faceCenterX = (faceLeftX + faceRightX) / 2;
    const faceCenterY = (faceTopY  + faceBottomY) / 2;

    // Brow landmarks
    const leftBrow  = landmarks[70];
    const rightBrow = landmarks[300];
    const browY     = (my(leftBrow.y) + my(rightBrow.y)) / 2;

    // ── Draw the active filter ───────────────────────────────────

    // GLASSES
    if (currentFilter === "glasses" && isImageReady(filterImages.glasses)) {
      const w = eyeDistance * 2.5 * filterScaleX;
      const h = w * 0.4 * filterScaleY;
      drawFilter(filterImages.glasses, eyeCenterX, eyeCenterY - h * 0.1, w, h);
    }

    // HEADPHONES
    else if (currentFilter === "headphones" && isImageReady(filterImages.headphones)) {
      const w = faceWidth * 1.2 * filterScaleX;
      const h = w * 0.55 * filterScaleY;
      // Anchor: top of head area
      const cx = faceCenterX;
      const cy = browY - h * 0.3;
      drawFilter(filterImages.headphones, cx, cy, w, h);
    }

    // HARD HAT
    else if (currentFilter === "hardhat" && isImageReady(filterImages.hardhat)) {
      const w = faceWidth * 1.15 * filterScaleX;
      const h = w * 0.55 * filterScaleY;
      const cx = faceCenterX;
      const cy = browY - h * 0.2;
      drawFilter(filterImages.hardhat, cx, cy, w, h);
    }

    // TRADI CAP
    else if (currentFilter === "tradicap" && isImageReady(filterImages.tradicap)) {
      const w = faceWidth * 1.2 * filterScaleX;
      const h = w * 0.55 * filterScaleY;
      const cx = faceCenterX;
      const cy = browY - h * 0.2;
      drawFilter(filterImages.tradicap, cx, cy, w, h);
    }

    // CLOWN FACE
    else if (currentFilter === "clownface" && isImageReady(filterImages.clownface)) {
      const w = faceWidth * 1.2 * filterScaleX;
      const h = faceHeight * 0.9 * filterScaleY;
      const cx = faceCenterX;
      const cy = faceTopY + h * 0.4;   // centre on the face vertically
      drawFilter(filterImages.clownface, cx, cy, w, h);
    }

    // GAS MASK
    else if (currentFilter === "gasmask" && isImageReady(filterImages.gasmask)) {
      const w = faceWidth * 1.15 * filterScaleX;
      const h = w * 0.9 * filterScaleY;
      drawFilter(filterImages.gasmask, faceCenterX, faceCenterY, w, h);
    }

    // PIRATE HAT  –  anchored above the brow like other hat filters
    else if (currentFilter === "pirate" && isImageReady(filterImages.pirate)) {
      const w = faceWidth * 1.3 * filterScaleX;
      const h = w * 0.75 * filterScaleY;
      const cx = faceCenterX;
      const cy = browY - h * 0.3;
      drawFilter(filterImages.pirate, cx, cy, w, h);
    }
  }
}

// ─────────────────────────────────────────────
//  STATUS DISPLAY HELPER
// ─────────────────────────────────────────────
function setStatus(msg, isError = false) {
  console[isError ? 'error' : 'log']('[Camera]', msg);
  const el = document.getElementById('cameraStatus');
  if (el) {
    el.textContent = msg;
    el.style.color = isError ? '#ff4444' : '#44ff44';
  }
}

// ─────────────────────────────────────────────
//  INITIALISE FACE MESH
// ─────────────────────────────────────────────
const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
  maxNumFaces:            1,
  refineLandmarks:        true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence:  0.5
});

faceMesh.onResults(onResults);

// ─────────────────────────────────────────────
//  CAMERA  –  direct getUserMedia (more reliable
//  than MediaPipe's Camera helper class)
// ─────────────────────────────────────────────
let animFrameId = null;

async function startCamera() {
  // 1. Check browser support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus('Camera API not supported in this browser.', true);
    return;
  }

  // 2. Must be HTTPS or localhost
  if (location.protocol !== 'https:' &&
      location.hostname !== 'localhost' &&
      location.hostname !== '127.0.0.1') {
    setStatus('Camera requires HTTPS or localhost. Current origin: ' + location.origin, true);
    return;
  }

  setStatus('Requesting camera permission…');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false
    });

    videoElement.srcObject = stream;
    videoElement.playsInline = true;

    await new Promise((resolve, reject) => {
      videoElement.onloadedmetadata = resolve;
      videoElement.onerror = reject;
    });

    await videoElement.play();
    setStatus('Camera active ✓');
    console.log('Stream resolution:', videoElement.videoWidth, 'x', videoElement.videoHeight);

    // 3. Kick off the render loop
    processFrame();

  } catch (err) {
    // Specific guidance per error type
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      setStatus('Camera permission denied. Allow access in browser settings and reload.', true);
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      setStatus('No camera found. Please connect a camera and reload.', true);
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      setStatus('Camera is in use by another app. Close it and reload.', true);
    } else if (err.name === 'OverconstrainedError') {
      setStatus('Camera does not support 640×480. Retrying with default resolution…');
      retryWithDefaultResolution();
    } else {
      setStatus('Camera error: ' + err.name + ' – ' + err.message, true);
    }
    console.error('getUserMedia error:', err);
  }
}

// Fallback: retry without resolution constraints
async function retryWithDefaultResolution() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    videoElement.srcObject = stream;
    videoElement.playsInline = true;
    await new Promise(resolve => { videoElement.onloadedmetadata = resolve; });
    await videoElement.play();
    setStatus('Camera active ✓ (default resolution)');
    processFrame();
  } catch (err) {
    setStatus('Camera retry failed: ' + err.message, true);
  }
}

// ─────────────────────────────────────────────
//  RENDER LOOP  –  feeds frames into FaceMesh
// ─────────────────────────────────────────────
async function processFrame() {
  if (videoElement.readyState >= 2 && !videoElement.paused && !videoElement.ended) {
    try {
      await faceMesh.send({ image: videoElement });
    } catch (err) {
      console.warn('FaceMesh send error:', err);
    }
  }
  animFrameId = requestAnimationFrame(processFrame);
}

// ─────────────────────────────────────────────
//  STOP CAMERA  (utility – call if needed)
// ─────────────────────────────────────────────
function stopCamera() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (videoElement.srcObject) {
    videoElement.srcObject.getTracks().forEach(t => t.stop());
    videoElement.srcObject = null;
  }
  setStatus('Camera stopped.');
}

startCamera();

// ─────────────────────────────────────────────
//  TAKE PHOTO  –  mirrored (selfie-style)
//  We draw onto a temporary canvas with scaleX(-1)
//  so the downloaded image matches what the user sees.
// ─────────────────────────────────────────────
function takePhoto() {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width  = canvasElement.width;
  tempCanvas.height = canvasElement.height;
  const tempCtx = tempCanvas.getContext('2d');

  // Flip horizontally to produce a mirrored image
  tempCtx.translate(tempCanvas.width, 0);
  tempCtx.scale(-1, 1);
  tempCtx.drawImage(canvasElement, 0, 0);

  const link = document.createElement('a');
  link.download = 'snapshot-' + Date.now() + '.png';
  link.href = tempCanvas.toDataURL('image/png');
  link.click();
}

// ─────────────────────────────────────────────
//  SET FILTER  –  updates active button state
// ─────────────────────────────────────────────
function setFilter(filter) {
  currentFilter = filter;
  resetFilterAdjustments();

  document.querySelectorAll('.filter-chip, .btn-filter-custom').forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtn = document.getElementById('filter-' + filter);
  if (activeBtn) activeBtn.classList.add('active');

  console.log('Filter changed to:', filter);
}

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
window.addEventListener('load', () => {
  console.log('Page loaded – face filter app ready.');
  updateAdjustmentDisplay();
});
