import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  processFrame: (buffer: ArrayBuffer, width: number, height: number): Promise<Buffer> => {
    return ipcRenderer.invoke('process-frame', buffer, width, height)
  }
})
