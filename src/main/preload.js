const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Compute Monaco path that works in both dev and packaged mode
// In packaged builds, asarUnpack puts Monaco at app.asar.unpacked/ instead of app.asar/
let monacoBase = path.join(__dirname, '..', '..', 'node_modules', 'monaco-editor', 'min', 'vs');
if (monacoBase.includes('app.asar')) {
  monacoBase = monacoBase.replace('app.asar', 'app.asar.unpacked');
}
// Convert backslashes to forward slashes for file:// URLs on Windows
const monacoPathUrl = monacoBase.replace(/\\/g, '/');

contextBridge.exposeInMainWorld('api', {
  // Monaco editor path (works in dev and packaged builds)
  monacoPath: monacoPathUrl,

  // VexCom / Upload
  scanPorts: () => ipcRenderer.invoke('scan-ports'),
  uploadCode: (code, slot) => ipcRenderer.invoke('upload-code', code, slot),

  // OpenAI Chat
  sendChatMessage: (messages) => ipcRenderer.invoke('send-chat-message', messages),

  // Streaming chat - returns chunks via callback
  streamChatMessage: (messages, callback) => {
    const channel = `chat-stream-${Date.now()}`;
    ipcRenderer.on(channel, (_event, chunk) => callback(chunk));
    return ipcRenderer.invoke('stream-chat-message', messages, channel);
  },

  // API Key management
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  setApiKey: (key) => ipcRenderer.invoke('set-api-key', key),
  hasApiKey: () => ipcRenderer.invoke('has-api-key'),

  // Robot status updates
  onRobotStatus: (callback) => {
    ipcRenderer.on('robot-status', (_event, status) => callback(status));
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
