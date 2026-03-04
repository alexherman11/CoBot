// Block Palette - sidebar of draggable block templates
const BlockPalette = {
  init() {
    const palette = document.getElementById('block-palette');
    palette.innerHTML = '';

    const categories = {
      'Motion': ['forward', 'backward', 'turn'],
      'Control': ['repeat', 'while']
    };

    Object.entries(categories).forEach(([catName, typeIds]) => {
      const header = document.createElement('div');
      header.className = 'palette-header';
      header.textContent = catName;
      palette.appendChild(header);

      typeIds.forEach(typeId => {
        const def = BlockDefinitions.getType(typeId);
        const el = document.createElement('div');
        el.className = `palette-block block-color-${def.color}`;
        el.draggable = true;

        const icon = document.createElement('span');
        icon.className = 'block-icon';
        icon.textContent = def.icon;
        el.appendChild(icon);

        const label = document.createElement('span');
        label.textContent = def.label;
        el.appendChild(label);

        el.addEventListener('dragstart', (e) => {
          BlockDrag.handlePaletteDragStart(e, typeId);
        });

        el.addEventListener('dragend', () => {
          BlockDrag.handleDragEnd();
        });

        palette.appendChild(el);
      });
    });
  }
};
