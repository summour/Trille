/* ============================================================
   Trille Canvas Tools
   Owns canvas tool guard helpers only.
   Load after trille-canvas.js.
   ============================================================ */

function TrilleCanvasIsObjectTarget(event) {
  return !!event.target.closest(
    '.cn,.cn-sticky,.cn-sticky-text,.cn-textblock,.cn-textblock-inner,.cn-shape,.cn-upload,.cn-frame,.canvas-toolbar,.canvas-back,.canvas-link-banner'
  );
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
  TrillePatchObjectPointerUpGuard();
}

TrilleInstallCanvasToolGuards();
