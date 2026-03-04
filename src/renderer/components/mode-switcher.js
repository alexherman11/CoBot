// Mode switcher - toggles between Blocks and AI Chat tabs
const ModeSwitcher = {
  currentMode: 'blocks',

  init() {
    const tabs = document.querySelectorAll('.mode-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTo(tab.dataset.mode);
      });
    });
  },

  switchTo(mode) {
    this.currentMode = mode;

    // Update tab styles
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    // Show/hide content panels
    document.getElementById('blocks-mode').classList.toggle('active', mode === 'blocks');
    document.getElementById('chat-mode').classList.toggle('active', mode === 'chat');

    // Focus chat input when switching to chat
    if (mode === 'chat') {
      setTimeout(() => {
        document.getElementById('chat-input').focus();
      }, 100);
    }
  }
};
