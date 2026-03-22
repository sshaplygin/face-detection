/// <reference types="svelte" />

interface Window {
  api: {
    processFrame(buffer: ArrayBuffer, width: number, height: number): Promise<Buffer>
  }
}
