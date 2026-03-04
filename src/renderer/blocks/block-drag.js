// Block Drag and Drop handlers using HTML5 Drag and Drop API
const BlockDrag = {
  draggedBlockUid: null,
  draggedTypeId: null,
  dragSource: null, // 'palette' or 'workspace'
  dropIndicator: null,

  init() {
    this.setupWorkspaceDrop();
    this.setupTrashDrop();
  },

  // Called when dragging starts from palette
  handlePaletteDragStart(e, typeId) {
    this.draggedTypeId = typeId;
    this.draggedBlockUid = null;
    this.dragSource = 'palette';
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', typeId);
  },

  // Called when dragging starts from workspace
  handleWorkspaceDragStart(e, uid) {
    this.draggedBlockUid = uid;
    this.draggedTypeId = null;
    this.dragSource = 'workspace';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', uid);

    // Make the element semi-transparent while dragging
    setTimeout(() => {
      const el = document.querySelector(`[data-uid="${uid}"]`);
      if (el) el.style.opacity = '0.4';
    }, 0);
  },

  handleDragEnd() {
    // Restore opacity
    if (this.draggedBlockUid) {
      const el = document.querySelector(`[data-uid="${this.draggedBlockUid}"]`);
      if (el) el.style.opacity = '1';
    }
    this.removeDropIndicator();
    this.draggedBlockUid = null;
    this.draggedTypeId = null;
    this.dragSource = null;

    // Remove drag-over styles
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  },

  setupWorkspaceDrop() {
    const dropZone = document.getElementById('workspace-drop-zone');

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = this.dragSource === 'palette' ? 'copy' : 'move';
      dropZone.classList.add('drag-over');
      this.showDropIndicator(e, dropZone);
    });

    dropZone.addEventListener('dragleave', (e) => {
      if (!dropZone.contains(e.relatedTarget)) {
        dropZone.classList.remove('drag-over');
        this.removeDropIndicator();
      }
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const insertIndex = this.getDropIndex(e, dropZone);

      if (this.dragSource === 'palette') {
        // Create new block from palette
        const typeId = e.dataTransfer.getData('text/plain');
        BlockWorkspace.addBlock(typeId, insertIndex);
      } else if (this.dragSource === 'workspace') {
        // Move existing block
        const uid = e.dataTransfer.getData('text/plain');
        BlockWorkspace.moveBlock(uid, insertIndex);
      }

      this.removeDropIndicator();
    });

    // Setup delegated events for children drop zones
    dropZone.addEventListener('dragover', (e) => {
      const childZone = e.target.closest('.block-children');
      if (childZone) {
        e.preventDefault();
        e.stopPropagation();
        childZone.classList.add('drag-over');
      }
    });

    dropZone.addEventListener('drop', (e) => {
      const childZone = e.target.closest('.block-children');
      if (childZone) {
        e.preventDefault();
        e.stopPropagation();
        childZone.classList.remove('drag-over');
        const parentUid = childZone.dataset.parentUid;
        const childIndex = this.getDropIndex(e, childZone);

        if (this.dragSource === 'palette') {
          const typeId = e.dataTransfer.getData('text/plain');
          BlockWorkspace.addBlockToContainer(typeId, parentUid, childIndex);
        } else if (this.dragSource === 'workspace') {
          const uid = e.dataTransfer.getData('text/plain');
          BlockWorkspace.moveBlockToContainer(uid, parentUid, childIndex);
        }
        this.removeDropIndicator();
      }
    });
  },

  setupTrashDrop() {
    const trash = document.getElementById('trash-zone');

    trash.addEventListener('dragover', (e) => {
      e.preventDefault();
      trash.classList.add('drag-over');
    });

    trash.addEventListener('dragleave', () => {
      trash.classList.remove('drag-over');
    });

    trash.addEventListener('drop', (e) => {
      e.preventDefault();
      trash.classList.remove('drag-over');
      if (this.dragSource === 'workspace' && this.draggedBlockUid) {
        BlockWorkspace.removeBlock(this.draggedBlockUid);
      }
    });
  },

  showDropIndicator(e, container) {
    this.removeDropIndicator();
    const indicator = document.createElement('div');
    indicator.className = 'drop-indicator';
    this.dropIndicator = indicator;

    const blocks = Array.from(container.querySelectorAll(':scope > .workspace-block'));
    let insertBefore = null;

    for (const block of blocks) {
      const rect = block.getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) {
        insertBefore = block;
        break;
      }
    }

    if (insertBefore) {
      container.insertBefore(indicator, insertBefore);
    } else {
      container.appendChild(indicator);
    }
  },

  removeDropIndicator() {
    if (this.dropIndicator && this.dropIndicator.parentNode) {
      this.dropIndicator.remove();
    }
    this.dropIndicator = null;
  },

  getDropIndex(e, container) {
    const blocks = Array.from(container.querySelectorAll(':scope > .workspace-block'));
    for (let i = 0; i < blocks.length; i++) {
      const rect = blocks[i].getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) {
        return i;
      }
    }
    return blocks.length;
  }
};
