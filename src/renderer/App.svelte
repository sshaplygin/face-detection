<script lang="ts">
  let streaming = $state(false);
  let recording = $state(false);
  let videoEl: HTMLVideoElement;
  let canvasEl: HTMLCanvasElement;
  let mediaStream: MediaStream | null = null;
  let videoCallbackId: number | null = null;
  let fps = $state(0);
  let processedArray: Uint8ClampedArray;
  let outImageData: ImageData;
  let mediaRecorder: MediaRecorder | null = null;
  let recordedChunks: Blob[] = [];

  async function toggleCamera() {
    if (streaming) {
      stopCamera();
    } else {
      await startCamera();
    }
  }

  async function startCamera() {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      videoEl.srcObject = mediaStream;
      await videoEl.play();

      canvasEl.width = videoEl.videoWidth || 640;
      canvasEl.height = videoEl.videoHeight || 480;

      const w = canvasEl.width;
      const h = canvasEl.height;

      processedArray = new Uint8ClampedArray(w * h * 4);

      const ctx = canvasEl.getContext("2d");
      outImageData = ctx.createImageData(w, h);

      streaming = true;

      videoCallbackId = videoEl.requestVideoFrameCallback(processLoop);
    } catch (err) {
      console.error("Camera error:", err);
    }
  }

  async function stopCamera() {
    if (recording) {
      await stopRecording();
    }
    streaming = false;
    videoCallbackId = null;
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      mediaStream = null;
    }
    videoEl.srcObject = null;
  }

  function startRecording() {
    const stream = canvasEl.captureStream(0);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : "video/webm";

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `face-detection-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      recordedChunks = [];
    };

    mediaRecorder.start(1000);
    recording = true;
  }

  function stopRecording(): Promise<void> {
    return new Promise((resolve) => {
      if (!mediaRecorder || mediaRecorder.state !== "recording") {
        recording = false;
        resolve();
        return;
      }

      const originalOnStop = mediaRecorder.onstop;
      mediaRecorder.onstop = (e) => {
        if (originalOnStop) {
          (originalOnStop as (ev: Event) => void)(e);
        }
        mediaRecorder = null;
        recording = false;
        resolve();
      };

      mediaRecorder.stop();
    });
  }

  function toggleRecording() {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  async function processLoop() {
    if (!streaming) return;

    const ctx = canvasEl.getContext("2d")!;

    const w = canvasEl.width;
    const h = canvasEl.height;

    ctx.drawImage(videoEl, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);

    const start = performance.now();

    try {
      const result = await window.api.processFrame(imageData.data.buffer, w, h);

      processedArray.set(new Uint8ClampedArray(result));
      outImageData.data.set(processedArray);

      const bitmap = await createImageBitmap(outImageData);
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      fps = Math.round(1000 / (performance.now() - start));
    } catch (err) {
      console.error("Frame processing error:", err);
    }

    videoCallbackId = videoEl.requestVideoFrameCallback(processLoop);
  }
</script>

<div class="app">
  <header>
    <h1>Face Detection — OpenCV + Rust</h1>
  </header>

  <main>
    <div class="controls">
      <button class:active={streaming} onclick={toggleCamera}>
        {streaming ? "Stop" : "Start"} Camera
      </button>
      {#if streaming}
        <button class:recording={recording} onclick={toggleRecording}>
          {recording ? "Stop Recording" : "Record"}
        </button>
        <span class="fps">{fps} FPS</span>
      {/if}
    </div>

    <div class="video-container">
      <!-- Hidden video element used to capture camera stream -->
      <video bind:this={videoEl} style="display:none;"></video>
      <!-- Canvas shows the processed output -->
      <canvas bind:this={canvasEl}></canvas>
    </div>
  </main>

  <footer>
    <p>Sam Shaplygin &copy; 2025 — Electron + Svelte + Rust/OpenCV</p>
  </footer>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #1a1a2e;
    color: #eee;
  }

  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  header {
    background: #324162;
    padding: 16px 24px;
  }

  header h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px;
    gap: 16px;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  button {
    padding: 8px 24px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    background: #6fd170;
    color: #fff;
    transition: background 0.2s;
  }

  button.active {
    background: #b81f1f;
  }

  button.recording {
    background: #e63946;
    animation: pulse 1.2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .fps {
    font-size: 14px;
    color: #aaa;
  }

  .video-container {
    background: #000;
    border-radius: 8px;
    overflow: hidden;
  }

  canvas {
    display: block;
    width: 640px;
    height: 480px;
  }

  footer {
    background: #434e7b;
    padding: 12px 24px;
    text-align: center;
  }

  footer p {
    margin: 0;
    font-size: 13px;
  }
</style>
