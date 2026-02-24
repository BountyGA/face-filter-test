let currentFilter = "glasses";

// Load images
const clownface = new Image();
clownface.src = "clownface.png";

const hardhat = new Image();
hardhat.src = "hardhat.png";  // Fixed: was flatcap.src

const glasses = new Image();
glasses.src = "glasses.png";

const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');

canvasElement.width = 640;
canvasElement.height = 480;

// Ensure images are loaded before use
Promise.all([
  new Promise(resolve => glasses.onload = resolve),
  new Promise(resolve => clownface.onload = resolve),
  new Promise(resolve => hardhat.onload = resolve)
]).then(() => {
  console.log('All images loaded successfully');
});

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    videoElement.srcObject = stream;
    videoElement.play();
  })
  .catch(err => console.error('Camera error:', err));

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
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    for (const landmarks of results.multiFaceLandmarks) {
      
      // Get eye landmarks for width reference
      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      
      const x1 = leftEye.x * canvasElement.width;
      const y1 = leftEye.y * canvasElement.height;
      const x2 = rightEye.x * canvasElement.width;
      const y2 = rightEye.y * canvasElement.height;
      
      const eyeDistance = Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
      const centerX = (x1 + x2) / 2;
      const centerY = (y1 + y2) / 2;
      
      // Apply filter based on selection
      if (currentFilter === "glasses") {
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
      
      else if (currentFilter === "clownface") {
        // Use nose for clown face
        const nose = landmarks[1];
        const noseX = nose.x * canvasElement.width;
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
      
      else if (currentFilter === "hardhat") {
        // Use forehead for hard hat
        const forehead = landmarks[10];
        const fx = forehead.x * canvasElement.width;
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

    else if (currentFilter === "clownmouth") {
  // Draw on mouth
  const mouthLeft = landmarks[61];
  const mouthRight = landmarks[291];
  
  const mx1 = mouthLeft.x * canvasElement.width;
  const my1 = mouthLeft.y * canvasElement.height;
  const mx2 = mouthRight.x * canvasElement.width;
  const my2 = mouthRight.y * canvasElement.height;
  
  const mouthWidth = Math.sqrt((mx2 - mx1)**2 + (my2 - my1)**2) * 2;
  const mouthX = (mx1 + mx2) / 2;
  const mouthY = (my1 + my2) / 2;
  
  canvasCtx.drawImage(
    clownface,
    mouthX - mouthWidth / 2,
    mouthY - mouthWidth * 0.3,
    mouthWidth,
    mouthWidth * 0.5
  );
}
/*
else if (currentFilter === "clowneyes") {
  // Draw on both eyes
  const eyePositions = [33, 263]; // Left and right eye
  const eyeSize = eyeDistance * 1.2;
  
  eyePositions.forEach(index => {
    const eye = landmarks[index];
    const ex = eye.x * canvasElement.width;
    const ey = eye.y * canvasElement.height;
    
    canvasCtx.drawImage(
      clownface,
      ex - eyeSize / 2,
      ey - eyeSize / 2,
      eyeSize,
      eyeSize
    );
  });
}
*/

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
camera.start();

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
