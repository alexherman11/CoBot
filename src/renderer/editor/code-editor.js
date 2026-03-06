// Monaco Editor wrapper for Python code panel
const CodeEditor = {
  editor: null,

  init() {
    // Use the absolute path provided by the preload script
    // This works in both dev (node_modules/) and packaged (app.asar.unpacked/) builds
    const monacoPath = window.api.monacoPath;

    // Configure Monaco loader
    const loaderScript = document.createElement('script');
    loaderScript.src = 'file:///' + monacoPath + '/loader.js';
    loaderScript.onerror = () => {
      console.error('Failed to load Monaco loader from:', monacoPath + '/loader.js');
      // Show fallback textarea
      this.createFallbackEditor();
    };
    loaderScript.onload = () => {
      require.config({
        paths: { vs: 'file:///' + monacoPath },
        'vs/nls': { availableLanguages: { '*': '' } }
      });

      // Provide a no-op worker to avoid CSP/blob issues in Electron
      window.MonacoEnvironment = {
        getWorkerUrl: function() {
          return 'data:text/javascript;charset=utf-8,' + encodeURIComponent('self.close()');
        }
      };

      require(['vs/editor/editor.main'], () => {
        this.createEditor();
      });
    };
    document.head.appendChild(loaderScript);
  },

  createEditor() {
    this.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
      value: this.getDefaultCode(),
      language: 'python',
      theme: 'vs',              // Light theme
      fontSize: 16,
      fontFamily: "'Consolas', 'Courier New', monospace",
      wordWrap: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      lineNumbers: 'on',
      renderLineHighlight: 'line',
      tabSize: 4,
      insertSpaces: true,
      padding: { top: 8 }
    });

    // Expose globally
    window.codeEditor = this.editor;
    window.aiCodeActive = false;
    window._blockCompilerUpdating = false;
    window._aiCodeLoading = false;

    // Clear aiCodeActive when user manually edits (not programmatic setValue)
    this.editor.onDidChangeModelContent(() => {
      if (!window._blockCompilerUpdating && !window._aiCodeLoading) {
        window.aiCodeActive = false;
      }
    });

    // Now that Monaco is ready, recompile blocks to populate the editor
    if (typeof BlockCompiler !== 'undefined') {
      BlockCompiler.compile();
    }
  },

  createFallbackEditor() {
    // If Monaco fails to load, create a simple textarea fallback
    const container = document.getElementById('monaco-editor');
    container.innerHTML = '';
    const textarea = document.createElement('textarea');
    textarea.id = 'fallback-editor';
    textarea.style.cssText = 'width:100%;height:100%;font-family:Consolas,monospace;font-size:16px;padding:8px;border:none;resize:none;outline:none;tab-size:4;';
    textarea.value = this.getDefaultCode();
    container.appendChild(textarea);

    // Create a minimal editor-like API on window.codeEditor
    window.codeEditor = {
      getValue: () => textarea.value,
      setValue: (v) => { textarea.value = v; },
      layout: () => {}
    };

    // Recompile blocks into the fallback editor
    if (typeof BlockCompiler !== 'undefined') {
      BlockCompiler.compile();
    }
  },

  getDefaultCode() {
    return '# VEX IQ Robot Program\n# Drag blocks or use AI Chat to generate code!\n\n';
  },

  setCode(python) {
    if (this.editor) {
      this.editor.setValue(python);
    }
  },

  getCode() {
    return this.editor ? this.editor.getValue() : '';
  },

  layout() {
    if (this.editor) {
      this.editor.layout();
    }
  }
};
