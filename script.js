let currentFilter = "glasses";
// Add these three lines:
let filterOffsetX = 0;    // Manual left/right adjustment
let filterOffsetY = 0;    // Manual up/down adjustment
let filterScale = 1.0;    // Manual size adjustment
let currentFilter = "glasses";

function adjustFilter(direction) {
  const step = 5;        // Pixels to move
  const scaleStep = 0.1; // Size change amount (10%)
  
  switch(direction) {
    case 'up': filterOffsetY -= step; break;
    case 'down': filterOffsetY += step; break;
    case 'left': filterOffsetX -= step; break;
    case 'right': filterOffsetX += step; break;
    case 'bigger': filterScale += scaleStep; break;
    case 'smaller': filterScale = Math.max(0.5, filterScale - scaleStep); break;
  }
}

function resetFilterAdjustments() {
  filterOffsetX = 0;
  filterOffsetY = 0;
  filterScale = 1.0;
}

// Load images with error handling
const glasses = new Image();
glasses.src = "glasses.png";
glasses.onerror = () => console.error('Failed to load glasses.png');

const clownface = new Image();
clownface.src = "clownface.png";
clownface.onerror = () => console.error('Failed to load clownface.png');

const hardhat = new Image();
hardhat.src = "hardhat.png";
hardhat.onerror = () => console.error('Failed to load hardhat.png');

const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');

// Set canvas dimensions
canvasElement.width = 640;
canvasElement.height = 480;

// Make sure video element exists
if (!videoElement) console.error('Video element not found!');
if (!canvasElement) console.error('Canvas element not found!');

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
  // Clear canvas and draw video frame
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Draw video with mirror effect
  canvasCtx.translate(canvasElement.width, 0);
  canvasCtx.scale(-1, 1);
  canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.restore();

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    for (const landmarks of results.multiFaceLandmarks) {
      
      // Get eye landmarks for width reference
      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      
      // Adjust coordinates for mirror effect
      const x1 = (1 - leftEye.x) * canvasElement.width;
      const y1 = leftEye.y * canvasElement.height;
      const x2 = (1 - rightEye.x) * canvasElement.width;
      const y2 = rightEye.y * canvasElement.height;
      
      const eyeDistance = Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
      const centerX = (x1 + x2) / 2;
      const centerY = (y1 + y2) / 2;
      
      // Get face dimensions for better scaling
      const faceTop = landmarks[10]; // forehead
      const faceBottom = landmarks[152]; // chin
      const faceLeft = landmarks[234]; // left cheek
      const faceRight = landmarks[454]; // right cheek
      
      const faceWidth = Math.abs(
        ((1 - faceRight.x) * canvasElement.width) - 
        ((1 - faceLeft.x) * canvasElement.width)
      );
      const faceHeight = Math.abs(
        (faceBottom.y * canvasElement.height) - 
        (faceTop.y * canvasElement.height)
      );
      
      // Apply filter based on selection
     if (currentFilter === "glasses" && glasses.complete) {
          const glassesWidth = eyeDistance * 2.5 * filterScale;  // Added filterScale
          const glassesHeight = glassesWidth * 0.35;
          
          canvasCtx.drawImage(
            glasses,
            centerX - glassesWidth / 2 + filterOffsetX,  // Added manual X adjustment
            centerY - glassesHeight / 2 - (glassesHeight * 0.2) + filterOffsetY, // Added manual Y adjustment
            glassesWidth,
            glassesHeight
          );
        }
      
     else if (currentFilter === "clownface" && clownface.complete) {
        const nose = landmarks[1];
        const noseX = (1 - nose.x) * canvasElement.width;
        const noseY = nose.y * canvasElement.height;
        
        const faceWidth = Math.abs(
          ((1 - landmarks[454].x) * canvasElement.width) - 
          ((1 - landmarks[234].x) * canvasElement.width)
        );
        
        const clownWidth = faceWidth * 1.2 * filterScale;  // Added filterScale
        const clownHeight = clownWidth * 0.8;
        
        canvasCtx.drawImage(
          clownface,
          centerX - clownWidth / 2 + filterOffsetX,  // Added manual X adjustment
          centerY - clownHeight / 2 - (clownHeight * 0.1) + filterOffsetY, // Added manual Y adjustment
          clownWidth,
          clownHeight
        );
      }
      else if (currentFilter === "hardhat" && hardhat.complete) {
        const forehead = landmarks[10];
        const fx = (1 - forehead.x) * canvasElement.width;
        const fy = forehead.y * canvasElement.height;
        
        const leftBrow = landmarks[70];
        const rightBrow = landmarks[300];
        const leftBrowX = (1 - leftBrow.x) * canvasElement.width;
        const rightBrowX = (1 - rightBrow.x) * canvasElement.width;
        const browDistance = Math.abs(rightBrowX - leftBrowX);
        
        const capWidth = browDistance * 2.2 * filterScale;  // Added filterScale
        const capHeight = capWidth * 0.55;
        
        canvasCtx.drawImage(
          hardhat,
          fx - capWidth / 2 + filterOffsetX,  // Added manual X adjustment
          fy - capHeight * 0.7 + filterOffsetY, // Added manual Y adjustment
          capWidth,
          capHeight
        );
      }
          }
  }
});

// Initialize camera with proper configuration
const camera = new Camera(videoElement, {
  onFrame: async () => {
    if (videoElement.readyState >= 2) {
      await faceMesh.send({ image: videoElement });
    }
  },
  width: 640,
  height: 480
});

// Start camera with error handling
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
  
  // Remove active class from all filter buttons
  document.querySelectorAll('.btn-filter-custom').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add active to the clicked one
  const activeBtn = document.getElementById("filter" + filter);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
}

window.addEventListener('load', () => {
  console.log('Page loaded, initializing...');
});
