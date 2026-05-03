/* ============================================================
   Trille Canvas — Miro-style board view
   Mobile-first: pan, pinch-zoom, drag cards, linked lines
   ============================================================ */

// ---- State ----
let canvasScale = 1;
let canvasX = 0;
let canvasY = 0;
let canvasPositions = {}; // { cardId: { x, y } }
let canvasActiveBoard = null; // null = global overview, else boardId
let canvasCtxTarget = null;
let canvasCtxKind = null; // 'board' | 'subcard'
let canvasColorTarget = null;
let canvasCardColors = {}; // { cardId: colorName }

const CANVAS_COLORS = [
  { name: 'default', bg: '#ffffff', dark: '#1c1c1e', label: 'White' },
  { name: 'yellow',  bg: '#fffbe6', dark: '#2a2510', label: 'Yellow' },
  { name: 'pink',    bg: '#fff0f5', dark: '#28101a', label: 'Pink' },
  { name: 'green',   bg: '#f0faf2', dark: '#0f2015', label: 'Green' },
  { name: 'blue',    bg: '#edf4ff', dark: '#0f1c2e', label: 'Blue' },
  { name: 'purple',  bg: '#f5f0ff', dark: '#1a1028', label: 'Purple' },
  { name: 'orange',  bg: '#fff7ed', dark: '#251a08', label: 'Orange' },
];
const CANVAS_SWATCH_COLORS = {
  default:'#e8e8ed', yellow:'#ffe066', pink:'#ffb3cc',
  green:'#a8e6b4', blue:'#a0c4ff', purple:'#c9b4ff', orange:'#ffcf86'
};

// ---- Persistence ----
function saveCanvasData() {
  localStorage.setItem('t-canvas-pos', JSON.stringify(canvasPositions));
  localStorage.setItem('t-canvas-colors', JSON.stringify(canvasCardColors));
}
function loadCanvasData() {
  try { canvasPositions = JSON.parse(localStorage.getItem('t-canvas-pos') || '{}'); } catch(e) { canvasPositions = {}; }
  try { canvasCardColors = JSON.parse(localStorage.getItem('t-canvas-colors') || '{}'); } catch(e) { canvasCardColors = {}; }
}

// ---- Layout helpers ----
function getOrInitPosition(id, fallback) {
  if (!canvasPositions[id]) {
    canvasPositions[id] = { ...fallback };
    saveCanvasData();
  }
  return canvasPositions[id];
}

function autoLayout(items, startX, startY, colW, rowH, cols) {
  items.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    if (!canvasPositions[item.id]) {
      canvasPositions[item.id] = { x: startX + col * colW, y: startY + row * rowH };
    }
  });
  saveCanvasData();
}

// ---- Open canvas ----
function openCanvas(boardId) {
  loadCanvasData();
  canvasActiveBoard = boardId || null;
  canvasScale = 1;
  canvasX = 0;
  canvasY = 0;

  // Auto-layout any cards without saved positions
  if (canvasActiveBoard) {
    const board = cards.find(c => c.id === canvasActiveBoard);
    if (board) {
      autoLayout(board.subcards || [], 20, 20, 230, 190, 2);
    }
  } else {
    autoLayout(cards, 20, 20, 230, 220, 2);
  }

  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.getElementById('view-canvas').classList.add('active');
  document.querySelectorAll('.nbtn').forEach(b => b.classList.remove('active'));

  renderCanvas();
}

function closeCanvas() {
  document.getElementById('canvas-ctx').classList.remove('open');
  document.getElementById('canvas-color-popup').classList.remove('open');
  if (canvasActiveBoard) {
    openBoard(canvasActiveBoard);
  } else {
    switchView('home');
  }
}

