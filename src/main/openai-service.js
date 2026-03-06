const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

class OpenAIService {
  constructor(apiKey) {
    this.client = new Anthropic({ apiKey, timeout: 120000 });
    this.systemPrompt = this.buildSystemPrompt();
  }

  buildSystemPrompt() {
    let apiDocs = '';
    try {
      // Try loading from resources (packaged app)
      const resourcePath = path.join(process.resourcesPath, 'vex_api_context.txt');
      apiDocs = fs.readFileSync(resourcePath, 'utf-8');
    } catch {
      try {
        // Fallback to source directory (development)
        const devPath = path.join(__dirname, '..', '..', 'vex_iq_docs', 'driving_motors_controller_api.txt');
        apiDocs = fs.readFileSync(devPath, 'utf-8');
      } catch {
        apiDocs = 'VEX IQ 2nd Gen API documentation not available.';
      }
    }

    return `You are CoBot, a friendly coding assistant that helps 4th grade students (ages 9-10) program VEX IQ 2nd Generation robots using Python.

RULES:
- Only use the official VEX IQ 2nd Gen Python API. Never invent functions that don't exist.
- Use simple, kid-friendly language. Explain things like you're talking to a 10-year-old.
- Add helpful comments in the code.
- Use wait(seconds, SECONDS) between movements.
- The user's message may include their current code in a [Current code in the editor: ...] block. When it does, BUILD ON that existing code by adding the requested changes to it rather than writing from scratch. Only start fresh if the user explicitly asks for something completely new or unrelated.
- When you do provide code, always put it in a \`\`\`python code block and return the FULL updated program so the student can click "Use this code" and get a complete working program.
- Ask follow up questions if the student's request is ambiguous. Always ask which ports the drive and actuator motors are plugged into.

VEX IQ 2nd Gen Python API Reference:
${apiDocs}`;
  }

  async sendMessage(messages) {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: this.systemPrompt,
      messages: messages
    });

    const content = response.content.map(block => block.text).join('');
    return {
      content,
      usage: response.usage
    };
  }

  async streamMessage(messages, onChunk) {
    let lastChunkTime = Date.now();
    let timedOut = false;
    const timeoutCheck = setInterval(() => {
      if (Date.now() - lastChunkTime > 60000) {
        clearInterval(timeoutCheck);
        timedOut = true;
        stream.abort();
      }
    }, 5000);

    let receivedText = false;
    const stream = this.client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: this.systemPrompt,
      messages: messages
    });

    try {
      for await (const event of stream) {
        lastChunkTime = Date.now();
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          receivedText = true;
          onChunk({ text: event.delta.text });
        }
      }
      if (receivedText) {
        onChunk({ done: true });
      } else {
        onChunk({ done: true, error: 'CoBot got an empty response from the API. Try rephrasing your question!' });
      }
    } catch (err) {
      if (timedOut) {
        onChunk({ done: true, error: 'Response timed out. Try again!' });
      } else {
        throw err;
      }
    } finally {
      clearInterval(timeoutCheck);
    }
  }
}

module.exports = { OpenAIService };
