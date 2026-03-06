const { OpenAIService } = require('./openai-service');
const { VexcomService } = require('./vexcom-service');
const Store = require('electron-store');

const store = new Store({ encryptionKey: 'vexcoder-cobot-2024' });
let openaiService = null;
let vexcomService = null;

function getOpenAI() {
  if (!openaiService) {
    const key = store.get('anthropic-api-key');
    if (key) {
      openaiService = new OpenAIService(key);
    }
  }
  return openaiService;
}

function getVexcom() {
  if (!vexcomService) {
    vexcomService = new VexcomService();
  }
  return vexcomService;
}

function registerIpcHandlers(ipcMain) {
  // Port scanning
  ipcMain.handle('scan-ports', async () => {
    try {
      return await getVexcom().scanForRobot();
    } catch (err) {
      return { connected: false, error: err.message };
    }
  });

  // Code upload
  ipcMain.handle('upload-code', async (_event, code, slot) => {
    try {
      return await getVexcom().uploadPython(code, slot);
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Chat (non-streaming)
  ipcMain.handle('send-chat-message', async (_event, messages) => {
    const ai = getOpenAI();
    if (!ai) return { error: 'No API key set. Please add your Anthropic API key in Settings.' };
    try {
      return await ai.sendMessage(messages);
    } catch (err) {
      return { error: err.message };
    }
  });

  // Chat (streaming)
  ipcMain.handle('stream-chat-message', async (event, messages, channel) => {
    const ai = getOpenAI();
    if (!ai) {
      event.sender.send(channel, { done: true, error: 'No API key set.' });
      return;
    }
    try {
      await ai.streamMessage(messages, (chunk) => {
        event.sender.send(channel, chunk);
      });
    } catch (err) {
      console.error('[chat stream error]', err.message);
      event.sender.send(channel, { done: true, error: err.message });
    }
  });

  // API key management
  ipcMain.handle('get-api-key', () => {
    return store.get('anthropic-api-key', '');
  });

  ipcMain.handle('set-api-key', (_event, key) => {
    store.set('anthropic-api-key', key);
    openaiService = null; // Reset so next call uses new key
    return { success: true };
  });

  ipcMain.handle('has-api-key', () => {
    return !!store.get('anthropic-api-key');
  });

  // Start periodic robot scanning
  const vexcom = getVexcom();
  setInterval(async () => {
    try {
      const status = await vexcom.scanForRobot();
      const windows = require('electron').BrowserWindow.getAllWindows();
      windows.forEach(win => win.webContents.send('robot-status', status));
    } catch (_) {
      // Silent fail for background scanning
    }
  }, 5000);
}

module.exports = { registerIpcHandlers };
