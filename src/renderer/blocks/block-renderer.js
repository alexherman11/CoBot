// Block Renderer - creates DOM elements from block instances
const BlockRenderer = {
  render(block) {
    const def = BlockDefinitions.getType(block.typeId);
    const el = document.createElement('div');
    el.className = 'workspace-block';
    el.dataset.uid = block.uid;
    el.draggable = true;

    // Build block header
    const header = document.createElement('div');
    header.className = `block-header block-color-${def.color}`;

    // Icon
    const icon = document.createElement('span');
    icon.className = 'block-icon';
    icon.textContent = def.icon;
    header.appendChild(icon);

    // Label
    const label = document.createElement('span');
    label.textContent = def.label;
    header.appendChild(label);

    // Parameter inputs
    def.params.forEach(paramDef => {
      if (paramDef.type === 'number') {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'block-param';
        input.value = block.params[paramDef.name] ?? paramDef.default;
        input.min = paramDef.min;
        input.max = paramDef.max;
        input.dataset.paramName = paramDef.name;
        input.addEventListener('input', () => {
          block.params[paramDef.name] = parseFloat(input.value) || paramDef.default;
          BlockCompiler.compile();
        });
        // Prevent drag when clicking input
        input.addEventListener('mousedown', e => e.stopPropagation());
        header.appendChild(input);

        if (paramDef.label) {
          const unit = document.createElement('span');
          unit.textContent = paramDef.label;
          unit.style.fontSize = '12px';
          unit.style.opacity = '0.8';
          header.appendChild(unit);
        }
      } else if (paramDef.type === 'select') {
        const select = document.createElement('select');
        select.className = 'block-param-select';
        select.dataset.paramName = paramDef.name;

        paramDef.options.forEach((opt, i) => {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = paramDef.labels ? paramDef.labels[i] : opt;
          if (opt === (block.params[paramDef.name] ?? paramDef.default)) {
            option.selected = true;
          }
          select.appendChild(option);
        });

        select.addEventListener('change', () => {
          block.params[paramDef.name] = select.value;
          BlockCompiler.compile();
        });
        select.addEventListener('mousedown', e => e.stopPropagation());
        header.appendChild(select);
      }
    });

    // Delete button (not for On Start)
    if (!def.isEntry) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'block-delete';
      deleteBtn.innerHTML = '&times;';
      deleteBtn.title = 'Delete block';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        BlockWorkspace.removeBlock(block.uid);
      });
      header.appendChild(deleteBtn);
    }

    el.appendChild(header);

    // Children container for container blocks
    if (def.isContainer) {
      const childrenEl = document.createElement('div');
      childrenEl.className = 'block-children';
      childrenEl.dataset.parentUid = block.uid;

      if (block.children.length === 0) {
        const hint = document.createElement('div');
        hint.className = 'children-hint';
        hint.textContent = 'Drop blocks inside';
        childrenEl.appendChild(hint);
      } else {
        block.children.forEach(child => {
          childrenEl.appendChild(this.render(child));
        });
      }

      el.appendChild(childrenEl);

      // Footer bar for visual closure
      const footer = document.createElement('div');
      footer.className = `block-footer block-color-${def.color}`;
      footer.textContent = `end ${def.label.toLowerCase()}`;
      el.appendChild(footer);
    }

    return el;
  }
};
