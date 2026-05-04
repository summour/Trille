/* ============================================================
   Trille Canvas Tools
   Owns canvas tool guards and upload flow.
   Load after trille-canvas.js.
   ============================================================ */

function TrilleCanvasIsObjectTarget(event) {
  return !!event.target.closest(
    '.cn,.cn-sticky,.cn-sticky-text,.cn-textblock,.cn-textblock-inner,.cn-shape,.cn-upload,.cn-frame,.canvas-toolbar,.canvas-back,.canvas-link-banner'
  );
}

function TrilleCanvasFallbackUploadPos() {
  const vp = document.getElementById('canvas-vp');
  if (!vp) return { x: 80, y: 80 };

  const rect = vp.getBoundingClientRect();

  return {
    x: (rect.width / 2 - canvasX) / canvasScale - 100,
    y: (rect.height / 2 - canvasY) / canvasScale - 75,
  };
}

function TrillePatchUploadToolbarButton() {
  const button = document.querySelector('.canvas-tool-btn[data-tool="upload"]');
  if (!button || button.dataset.trilleToolGuarded) return;

  button.dataset.trilleToolGuarded = '1';
  button.onclick = () => setCanvasTool('upload');
}

function TrillePatchUploadPlacement() {
  if (typeof placeCanvasObject !== 'function' || placeCanvasObject.trilleToolGuarded) return;

  const basePlaceCanvasObject = placeCanvasObject;

  placeCanvasObject = function TrilleGuardedPlaceCanvasObject(tool, wx, wy) {
    if (tool === 'upload') {
      window._canvasUploadPos = { x: wx - 100, y: wy - 75 };
      document.getElementById('canvas-upload-input')?.click();
      return;
    }

    basePlaceCanvasObject(tool, wx, wy);
  };

  placeCanvasObject.trilleToolGuarded = true;
}

function TrillePatchCanvasUploadHandler() {
  if (typeof handleCanvasUpload !== 'function' || handleCanvasUpload.trilleToolGuarded) return;

  handleCanvasUpload = function TrilleGuardedHandleCanvasUpload(event) {
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

      saveCanvasData();
      setCanvasTool('select');
      renderCanvas();
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

function TrillePatchObjectPointerUpGuard() {
  const vp = document.getElementById('canvas-vp');
  if (!vp || vp.dataset.trilleObjectPointerGuarded) return;

  vp.dataset.trilleObjectPointerGuarded = '1';

  vp.addEventListener('pointerup', event => {
    if (canvasActiveTool === 'select') return;
    if (!TrilleCanvasIsObjectTarget(event)) return;

    setCanvasTool('select');
    event.stopPropagation();
  }, true);
}

function TrilleInstallCanvasToolGuards() {
  TrillePatchUploadToolbarButton();
  TrillePatchUploadPlacement();
  TrillePatchCanvasUploadHandler();
  TrillePatchObjectPointerUpGuard();
}

TrilleInstallCanvasToolGuards();
