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

    // Get the current code in the editor to provide as context
    const currentCode = window.codeEditor ? window.codeEditor.getValue() : '';
    const userContent = currentCode.trim()
      ? `[Current code in the editor:\n\`\`\`python\n${currentCode}\`\`\`]\n\nUser request: ${text}`
      : text;

    // Add to history
    this.conversationHistory.push({ role: 'user', content: userContent });

    // Show typing indicator
    ChatPanel.showTypingIndicator();

    try {
      // Use streaming
      const msgEl = ChatPanel.addStreamingMessage();
      ChatPanel.hideTypingIndicator();

      let fullText = '';

      await window.api.streamChatMessage(this.conversationHistory, (chunk) => {
        if (chunk.error) {
          ChatPanel.addErrorMessage(chunk.error);
          return;
        }
        if (chunk.text) {
          fullText += chunk.text;
          ChatPanel.updateStreamingMessage(msgEl, fullText);
        }
        if (chunk.done) {
          // Final update
          ChatPanel.updateStreamingMessage(msgEl, fullText);
          // Add to conversation history
          this.conversationHistory.push({ role: 'assistant', content: fullText });
        }
      });
    } catch (err) {
      ChatPanel.hideTypingIndicator();
      ChatPanel.addErrorMessage(
        err.message || "Something went wrong. Check your API key in Settings."
      );
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  },

  clearHistory() {
    this.conversationHistory = [];
    ChatPanel.showWelcome();
  }
};
