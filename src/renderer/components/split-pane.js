// Split pane - draggable divider between left and right panels
const SplitPane = {
  init() {
    const divider = document.getElementById('divider');
    const leftPanel = document.getElementById('left-panel');
    let isDragging = false;

    divider.addEventListener('mousedown', (e) => {
      isDragging = true;
      divider.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const container = document.getElementById('main-content');
      const containerRect = container.getBoundingClientRect();
      let newWidth = e.clientX - containerRect.left;

      // Clamp between 300px and 70% of container
      const maxWidth = containerRect.width * 0.7;
      newWidth = Math.max(300, Math.min(newWidth, maxWidth));

      leftPanel.style.width = newWidth + 'px';

      // Notify editor to resize
      if (window.codeEditor && window.codeEditor.layout) {
        window.codeEditor.layout();
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        divider.classList.remove('dragging');
        document.body.style.cursor = '';
      }
    });
  }
};
