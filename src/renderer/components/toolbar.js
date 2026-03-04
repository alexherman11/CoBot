// Toolbar - upload button, robot status, settings
const Toolbar = {
  robotPort: null,

  init() {
    // Upload button
    document.getElementById('upload-btn').addEventListener('click', () => this.handleUpload());

    // Settings button
    document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
    document.getElementById('save-settings-btn').addEventListener('click', () => this.saveSettings());
    document.getElementById('cancel-settings-btn').addEventListener('click', () => this.hideSettings());

    // Copy code button
    document.getElementById('copy-code-btn').addEventListener('click', () => this.copyCode());

    // Listen for robot status updates
    window.api.onRobotStatus((status) => this.updateRobotStatus(status));

    // Close modal on backdrop click
    document.getElementById('settings-modal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('settings-modal')) this.hideSettings();
    });
  },

  updateRobotStatus(status) {
    const el = document.getElementById('robot-status');
    const textEl = el.querySelector('.status-text');
    const uploadBtn = document.getElementById('upload-btn');

    if (status.connected) {
      el.className = 'status-connected';
      textEl.textContent = `Connected on ${status.port}`;
      uploadBtn.disabled = false;
      this.robotPort = status.port;
    } else {
      el.className = 'status-disconnected';
      textEl.textContent = 'No robot found';
      uploadBtn.disabled = true;
      this.robotPort = null;
    }
  },

  async handleUpload() {
    const code = window.codeEditor ? window.codeEditor.getValue() : '';
    if (!code.trim()) {
      this.setStatus('No code to upload!');
      return;
    }

    const slot = document.getElementById('slot-select').value;
    const uploadBtn = document.getElementById('upload-btn');

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    this.setStatus('Uploading code to robot...');

    try {
      const result = await window.api.uploadCode(code, parseInt(slot));
      if (result.success) {
        this.setStatus('Code uploaded and running!');
      } else {
        this.setStatus(`Upload failed: ${result.error}`);
      }
    } catch (err) {
      this.setStatus(`Upload error: ${err.message}`);
    } finally {
      uploadBtn.innerHTML = '<span class="upload-icon">&#9654;</span> Upload & Run';
      // Re-enable if robot still connected
      if (this.robotPort) uploadBtn.disabled = false;
    }
  },

  copyCode() {
    const code = window.codeEditor ? window.codeEditor.getValue() : '';
    navigator.clipboard.writeText(code).then(() => {
      this.setStatus('Code copied to clipboard!');
    });
  },

  async showSettings() {
    const modal = document.getElementById('settings-modal');
    const input = document.getElementById('api-key-input');
    const currentKey = await window.api.getApiKey();
    input.value = currentKey || '';
    modal.classList.remove('hidden');
    input.focus();
  },

  hideSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
  },

  async saveSettings() {
    const key = document.getElementById('api-key-input').value.trim();
    if (key) {
      await window.api.setApiKey(key);
      this.setStatus('API key saved!');
    }
    this.hideSettings();
  },

  setStatus(msg) {
    document.getElementById('status-message').textContent = msg;
  }
};
