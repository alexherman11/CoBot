// Chat Controller - manages conversation state, sends messages, extracts code
const ChatController = {
  conversationHistory: [],

  init() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');

    sendBtn.addEventListener('click', () => this.sendMessage());

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Reset chat button and modal
    document.getElementById('chat-reset-btn').addEventListener('click', () => this.showResetModal());
    document.getElementById('reset-yes-btn').addEventListener('click', () => this.confirmReset(true));
    document.getElementById('reset-no-btn').addEventListener('click', () => this.confirmReset(false));
    document.getElementById('reset-cancel-btn').addEventListener('click', () => this.hideResetModal());
  },

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const text = input.value.trim();

    if (!text) return;

    // Show user message
    ChatPanel.addUserMessage(text);
    input.value = '';
    sendBtn.disabled = true;

    // Add user message to history (without code context — that's added at send time)
    this.conversationHistory.push({ role: 'user', content: text });

    // Show typing indicator
    ChatPanel.showTypingIndicator();

    try {
      // Build messages to send: keep last 10 messages to avoid token overflow
      const recentHistory = this.conversationHistory.slice(-10);

      // Attach current editor code only to the latest user message
      const currentCode = window.codeEditor ? window.codeEditor.getValue() : '';
      const messagesToSend = recentHistory.map((msg, i) => {
        if (i === recentHistory.length - 1 && msg.role === 'user' && currentCode.trim()) {
          return { ...msg, content: `[Current code in the editor:\n\`\`\`python\n${currentCode}\`\`\`]\n\nUser request: ${msg.content}` };
        }
        return msg;
      });

      let fullText = '';
      let msgEl = null;
      let gotFirstChunk = false;

      await window.api.streamChatMessage(messagesToSend, (chunk) => {
        if (chunk.error) {
          ChatPanel.hideTypingIndicator();
          // Remove empty streaming bubble if it exists
          if (msgEl && !fullText) {
            msgEl.remove();
          }
          ChatPanel.addErrorMessage(chunk.error, true);
          return;
        }
        if (chunk.text) {
          if (!gotFirstChunk) {
            gotFirstChunk = true;
            ChatPanel.hideTypingIndicator();
            msgEl = ChatPanel.addStreamingMessage();
          }
          fullText += chunk.text;
          ChatPanel.updateStreamingMessage(msgEl, fullText);
        }
        if (chunk.done) {
          ChatPanel.hideTypingIndicator();
          if (chunk.error) {
            // Stream ended with an error
            if (msgEl && !fullText) msgEl.remove();
            ChatPanel.addErrorMessage(chunk.error, true);
          } else if (fullText && msgEl) {
            // Final update
            ChatPanel.updateStreamingMessage(msgEl, fullText);
            // Add to conversation history
            this.conversationHistory.push({ role: 'assistant', content: fullText });
          } else if (!fullText) {
            // Got done but no text — empty response
            if (msgEl) msgEl.remove();
            ChatPanel.addErrorMessage("CoBot didn't have a response. Try asking again!", true);
          }
        }
      });
    } catch (err) {
      ChatPanel.hideTypingIndicator();
      ChatPanel.addErrorMessage(
        err.message || "Something went wrong. Check your API key in Settings.",
        true
      );
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  },

  clearHistory() {
    this.conversationHistory = [];
    ChatPanel.showWelcome();
  },

  showResetModal() {
    document.getElementById('reset-modal').style.display = '';
  },

  hideResetModal() {
    document.getElementById('reset-modal').style.display = 'none';
  },

  async retryLastMessage() {
    const sendBtn = document.getElementById('chat-send-btn');
    sendBtn.disabled = true;

    ChatPanel.showTypingIndicator();

    try {
      const recentHistory = this.conversationHistory.slice(-10);

      const currentCode = window.codeEditor ? window.codeEditor.getValue() : '';
      const messagesToSend = recentHistory.map((msg, i) => {
        if (i === recentHistory.length - 1 && msg.role === 'user' && currentCode.trim()) {
          return { ...msg, content: `[Current code in the editor:\n\`\`\`python\n${currentCode}\`\`\`]\n\nUser request: ${msg.content}` };
        }
        return msg;
      });

      let fullText = '';
      let msgEl = null;
      let gotFirstChunk = false;

      await window.api.streamChatMessage(messagesToSend, (chunk) => {
        if (chunk.error) {
          ChatPanel.hideTypingIndicator();
          if (msgEl && !fullText) {
            msgEl.remove();
          }
          ChatPanel.addErrorMessage(chunk.error, true);
          return;
        }
        if (chunk.text) {
          if (!gotFirstChunk) {
            gotFirstChunk = true;
            ChatPanel.hideTypingIndicator();
            msgEl = ChatPanel.addStreamingMessage();
          }
          fullText += chunk.text;
          ChatPanel.updateStreamingMessage(msgEl, fullText);
        }
        if (chunk.done) {
          ChatPanel.hideTypingIndicator();
          if (chunk.error) {
            if (msgEl && !fullText) msgEl.remove();
            ChatPanel.addErrorMessage(chunk.error, true);
          } else if (fullText && msgEl) {
            ChatPanel.updateStreamingMessage(msgEl, fullText);
            this.conversationHistory.push({ role: 'assistant', content: fullText });
          } else if (!fullText) {
            if (msgEl) msgEl.remove();
            ChatPanel.addErrorMessage("CoBot didn't have a response. Try asking again!", true);
          }
        }
      });
    } catch (err) {
      ChatPanel.hideTypingIndicator();
      ChatPanel.addErrorMessage(
        err.message || "Something went wrong. Check your API key in Settings.",
        true
      );
    } finally {
      sendBtn.disabled = false;
      document.getElementById('chat-input').focus();
    }
  },

  confirmReset(clearCode) {
    this.hideResetModal();
    this.clearHistory();
    if (clearCode && window.codeEditor) {
      window.codeEditor.setValue('');
    }
    document.getElementById('status-message').textContent = clearCode
      ? 'Chat and code cleared.'
      : 'Chat cleared. Code kept.';
  }
};
