// Block Workspace - manages block state and renders the workspace
const BlockWorkspace = {
  blocks: [],   // Top-level block list (linked list as array)
  nextUid: 1,

  init() {
    // Add the default "On Start" block
    this.blocks = [this.createBlockInstance('onStart')];
    this.render();
    BlockCompiler.compile();
  },

  createBlockInstance(typeId) {
    const def = BlockDefinitions.getType(typeId);
    const params = {};
    def.params.forEach(p => {
      params[p.name] = p.default;
    });
    return {
      uid: 'block_' + (this.nextUid++),
      typeId: typeId,
      params: params,
      children: []
    };
  },

  addBlock(typeId, index) {
    const def = BlockDefinitions.getType(typeId);
    // Don't allow multiple On Start blocks
    if (def.isEntry) return;

    const block = this.createBlockInstance(typeId);
    if (index === undefined || index >= this.blocks.length) {
      this.blocks.push(block);
    } else {
      this.blocks.splice(index, block);
    }
    // Fix: splice needs 3 args for insert
    if (index !== undefined && index < this.blocks.length) {
      // Already pushed above if beyond bounds, otherwise splice properly
    }
    this.blocks = this.blocks.filter(Boolean); // Clean nulls
    // Re-insert properly
    this.blocks = [];
    // Let me redo this more simply
    this._rebuildFromScratch(typeId, index, block);
  },

  _rebuildFromScratch(typeId, index, block) {
    // This was getting complicated. Let's use a simpler approach.
    // We re-init blocks from the render, so let's just manage the array directly.
  },

  // Simplified block management
  addBlock(typeId, index) {
    const def = BlockDefinitions.getType(typeId);
    if (def.isEntry) return;

    const block = this.createBlockInstance(typeId);
    if (index === undefined || index >= this.blocks.length) {
      this.blocks.push(block);
    } else {
      this.blocks.splice(index, 0, block);
    }
    this.render();
    BlockCompiler.compile();
  },

  addBlockToContainer(typeId, parentUid, childIndex) {
    const def = BlockDefinitions.getType(typeId);
    if (def.isEntry) return;

    const parent = this.findBlock(parentUid);
    if (!parent) return;

    const block = this.createBlockInstance(typeId);
    if (childIndex === undefined || childIndex >= parent.children.length) {
      parent.children.push(block);
    } else {
      parent.children.splice(childIndex, 0, block);
    }
    this.render();
    BlockCompiler.compile();
  },

  moveBlock(uid, newIndex) {
    const block = this.extractBlock(uid);
    if (!block) return;

    if (newIndex === undefined || newIndex >= this.blocks.length) {
      this.blocks.push(block);
    } else {
      this.blocks.splice(newIndex, 0, block);
    }
    this.render();
    BlockCompiler.compile();
  },

  moveBlockToContainer(uid, parentUid, childIndex) {
    // Don't drop into self
    if (uid === parentUid) return;

    const block = this.extractBlock(uid);
    if (!block) return;

    const parent = this.findBlock(parentUid);
    if (!parent) return;

    if (childIndex === undefined || childIndex >= parent.children.length) {
      parent.children.push(block);
    } else {
      parent.children.splice(childIndex, 0, block);
    }
    this.render();
    BlockCompiler.compile();
  },

  removeBlock(uid) {
    // Don't remove the On Start block
    const block = this.findBlock(uid);
    if (!block) return;
    const def = BlockDefinitions.getType(block.typeId);
    if (def.isEntry) return;

    this.extractBlock(uid);
    this.render();
    BlockCompiler.compile();
  },

  // Find a block by uid recursively
  findBlock(uid, list) {
    list = list || this.blocks;
    for (const block of list) {
      if (block.uid === uid) return block;
      if (block.children.length > 0) {
        const found = this.findBlock(uid, block.children);
        if (found) return found;
      }
    }
    return null;
  },

  // Extract (remove) a block from wherever it is in the tree
  extractBlock(uid) {
    // Try top-level
    for (let i = 0; i < this.blocks.length; i++) {
      if (this.blocks[i].uid === uid) {
        return this.blocks.splice(i, 1)[0];
      }
    }
    // Try nested
    return this._extractFromChildren(uid, this.blocks);
  },

  _extractFromChildren(uid, list) {
    for (const block of list) {
      for (let i = 0; i < block.children.length; i++) {
        if (block.children[i].uid === uid) {
          return block.children.splice(i, 1)[0];
        }
      }
      const found = this._extractFromChildren(uid, block.children);
      if (found) return found;
    }
    return null;
  },

  render() {
    const dropZone = document.getElementById('workspace-drop-zone');
    dropZone.innerHTML = '';

    if (this.blocks.length === 0) {
      const hint = document.createElement('p');
      hint.className = 'workspace-hint';
      hint.textContent = 'Drag blocks here to start coding!';
      dropZone.appendChild(hint);
      return;
    }

    this.blocks.forEach(block => {
      const el = BlockRenderer.render(block);

      // Setup drag events for workspace blocks
      el.addEventListener('dragstart', (e) => {
        // Don't drag the On Start block
        const def = BlockDefinitions.getType(block.typeId);
        if (def.isEntry) {
          e.preventDefault();
          return;
        }
        e.stopPropagation();
        BlockDrag.handleWorkspaceDragStart(e, block.uid);
      });

      el.addEventListener('dragend', () => {
        BlockDrag.handleDragEnd();
      });

      dropZone.appendChild(el);
    });
  },

  // Get all blocks as a flat array (for compiler)
  getBlockTree() {
    return this.blocks;
  },

  // Clear all blocks except On Start
  clear() {
    this.blocks = [this.createBlockInstance('onStart')];
    this.nextUid = 2;
    this.render();
    BlockCompiler.compile();
  }
};