// ---- Render ----
function renderCanvas() {
  const view = document.getElementById('view-canvas');
  if (!view) return;

  const board = canvasActiveBoard ? cards.find(c => c.id === canvasActiveBoard) : null;
  const items = canvasActiveBoard
    ? (board ? board.subcards || [] : [])
    : cards;

  // Title
  const titleEl = document.getElementById('canvas-board-title');
  if (titleEl) titleEl.textContent = board ? board.title : 'Overview';

  const world = document.getElementById('canvas-world');
  if (!world) return;

  // Build card HTML
  let html = '';
  items.forEach((item, i) => {
    const pos = canvasPositions[item.id] || { x: 20 + (i % 3) * 230, y: 20 + Math.floor(i / 3) * 190 };
    const color = canvasCardColors[item.id] || 'default';
    const subcards = item.subcards || [];
    const items2 = item.items || [];
    const done = items2.filter(it => it.done).length;
    const nfProg = (item.nf || []).find(f => f.type === 'progress');
    const pct = nfProg ? parseInt(nfProg.value) || 0 : (items2.length ? Math.round(done / items2.length * 100) : null);

    const isBoard = !canvasActiveBoard;

    const tagHtml = (item.tags || []).slice(0, 2).map(t => '#' + esc(t.replace(/^#+/, ''))).join(' ');

    let footer = '';
    if (isBoard && subcards.length) {
      footer = `<div class="cn-footer"><span class="cn-cards-count">${subcards.length} card${subcards.length !== 1 ? 's' : ''}</span>${items2.length ? `<span class="cn-done-count">${done}/${items2.length} done</span>` : ''}</div>`;
    } else if (!isBoard && items2.length) {
      footer = `<div class="cn-footer"><span class="cn-cards-count">${done}/${items2.length} done</span></div>`;
    }

    let progHtml = '';
    if (pct !== null) {
      progHtml = `<div class="cn-prog"><div class="cn-prog-bar"><div class="cn-prog-fill" style="width:${pct}%"></div></div><span class="cn-prog-pct">${pct}%</span></div>`;
    }

    html += `<div class="cn${isBoard ? ' cn-board' : ''}"
      data-id="${item.id}"
      data-color="${color}"
      style="left:${pos.x}px;top:${pos.y}px;z-index:${10 + i};"
    >
      <button class="cn-menu" onclick="openCanvasCtx(event,'${item.id}','${isBoard ? 'board' : 'subcard'}')">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/></svg>
      </button>
      ${tagHtml ? `<div class="cn-tag">${tagHtml}</div>` : ''}
      <div class="cn-title">${esc(item.title)}</div>
      ${item.desc ? `<div class="cn-desc">${esc(item.desc)}</div>` : ''}
      ${progHtml}
      ${footer}
    </div>`;
  });

  world.innerHTML = html;
  applyCanvasTransform();
  drawCanvasLines(items);
  bindCanvasCardDrag();
  bindCanvasPanZoom();
  updateCanvasZoomLabel();

  // Dismiss hint after 3s
  const hint = document.getElementById('canvas-hint');
  if (hint) {
    hint.classList.remove('hidden');
    clearTimeout(window._canvasHintTimer);
    window._canvasHintTimer = setTimeout(() => hint.classList.add('hidden'), 3000);
  }
}

// ---- Transform ----
function applyCanvasTransform() {
  const world = document.getElementById('canvas-world');
  if (world) {
    world.style.transform = `translate(${canvasX}px,${canvasY}px) scale(${canvasScale})`;
  }
}

function updateCanvasZoomLabel() {
  const el = document.getElementById('canvas-zoom-label');
  if (el) el.textContent = Math.round(canvasScale * 100) + '%';
}

function canvasZoomIn() {
  canvasScale = Math.min(3, canvasScale * 1.2);
  applyCanvasTransform();
  updateCanvasZoomLabel();
}
function canvasZoomOut() {
  canvasScale = Math.max(0.2, canvasScale / 1.2);
  applyCanvasTransform();
  updateCanvasZoomLabel();
}
function canvasZoomReset() {
  canvasScale = 1;
  canvasX = 0;
  canvasY = 0;
  applyCanvasTransform();
  updateCanvasZoomLabel();
}

// ---- SVG lines ----
function drawCanvasLines(items) {
  const world = document.getElementById('canvas-world');
  if (!world) return;
  let svg = world.querySelector('.canvas-svg');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('canvas-svg');
    world.insertBefore(svg, world.firstChild);
  }

  const defs = `<defs>
    <marker id="canvas-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 0 L 8 4 L 0 8 z" class="canvas-line-arrow"/>
    </marker>
  </defs>`;

  let paths = '';
  items.forEach(item => {
    const ids = Array.isArray(item.linkedCardIds) ? item.linkedCardIds : [];
    if (!ids.length) return;
    const srcPos = canvasPositions[item.id];
    if (!srcPos) return;
    ids.forEach(tid => {
      const tgtPos = canvasPositions[tid];
      if (!tgtPos) return;
      const sx = srcPos.x + 100;
      const sy = srcPos.y + 90;
      const tx = tgtPos.x + 100;
      const ty = tgtPos.y;
      const midY = (sy + ty) / 2;
      paths += `<path class="canvas-line" d="M${sx},${sy} C${sx},${midY} ${tx},${midY} ${tx},${ty}" marker-end="url(#canvas-arrow)"/>`;
    });
  });

  svg.innerHTML = defs + paths;
  // set SVG size to cover world
  const maxX = Math.max(...items.map(i => (canvasPositions[i.id]?.x || 0) + 220), 800);
  const maxY = Math.max(...items.map(i => (canvasPositions[i.id]?.y || 0) + 200), 600);
  svg.setAttribute('width', maxX);
  svg.setAttribute('height', maxY);
  svg.style.width = maxX + 'px';
  svg.style.height = maxY + 'px';
}

// ---- Card drag (touch + pointer) ----
function bindCanvasCardDrag() {
  const world = document.getElementById('canvas-world');
  if (!world) return;

  world.querySelectorAll('.cn').forEach(el => {
    let dragging = false;
    let startClientX, startClientY;
    let startCardX, startCardY;
    let pointerId = null;
    let tapTimer = null;
    let hasMoved = false;

    el.addEventListener('pointerdown', e => {
      if (e.target.closest('.cn-menu')) return;
      pointerId = e.pointerId;
      startClientX = e.clientX;
      startClientY = e.clientY;
      const id = el.dataset.id;
      const pos = canvasPositions[id] || { x: 0, y: 0 };
      startCardX = pos.x;
      startCardY = pos.y;
      hasMoved = false;

      tapTimer = setTimeout(() => {
        dragging = true;
        el.classList.add('cn-dragging');
        try { el.setPointerCapture(pointerId); } catch (err) {}
        if (navigator.vibrate) navigator.vibrate(6);
      }, 180);
    }, { passive: true });

    el.addEventListener('pointermove', e => {
      if (!dragging) {
        if (Math.hypot(e.clientX - startClientX, e.clientY - startClientY) > 8) {
          clearTimeout(tapTimer);
        }
        return;
      }
      e.preventDefault();
      hasMoved = true;
      const dx = (e.clientX - startClientX) / canvasScale;
      const dy = (e.clientY - startClientY) / canvasScale;
      const id = el.dataset.id;
      const newX = Math.max(0, startCardX + dx);
      const newY = Math.max(0, startCardY + dy);
      canvasPositions[id] = { x: newX, y: newY };
      el.style.left = newX + 'px';
      el.style.top = newY + 'px';
      // redraw lines
      const board = canvasActiveBoard ? cards.find(c => c.id === canvasActiveBoard) : null;
      const items = canvasActiveBoard ? (board ? board.subcards || [] : []) : cards;
      drawCanvasLines(items);
    });

    const finish = () => {
      clearTimeout(tapTimer);
      if (!dragging) {
        // tap → open card
        if (!hasMoved) {
          const id = el.dataset.id;
          if (canvasActiveBoard) {
            openSubcardEdit(id);
          } else {
            openBoard(id);
          }
        }
        return;
      }
      el.classList.remove('cn-dragging');
      dragging = false;
      saveCanvasData();
    };

    el.addEventListener('pointerup', finish);
    el.addEventListener('pointercancel', () => {
      clearTimeout(tapTimer);
      el.classList.remove('cn-dragging');
      dragging = false;
    });
  });
}

// ---- Pan + Pinch zoom ----
function bindCanvasPanZoom() {
  const vp = document.getElementById('view-canvas');
  if (!vp || vp.dataset.panBound) return;
  vp.dataset.panBound = '1';

  let isPanning = false;
  let panStartX = 0, panStartY = 0;
  let panOriginX = 0, panOriginY = 0;
  let touches = [];
  let lastPinchDist = 0;
  let lastPinchMidX = 0, lastPinchMidY = 0;

  function getTouchDist(t) {
    const dx = t[0].clientX - t[1].clientX;
    const dy = t[0].clientY - t[1].clientY;
    return Math.hypot(dx, dy);
  }

  vp.addEventListener('touchstart', e => {
    touches = Array.from(e.touches);
    if (touches.length === 2) {
      lastPinchDist = getTouchDist(touches);
      lastPinchMidX = (touches[0].clientX + touches[1].clientX) / 2;
      lastPinchMidY = (touches[0].clientY + touches[1].clientY) / 2;
    }
  }, { passive: true });

  vp.addEventListener('touchmove', e => {
    const ts = Array.from(e.touches);
    if (ts.length === 2) {
      e.preventDefault();
      const dist = getTouchDist(ts);
      const midX = (ts[0].clientX + ts[1].clientX) / 2;
      const midY = (ts[0].clientY + ts[1].clientY) / 2;

      // pan
      canvasX += midX - lastPinchMidX;
      canvasY += midY - lastPinchMidY;

      // zoom
      const ratio = dist / lastPinchDist;
      const newScale = Math.min(3, Math.max(0.2, canvasScale * ratio));

      // zoom toward pinch midpoint
      const rect = vp.getBoundingClientRect();
      const ox = midX - rect.left;
      const oy = midY - rect.top;
      canvasX = ox - (ox - canvasX) * (newScale / canvasScale);
      canvasY = oy - (oy - canvasY) * (newScale / canvasScale);
      canvasScale = newScale;

      lastPinchDist = dist;
      lastPinchMidX = midX;
      lastPinchMidY = midY;

      applyCanvasTransform();
      updateCanvasZoomLabel();
    }
  }, { passive: false });

  // Pointer-based pan (when not dragging a card)
  vp.addEventListener('pointerdown', e => {
    if (e.target.closest('.cn') || e.target.closest('.canvas-toolbar') ||
        e.target.closest('.canvas-back') || e.target.closest('.canvas-ctx') ||
        e.target.closest('.canvas-color-popup')) return;
    isPanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    panOriginX = canvasX;
    panOriginY = canvasY;
    vp.style.cursor = 'grabbing';
  }, { passive: true });

  vp.addEventListener('pointermove', e => {
    if (!isPanning) return;
    canvasX = panOriginX + (e.clientX - panStartX);
    canvasY = panOriginY + (e.clientY - panStartY);
    applyCanvasTransform();
  });

  vp.addEventListener('pointerup', () => { isPanning = false; vp.style.cursor = ''; });
  vp.addEventListener('pointercancel', () => { isPanning = false; vp.style.cursor = ''; });

  // Wheel zoom (desktop)
  vp.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.ctrlKey ? e.deltaY : e.deltaY * 0.5;
    const ratio = Math.pow(0.999, delta);
    const newScale = Math.min(3, Math.max(0.2, canvasScale * ratio));
    const rect = vp.getBoundingClientRect();
    const ox = e.clientX - rect.left;
    const oy = e.clientY - rect.top;
    canvasX = ox - (ox - canvasX) * (newScale / canvasScale);
    canvasY = oy - (oy - canvasY) * (newScale / canvasScale);
    canvasScale = newScale;
    applyCanvasTransform();
    updateCanvasZoomLabel();
  }, { passive: false });
}

