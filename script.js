let currentFilter = "glasses";

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
      
      // Apply filter based on selection
      if (currentFilter === "glasses" && glasses.complete) {
        const glassesWidth = eyeDistance * 2.2;
        const glassesHeight = glassesWidth * 0.4;
        
        canvasCtx.drawImage(
          glasses,
          centerX - glassesWidth / 2,
          centerY - glassesHeight / 2,
          glassesWidth,
          glassesHeight
        );
      }
      
      else if (currentFilter === "clownface" && clownface.complete) {
        // Use nose for clown face
        const nose = landmarks[1];
        const noseX = (1 - nose.x) * canvasElement.width;
        const noseY = nose.y * canvasElement.height;
        
        const clownWidth = eyeDistance * 2.5;
        const clownHeight = clownWidth * 0.6;
        
        canvasCtx.drawImage(
          clownface,
          noseX - clownWidth / 2,
          noseY - clownHeight / 2,
          clownWidth,
          clownHeight
        );
      }
      
      else if (currentFilter === "hardhat" && hardhat.complete) {
        // Use forehead for hard hat
        const forehead = landmarks[10];
        const fx = (1 - forehead.x) * canvasElement.width;
        const fy = forehead.y * canvasElement.height;
        
        const capWidth = eyeDistance * 3.0;
        const capHeight = capWidth * 0.6;
        
        canvasCtx.drawImage(
          hardhat,
          fx - capWidth / 2,
          fy - capHeight * 0.8,
          capWidth,
          capHeight
        );
      }
    }
  }
});

// Initialize camera with proper configuration - THIS IS THE ONLY CAMERA ACCESS
const camera = new Camera(videoElement, {
  onFrame: async () => {
    if (videoElement.readyState >= 2) { // Check if video is playing
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

// Add a small delay to ensure everything is loaded
window.addEventListener('load', () => {
  console.log('Page loaded, initializing...');
});
