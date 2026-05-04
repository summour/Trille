/* ============================================================
   Trille Canvas Tools
   Owns canvas object placement, upload flow, and object edit/drag arbitration.
   Load after trille-canvas.js and before init().
   ============================================================ */

function TrilleCanvasFallbackUploadPos() {
  const vp = document.getElementById('canvas-vp');
  if (!vp) return { x: 80, y: 80 };

  const rect = vp.getBoundingClientRect();

  return {
    x: (rect.width / 2 - canvasX) / canvasScale - 100,
    y: (rect.height / 2 - canvasY) / canvasScale - 75,
  };
}

function TrilleCommitCanvasChange() {
  saveCanvasData();
  renderCanvas();
}

function TrillePatchUploadToolbarButton() {
  const button = document.querySelector('.canvas-tool-btn[data-tool="upload"]');
  if (!button || button.dataset.trilleToolGuarded) return;

  button.dataset.trilleToolGuarded = '1';
  button.onclick = () => setCanvasTool('upload');
}

function TrillePatchObjectPlacement() {
  if (typeof placeCanvasObject !== 'function' || placeCanvasObject.trilleToolGuarded) return;

  placeCanvasObject = function TrillePlaceCanvasObject(tool, wx, wy) {
    const id = uid();

    switch (tool) {
      case 'sticky':
        canvasStickyNotes.push({ id, x: wx - 80, y: wy - 60, w: 160, h: 120, text: 'Note...', color: 'yellow' });
        break;
      case 'text':
        canvasTextBlocks.push({ id, x: wx - 60, y: wy - 12, text: 'Text', fontSize: 16, bold: false });
        break;
      case 'shape':
        canvasShapes.push({ id, x: wx - 60, y: wy - 40, w: 120, h: 80, shape: window._canvasShapeType || 'rect', color: '#e8e8ed', strokeColor: '#aaa' });
        break;
      case 'frame':
        canvasFrames.push({ id, x: wx - 150, y: wy - 100, w: 300, h: 200, label: 'Frame' });
        break;
      case 'upload':
        window._canvasUploadPos = { x: wx - 100, y: wy - 75 };
        document.getElementById('canvas-upload-input')?.click();
        return;
      default:
        return;
    }

    setCanvasTool('select');
    TrilleCommitCanvasChange();
  };

  placeCanvasObject.trilleToolGuarded = true;
}

function TrillePatchCanvasUploadHandler() {
  if (typeof handleCanvasUpload !== 'function' || handleCanvasUpload.trilleToolGuarded) return;

  handleCanvasUpload = function TrilleHandleCanvasUpload(event) {
    const input = event?.target;
    const file = input?.files?.[0];

    if (!file) {
      setCanvasTool('select');
      return;
    }

    if (!file.type || !file.type.startsWith('image/')) {
      input.value = '';
      setCanvasTool('select');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const pos = window._canvasUploadPos || TrilleCanvasFallbackUploadPos();

      canvasUploads.push({
        id: uid(),
        x: pos.x,
        y: pos.y,
        w: 200,
        h: 150,
        src: reader.result,
        name: file.name || 'Image',
      });

      window._canvasUploadPos = null;
      input.value = '';
      setCanvasTool('select');
      TrilleCommitCanvasChange();
    };

    reader.onerror = () => {
      window._canvasUploadPos = null;
      input.value = '';
      setCanvasTool('select');
    };

    reader.readAsDataURL(file);
  };

  handleCanvasUpload.trilleToolGuarded = true;
}

function TrilleIsCanvasTextEditorTarget(event) {
  return !!event.target.closest('.cn-sticky-text,.cn-textblock-inner');
}

function TrilleIsCanvasObjectControlTarget(event) {
  return !!event.target.closest(
    '.cn-obj-del,.Trille-canvas-resize-handle,.Trille-canvas-layer-controls,.Trille-canvas-layer-btn,.Trille-canvas-sticky-colors,.Trille-canvas-sticky-palette-btn,.Trille-canvas-sticky-palette-panel,.Trille-canvas-sticky-color'
  );
}

function TrilleFocusCanvasTextEditor(host) {
  const editor = host.querySelector('.cn-sticky-text,.cn-textblock-inner');
  if (!editor) return;

  editor.focus();

  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);

  const selection = window.getSelection();
  if (!selection) return;

  selection.removeAllRanges();
  selection.addRange(range);
}

function TrillePatchCanvasObjectDrag() {
  if (typeof bindCanvasObjDrag !== 'function' || bindCanvasObjDrag.trilleEditGuarded) return;

  bindCanvasObjDrag = function TrilleBindCanvasObjDragWithEditThreshold() {
    const world = document.getElementById('canvas-world');
    if (!world) return;

    const selectors = [
      { sel: '.cn-sticky', arr: canvasStickyNotes, key: 'snid', editable: true },
      { sel: '.cn-textblock', arr: canvasTextBlocks, key: 'tbid', editable: true },
      { sel: '.cn-shape', arr: canvasShapes, key: 'shid', editable: false },
      { sel: '.cn-upload', arr: canvasUploads, key: 'upid', editable: false },
      { sel: '.cn-frame', arr: canvasFrames, key: 'frid', editable: false },
    ];

    selectors.forEach(({ sel, arr, key, editable }) => {
      world.querySelectorAll(sel).forEach(el => {
        if (el.dataset.trilleObjDragBound === '1') return;
        el.dataset.trilleObjDragBound = '1';

        let pending = false;
        let dragging = false;
        let sx = 0;
        let sy = 0;
        let ox = 0;
        let oy = 0;
        let pid = null;
        let obj = null;

        el.addEventListener('pointerdown', event => {
          if (canvasActiveTool !== 'select') return;
          if (TrilleIsCanvasObjectControlTarget(event)) return;
          if (TrilleIsCanvasTextEditorTarget(event)) return;

          const id = el.dataset[key];
          obj = arr.find(item => item.id === id);
          if (!obj) return;

          pending = true;
          dragging = false;
          pid = event.pointerId;
          sx = event.clientX;
          sy = event.clientY;
          ox = obj.x;
          oy = obj.y;
        }, { passive: true });

        el.addEventListener('pointermove', event => {
          if (!pending || !obj) return;

          const moved = Math.hypot(event.clientX - sx, event.clientY - sy);
          if (!dragging && moved < 8) return;

          if (!dragging) {
            dragging = true;
            try { el.setPointerCapture(pid); } catch (err) {}
          }

          event.preventDefault();

          const dx = (event.clientX - sx) / canvasScale;
          const dy = (event.clientY - sy) / canvasScale;

          obj.x = Math.max(0, ox + dx);
          obj.y = Math.max(0, oy + dy);

          el.style.left = obj.x + 'px';
          el.style.top = obj.y + 'px';
        }, { passive: false });

        el.addEventListener('pointerup', () => {
          if (!pending) return;

          if (dragging) {
            saveCanvasData();
          } else if (editable) {
            TrilleFocusCanvasTextEditor(el);
          }

          pending = false;
          dragging = false;
          obj = null;
        });

        el.addEventListener('pointercancel', () => {
          pending = false;
          dragging = false;
          obj = null;
        });
      });
    });
  };

  bindCanvasObjDrag.trilleEditGuarded = true;
}

function TrilleInstallCanvasToolGuards() {
  TrillePatchUploadToolbarButton();
  TrillePatchObjectPlacement();
  TrillePatchCanvasUploadHandler();
  TrillePatchCanvasObjectDrag();
}

TrilleInstallCanvasToolGuards();
