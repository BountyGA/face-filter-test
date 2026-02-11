const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');

canvasElement.width = 640;
canvasElement.height = 480;

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    videoElement.srcObject = stream;
    videoElement.play();
  });

function draw() {
  canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
  requestAnimationFrame(draw);
}

videoElement.addEventListener('loadeddata', () => {
  draw();
});