// ---- Canvas context menu ----
function openCanvasCtx(e, id, kind) {
  e.stopPropagation();
  canvasCtxTarget = id;
  canvasCtxKind = kind;
  const m = document.getElementById('canvas-ctx');
  m.classList.add('open');
  let x = e.clientX, y = e.clientY;
  if (x + 190 > innerWidth) x = innerWidth - 192;
  if (y + 180 > innerHeight - 60) y = y - 180;
  m.style.left = x + 'px';
  m.style.top = y + 'px';
}

function closeCanvasCtx() {
  document.getElementById('canvas-ctx').classList.remove('open');
}

function canvasCtxEdit() {
  closeCanvasCtx();
  if (canvasCtxKind === 'subcard') {
    openSubcardEdit(canvasCtxTarget);
  } else {
    openEdit(canvasCtxTarget);
  }
}

function canvasCtxColor() {
  closeCanvasCtx();
  canvasColorTarget = canvasCtxTarget;
  const popup = document.getElementById('canvas-color-popup');
  const el = document.querySelector(`.cn[data-id="${canvasCtxTarget}"]`);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  popup.classList.add('open');
  popup.style.left = Math.min(rect.left, innerWidth - 190) + 'px';
  popup.style.top = (rect.top - 60) + 'px';
}

function applyCanvasColor(colorName) {
  if (!canvasColorTarget) return;
  canvasCardColors[canvasColorTarget] = colorName;
  saveCanvasData();
  document.getElementById('canvas-color-popup').classList.remove('open');
  // update live
  const el = document.querySelector(`.cn[data-id="${canvasColorTarget}"]`);
  if (el) {
    CANVAS_COLORS.forEach(c => { if (c.name !== 'default') el.removeAttribute('data-color'); });
    el.dataset.color = colorName;
  }
  // full re-render to be safe
  renderCanvas();
}

