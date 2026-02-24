let currentFilter = "glasses";

const clownface = new Image();
clownface.src = "clownface.png";

const flatcap = new Image();
flatcap.src = "flatcap.png";


const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');

canvasElement.width = 640;
canvasElement.height = 480;

const glasses = new Image();
glasses.src = "glasses.png";

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    videoElement.srcObject = stream;
    videoElement.play();
  });

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

  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {

      const leftEye = landmarks[33];
      const rightEye = landmarks[263];

      const x1 = leftEye.x * canvasElement.width;
      const y1 = leftEye.y * canvasElement.height;
      const x2 = rightEye.x * canvasElement.width;
      const y2 = rightEye.y * canvasElement.height;

      const eyeDistance = Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);

      const glassesWidth = eyeDistance * 2;
      const glassesHeight = glassesWidth * 0.5;

      const centerX = (x1 + x2) / 2;
      const centerY = (y1 + y2) / 2;

     if (currentFilter === "glasses") {
  canvasCtx.drawImage(
    glasses,
    centerX - glassesWidth / 2,
    centerY - glassesHeight / 2,
    glassesWidth,
    glassesHeight
  );
}
       if (currentFilter === "clownface") {
  canvasCtx.drawImage(
    clownface,
    centerX - glassesWidth / 2,
    centerY - glassesHeight / 2,
    glassesWidth,
    glassesHeight
  );
}
/*
if (currentFilter === "clownface") {
  const nose = landmarks[1];
  const mouth = landmarks[13];

  const mx = nose.x * canvasElement.width;
  const my = nose.y * canvasElement.height;

  const mWidth = eyeDistance * 1.5;
  const mHeight = mWidth * 0.4;

  canvasCtx.drawImage(
    clownface,
    mx - mWidth / 2,
    my,
    mWidth,
    mHeight
  );
}
*/
      if (currentFilter === "flatcap") {

  const forehead = landmarks[10];

  const fx = forehead.x * canvasElement.width;
  const fy = forehead.y * canvasElement.height;

  const capWidth = eyeDistance * 2.5;
  const capHeight = capWidth * 0.8;

  canvasCtx.drawImage(
    flatcap,
    fx - capWidth / 2,
    fy - capHeight,
    capWidth,
    capHeight
  );
}

    }
  }
});

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
  link.download = 'snapshot.png';
  link.href = canvasElement.toDataURL();
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
