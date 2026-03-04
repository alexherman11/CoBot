// Block Compiler - converts block tree to VEX IQ Python code
const BlockCompiler = {
  compile() {
    const blocks = BlockWorkspace.getBlockTree();
    const lines = [];

    blocks.forEach(block => {
      this.compileBlock(block, 0, lines);
    });

    const code = lines.join('\n') + '\n';

    // Update the Monaco editor
    if (window.codeEditor) {
      window.codeEditor.setValue(code);
    }
  },

  compileBlock(block, indent, lines) {
    const def = BlockDefinitions.getType(block.typeId);
    const prefix = '    '.repeat(indent);

    // Substitute parameters into the template
    let line = def.template;
    def.params.forEach(paramDef => {
      const value = block.params[paramDef.name] ?? paramDef.default;
      line = line.replace(`{${paramDef.name}}`, value);
    });

    lines.push(prefix + line);

    // Handle container blocks (Repeat / While)
    if (def.isContainer) {
      if (block.children.length === 0) {
        lines.push(prefix + '    pass');
      } else {
        block.children.forEach(child => {
          this.compileBlock(child, indent + 1, lines);
        });
      }
    }
  }
};
