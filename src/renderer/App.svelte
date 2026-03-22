<script lang="ts">
  let streaming = $state(false);
  let videoEl: HTMLVideoElement;
  let canvasEl: HTMLCanvasElement;
  let mediaStream: MediaStream | null = null;
  let animationId: number | null = null;
  let fps = $state(0);
  let processedArray: Uint8ClampedArray;
  let outImageData: ImageData;

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

      processLoop();
    } catch (err) {
      console.error("Camera error:", err);
    }
  }

  function stopCamera() {
    streaming = false;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      mediaStream = null;
    }
    videoEl.srcObject = null;
  }

  async function processLoop() {
    if (!streaming) return;

    const ctx = canvasEl.getContext("2d")!;

    const w = canvasEl.width;
    const h = canvasEl.height;

    // Draw current video frame to canvas to extract pixels
    ctx.drawImage(videoEl, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);

    const start = performance.now();

    try {
      // Send RGBA buffer to Rust via IPC
      const result = await window.api.processFrame(imageData.data.buffer, w, h);

      processedArray.set(new Uint8ClampedArray(result));

      outImageData.data.set(processedArray);

      ctx.putImageData(outImageData, 0, 0);

      fps = Math.round(1000 / (performance.now() - start));
    } catch (err) {
      console.error("Frame processing error:", err);
    }

    animationId = requestAnimationFrame(processLoop);
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
