// Chat Panel - renders chat message UI with bubbles
const ChatPanel = {
  init() {
    const messagesEl = document.getElementById('chat-messages');

    // Show welcome message
    this.showWelcome();
  },

  showWelcome() {
    const messagesEl = document.getElementById('chat-messages');
    messagesEl.innerHTML = `
      <div class="chat-welcome">
        <h3>Hi! I'm CoBot</h3>
        <p>Tell me what you want your robot to do, and I'll write the code for you!</p>
        <p>Try saying: <em>"Make my robot drive in a square"</em></p>
      </div>
    `;
  },

  addUserMessage(text) {
    this.removeWelcome();
    const messagesEl = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = 'chat-message user';
    msg.textContent = text;
    messagesEl.appendChild(msg);
    this.scrollToBottom();
  },

  addAssistantMessage(text) {
    this.removeWelcome();
    const messagesEl = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = 'chat-message assistant';

    // Parse for code blocks
    const parsed = this.parseCodeBlocks(text);
    msg.innerHTML = parsed;

    messagesEl.appendChild(msg);

    // Add "Use this code" buttons
    msg.querySelectorAll('.btn-use-code').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code;
        if (window.codeEditor) {
          if (typeof BlockCompiler !== 'undefined') BlockCompiler._pushHistory();
          window._aiCodeLoading = true;
          window.codeEditor.setValue(code);
          window._aiCodeLoading = false;
          window.aiCodeActive = true;
        }
        document.getElementById('status-message').textContent = 'Code loaded into editor!';
      });
    });

    this.scrollToBottom();
    return msg;
  },

  // Create a message element for streaming and return it
  addStreamingMessage() {
    this.removeWelcome();
    const messagesEl = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = 'chat-message assistant';
    msg.textContent = '';
    messagesEl.appendChild(msg);
    this.scrollToBottom();
    return msg;
  },

  // Update a streaming message with accumulated text
  updateStreamingMessage(msgEl, fullText) {
    const parsed = this.parseCodeBlocks(fullText);
    msgEl.innerHTML = parsed;

    // Add "Use this code" buttons
    msgEl.querySelectorAll('.btn-use-code').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.dataset.code;
        if (window.codeEditor) {
          if (typeof BlockCompiler !== 'undefined') BlockCompiler._pushHistory();
          window._aiCodeLoading = true;
          window.codeEditor.setValue(code);
          window._aiCodeLoading = false;
          window.aiCodeActive = true;
        }
        document.getElementById('status-message').textContent = 'Code loaded into editor!';
      });
    });

    this.scrollToBottom();
  },

  addErrorMessage(text, retryable = false) {
    const messagesEl = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = 'chat-message error';
    msg.textContent = text;

    if (retryable) {
      const retryBtn = document.createElement('button');
      retryBtn.className = 'btn-retry';
      retryBtn.textContent = 'Try Again';
      retryBtn.addEventListener('click', () => {
        msg.remove();
        ChatController.retryLastMessage();
      });
      msg.appendChild(retryBtn);
    }

    messagesEl.appendChild(msg);
    this.scrollToBottom();
  },

  showTypingIndicator() {
    const messagesEl = document.getElementById('chat-messages');
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    messagesEl.appendChild(indicator);
    this.scrollToBottom();
  },

  hideTypingIndicator() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  },

  parseCodeBlocks(text) {
    // Replace ```python ... ``` or ``` ... ``` with styled code blocks
    const codeBlockRegex = /```(?:python)?\s*\n?([\s\S]*?)```/g;
    let result = text;
    let codeIndex = 0;

    result = result.replace(codeBlockRegex, (match, code) => {
      const trimmedCode = code.trim();
      const escapedCode = this.escapeHtml(trimmedCode);
      const dataCode = this.escapeAttr(trimmedCode);
      codeIndex++;
      return `<div class="chat-code-block">${escapedCode}</div>` +
             `<button class="btn-use-code" data-code="${dataCode}">Use this code</button>`;
    });

    // Convert plain newlines to <br> (outside code blocks)
    result = result.replace(/\n/g, '<br>');

    return result;
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '&#10;');
  },

  removeWelcome() {
    const welcome = document.querySelector('.chat-welcome');
    if (welcome) welcome.remove();
  },

  scrollToBottom() {
    const messagesEl = document.getElementById('chat-messages');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
};
