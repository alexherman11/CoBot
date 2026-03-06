// App initialization - wires everything together
(function() {
  'use strict';

  async function init() {
    // Initialize components
    SplitPane.init();
    ModeSwitcher.init();
    Toolbar.init();

    // Initialize block system
    BlockPalette.init();
    BlockDrag.init();
    BlockWorkspace.init();

    // Initialize chat
    ChatPanel.init();
    ChatController.init();

    // Initialize Monaco editor
    CodeEditor.init();

    // Check for API key on first launch
    const hasKey = await window.api.hasApiKey();
    if (!hasKey) {
      // If no key, show settings dialog
      setTimeout(() => {
        Toolbar.showSettings();
        document.getElementById('status-message').textContent =
          'Welcome! Please enter your Anthropic API key to use AI Chat.';
      }, 1000);
    }

    // Initial port scan
    try {
      const status = await window.api.scanPorts();
      Toolbar.updateRobotStatus(status);
    } catch {
      // Silent fail - background scanning will retry
    }

    document.getElementById('status-message').textContent = 'Ready';
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