function canvasCtxOpenBoard() {
  closeCanvasCtx();
  openBoard(canvasCtxTarget);
}

function canvasCtxDel() {
  closeCanvasCtx();
  if (canvasCtxKind === 'subcard') {
    delSubcard(canvasCtxTarget);
    renderCanvas();
  } else {
    delCard(canvasCtxTarget);
    delete canvasPositions[canvasCtxTarget];
    saveCanvasData();
    renderCanvas();
  }
}

// dismiss ctx on outside tap
document.addEventListener('click', e => {
  if (!e.target.closest('#canvas-ctx') && !e.target.closest('.cn-menu')) {
    document.getElementById('canvas-ctx')?.classList.remove('open');
  }
  if (!e.target.closest('#canvas-color-popup') && !e.target.closest('.cn-menu')) {
    document.getElementById('canvas-color-popup')?.classList.remove('open');
  }
});

// ---- Fit all cards into view ----
function canvasFitAll() {
  const world = document.getElementById('canvas-world');
  const vp = document.getElementById('view-canvas');
  if (!world || !vp) return;

  const board = canvasActiveBoard ? cards.find(c => c.id === canvasActiveBoard) : null;
  const items = canvasActiveBoard ? (board ? board.subcards || [] : []) : cards;
  if (!items.length) return;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  items.forEach(item => {
    const p = canvasPositions[item.id];
    if (!p) return;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x + 210);
    maxY = Math.max(maxY, p.y + 180);
  });

  const vpW = vp.clientWidth;
  const vpH = vp.clientHeight;
  const contentW = maxX - minX + 40;
  const contentH = maxY - minY + 40;
  const scale = Math.min(1, Math.min(vpW / contentW, vpH / contentH));
  canvasScale = scale;
  canvasX = (vpW - contentW * scale) / 2 - minX * scale + 20 * scale;
  canvasY = (vpH - contentH * scale) / 2 - minY * scale + 20 * scale;
  applyCanvasTransform();
  updateCanvasZoomLabel();
}

// ---- Button to open canvas from board view ----
function openBoardCanvas() {
  openCanvas(activeBoardId);
}

// init: load canvas data once
loadCanvasData();
