/* ============================================================
   Trille Canvas v2 — Miro-style board view
   Fixes: back button, stale content, card detail no-edit,
   link cards from canvas, + Miro features (post-it, text,
   shapes, lines, frames, uploads)
   ============================================================ */

// ---- State ----
let canvasScale = 1;
let canvasX = 0;
let canvasY = 0;
let canvasPositions = {};
let canvasActiveBoard = null;
let canvasCtxTarget = null;
let canvasCtxKind = null;
let canvasColorTarget = null;
let canvasCardColors = {};

// Miro-style sticky notes / shapes / text / lines / frames
let canvasStickyNotes = [];   // {id, x, y, text, color, w, h}
let canvasTextBlocks  = [];   // {id, x, y, text, fontSize, bold}
let canvasShapes      = [];   // {id, x, y, w, h, shape:'rect'|'circle'|'diamond', color, strokeColor}
let canvasLines       = [];   // {id, x1,y1,x2,y2, style:'solid'|'dashed'|'arrow', color}
let canvasFrames      = [];   // {id, x, y, w, h, label}
let canvasUploads     = [];   // {id, x, y, w, h, src, name}

// link mode
let canvasLinkMode = false;
let canvasLinkSource = null;

// active tool
let canvasActiveTool = 'select'; // select | sticky | text | shape | line | frame | upload

const CANVAS_COLORS = [
  { name: 'default', bg: '#ffffff', dark: '#1c1c1e', label: 'White' },
  { name: 'yellow',  bg: '#fffbe6', dark: '#2a2510', label: 'Yellow' },
  { name: 'pink',    bg: '#fff0f5', dark: '#28101a', label: 'Pink' },
  { name: 'green',   bg: '#f0faf2', dark: '#0f2015', label: 'Green' },
  { name: 'blue',    bg: '#edf4ff', dark: '#0f1c2e', label: 'Blue' },
  { name: 'purple',  bg: '#f5f0ff', dark: '#1a1028', label: 'Purple' },
  { name: 'orange',  bg: '#fff7ed', dark: '#251a08', label: 'Orange' },
];

const STICKY_COLORS = {
  yellow: '#fff9c4', pink: '#f8bbd0', blue: '#bbdefb',
  green: '#c8e6c9', purple: '#e1bee7', orange: '#ffe0b2', white: '#ffffff'
};

// ---- Persistence ----
function saveCanvasData() {
  localStorage.setItem('t-canvas-pos',    JSON.stringify(canvasPositions));
  localStorage.setItem('t-canvas-colors', JSON.stringify(canvasCardColors));
  localStorage.setItem('t-canvas-sticky', JSON.stringify(canvasStickyNotes));
  localStorage.setItem('t-canvas-text',   JSON.stringify(canvasTextBlocks));
  localStorage.setItem('t-canvas-shapes', JSON.stringify(canvasShapes));
  localStorage.setItem('t-canvas-lines',  JSON.stringify(canvasLines));
  localStorage.setItem('t-canvas-frames', JSON.stringify(canvasFrames));
  localStorage.setItem('t-canvas-uploads',JSON.stringify(canvasUploads));
}

function loadCanvasData() {
  function safe(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; }
    catch(e) { return fallback; }
  }
  canvasPositions   = safe('t-canvas-pos', {});
  canvasCardColors  = safe('t-canvas-colors', {});
  canvasStickyNotes = safe('t-canvas-sticky', []);
  canvasTextBlocks  = safe('t-canvas-text', []);
  canvasShapes      = safe('t-canvas-shapes', []);
  canvasLines       = safe('t-canvas-lines', []);
  canvasFrames      = safe('t-canvas-frames', []);
  canvasUploads     = safe('t-canvas-uploads', []);
}

// ---- Layout helpers ----
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
  canvasActiveTool = 'select';
  canvasLinkMode = false;
  canvasLinkSource = null;

  if (canvasActiveBoard) {
    const board = cards.find(c => c.id === canvasActiveBoard);
    if (board) autoLayout(board.subcards || [], 20, 20, 240, 200, 2);
  } else {
    autoLayout(cards, 20, 20, 240, 230, 2);
  }

  // ---- FIX 2: clear world before switching views ----
  const world = document.getElementById('canvas-world');
  if (world) world.innerHTML = '';

  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.getElementById('view-canvas').classList.add('active');
  document.querySelectorAll('.nbtn').forEach(b => b.classList.remove('active'));

  updateCanvasToolbar();
  renderCanvas();
}

// ---- FIX 1: Back button ----
function closeCanvas() {
  document.getElementById('canvas-ctx')?.classList.remove('open');
  document.getElementById('canvas-color-popup')?.classList.remove('open');
  document.getElementById('canvas-link-popup')?.classList.remove('open');

  const prevBoard = canvasActiveBoard;
  canvasActiveBoard = null;

  if (prevBoard) {
    // came from board view
    openBoard(prevBoard);
  } else {
    // came from home
    goHome();
  }
}

// ---- Render ----
function renderCanvas() {
  const world = document.getElementById('canvas-world');
  if (!world) return;

  const board = canvasActiveBoard ? cards.find(c => c.id === canvasActiveBoard) : null;
  const items = canvasActiveBoard ? (board ? board.subcards || [] : []) : cards;

  const titleEl = document.getElementById('canvas-board-title');
  if (titleEl) titleEl.textContent = board ? board.title : 'Overview';

  let html = '';

  // --- Frames (behind everything) ---
  canvasFrames.forEach(fr => {
    html += `<div class="cn-frame" data-frid="${fr.id}"
      style="left:${fr.x}px;top:${fr.y}px;width:${fr.w}px;height:${fr.h}px;"
    >
      <div class="cn-frame-label">${esc(fr.label || 'Frame')}</div>
      <button class="cn-obj-del" onclick="deleteCanvasObj('frame','${fr.id}')">×</button>
    </div>`;
  });

  // --- Card nodes ---
  items.forEach((item, i) => {
    const pos = canvasPositions[item.id] || { x: 20 + (i % 3) * 240, y: 20 + Math.floor(i / 3) * 200 };
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

    // Link button (shown in link mode)
    const linkBtn = canvasLinkMode && canvasLinkSource !== item.id
      ? `<button class="cn-link-target" onclick="canvasLinkTo('${item.id}')">Link here</button>`
      : '';

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
      ${linkBtn}
    </div>`;
  });

  // --- Shapes ---
  canvasShapes.forEach(sh => {
    const shapeInner = sh.shape === 'circle'
      ? `<svg width="100%" height="100%" style="position:absolute;inset:0"><ellipse cx="50%" cy="50%" rx="49%" ry="49%" fill="${sh.color||'#e0e0e0'}" stroke="${sh.strokeColor||'#999'}" stroke-width="2"/></svg>`
      : sh.shape === 'diamond'
      ? `<svg width="100%" height="100%" style="position:absolute;inset:0"><polygon points="50%,2 98%,50% 50%,98% 2%,50%" fill="${sh.color||'#e0e0e0'}" stroke="${sh.strokeColor||'#999'}" stroke-width="2"/></svg>`
      : '';
    const bgStyle = sh.shape === 'rect' ? `background:${sh.color||'#e0e0e0'};border:2px solid ${sh.strokeColor||'#999'};border-radius:8px;` : '';
    html += `<div class="cn-shape" data-shid="${sh.id}"
      style="left:${sh.x}px;top:${sh.y}px;width:${sh.w||120}px;height:${sh.h||80}px;${bgStyle}position:absolute;cursor:grab;box-sizing:border-box;"
    >${shapeInner}<button class="cn-obj-del" onclick="deleteCanvasObj('shape','${sh.id}')">×</button></div>`;
  });

  // --- Sticky notes ---
  canvasStickyNotes.forEach(sn => {
    html += `<div class="cn-sticky" data-snid="${sn.id}"
      style="left:${sn.x}px;top:${sn.y}px;width:${sn.w||160}px;min-height:${sn.h||120}px;background:${STICKY_COLORS[sn.color]||STICKY_COLORS.yellow};"
    >
      <div class="cn-sticky-text" contenteditable="true"
        onblur="updateStickyText('${sn.id}', this.innerText)"
        onpointerdown="event.stopPropagation()"
      >${esc(sn.text || 'Double-tap to edit')}</div>
      <button class="cn-obj-del" onclick="deleteCanvasObj('sticky','${sn.id}')">×</button>
    </div>`;
  });

  // --- Text blocks ---
  canvasTextBlocks.forEach(tb => {
    html += `<div class="cn-textblock" data-tbid="${tb.id}"
      style="left:${tb.x}px;top:${tb.y}px;font-size:${tb.fontSize||16}px;font-weight:${tb.bold?700:400};"
    >
      <div class="cn-textblock-inner" contenteditable="true"
        onblur="updateTextBlock('${tb.id}', this.innerText)"
        onpointerdown="event.stopPropagation()"
      >${esc(tb.text || 'Text')}</div>
      <button class="cn-obj-del" onclick="deleteCanvasObj('text','${tb.id}')">×</button>
    </div>`;
  });

  // --- Uploads ---
  canvasUploads.forEach(up => {
    html += `<div class="cn-upload" data-upid="${up.id}"
      style="left:${up.x}px;top:${up.y}px;width:${up.w||200}px;height:${up.h||150}px;"
    >
      <img src="${up.src}" alt="${esc(up.name||'')}" style="width:100%;height:100%;object-fit:contain;border-radius:10px;pointer-events:none;"/>
      <button class="cn-obj-del" onclick="deleteCanvasObj('upload','${up.id}')">×</button>
    </div>`;
  });

  world.innerHTML = html;

  applyCanvasTransform();
  drawAllCanvasLines(items);
  bindCanvasCardDrag();
  bindCanvasObjDrag();
  bindCanvasPanZoom();
  updateCanvasZoomLabel();
  updateCanvasToolbar();

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
  if (world) world.style.transform = `translate(${canvasX}px,${canvasY}px) scale(${canvasScale})`;
}

function updateCanvasZoomLabel() {
  const el = document.getElementById('canvas-zoom-label');
  if (el) el.textContent = Math.round(canvasScale * 100) + '%';
}

function canvasZoomIn()    { canvasScale = Math.min(3, canvasScale * 1.2); applyCanvasTransform(); updateCanvasZoomLabel(); }
function canvasZoomOut()   { canvasScale = Math.max(0.2, canvasScale / 1.2); applyCanvasTransform(); updateCanvasZoomLabel(); }
function canvasZoomReset() { canvasScale = 1; canvasX = 0; canvasY = 0; applyCanvasTransform(); updateCanvasZoomLabel(); }

// ---- Draw lines (card links + freehand lines) ----
function drawAllCanvasLines(items) {
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

  // Card link lines
  items.forEach(item => {
    const ids = Array.isArray(item.linkedCardIds) ? item.linkedCardIds : [];
    if (!ids.length) return;
    const srcPos = canvasPositions[item.id];
    if (!srcPos) return;
    ids.forEach(tid => {
      const tgtPos = canvasPositions[tid];
      if (!tgtPos) return;
      const sx = srcPos.x + 100, sy = srcPos.y + 110;
      const tx = tgtPos.x + 100, ty = tgtPos.y;
      const midY = (sy + ty) / 2;
      paths += `<path class="canvas-line" d="M${sx},${sy} C${sx},${midY} ${tx},${midY} ${tx},${ty}" marker-end="url(#canvas-arrow)"/>`;
    });
  });

  // Freehand lines
  canvasLines.forEach(ln => {
    const stroke = ln.color || '#666';
    const dash = ln.style === 'dashed' ? 'stroke-dasharray="8 4"' : '';
    const marker = (ln.style === 'arrow') ? 'marker-end="url(#canvas-arrow)"' : '';
    paths += `<line x1="${ln.x1}" y1="${ln.y1}" x2="${ln.x2}" y2="${ln.y2}" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" ${dash} ${marker}/>
      <g class="canvas-line-del" onclick="deleteCanvasObj('line','${ln.id}')" style="cursor:pointer">
        <circle cx="${(ln.x1+ln.x2)/2}" cy="${(ln.y1+ln.y2)/2}" r="8" fill="white" stroke="#ccc" stroke-width="1"/>
        <text x="${(ln.x1+ln.x2)/2}" y="${(ln.y1+ln.y2)/2+4}" text-anchor="middle" font-size="12" fill="#999">×</text>
      </g>`;
  });

  // If line-drawing mode is active and dragging
  if (window._lineDrawing) {
    const ld = window._lineDrawing;
    paths += `<line x1="${ld.x1}" y1="${ld.y1}" x2="${ld.x2}" y2="${ld.y2}" stroke="#4a90d9" stroke-width="2" stroke-dasharray="6 3" stroke-linecap="round"/>`;
  }

  const maxX = Math.max(...items.map(i => (canvasPositions[i.id]?.x || 0) + 220), ...canvasLines.map(l => Math.max(l.x1, l.x2)), 800);
  const maxY = Math.max(...items.map(i => (canvasPositions[i.id]?.y || 0) + 200), ...canvasLines.map(l => Math.max(l.y1, l.y2)), 600);
  svg.setAttribute('width', maxX); svg.setAttribute('height', maxY);
  svg.style.width = maxX + 'px'; svg.style.height = maxY + 'px';
  svg.innerHTML = defs + paths;
}

// ---- Card drag ----
function bindCanvasCardDrag() {
  const world = document.getElementById('canvas-world');
  if (!world) return;

  world.querySelectorAll('.cn').forEach(el => {
    let dragging = false, startClientX, startClientY, startCardX, startCardY, pointerId = null, tapTimer = null, hasMoved = false;

    el.addEventListener('pointerdown', e => {
      if (canvasActiveTool !== 'select') return;
      if (e.target.closest('.cn-menu,.cn-link-target')) return;
      pointerId = e.pointerId;
      startClientX = e.clientX; startClientY = e.clientY;
      const id = el.dataset.id;
      const pos = canvasPositions[id] || { x: 0, y: 0 };
      startCardX = pos.x; startCardY = pos.y;
      hasMoved = false;
      tapTimer = setTimeout(() => {
        dragging = true; el.classList.add('cn-dragging');
        try { el.setPointerCapture(pointerId); } catch (err) {}
        if (navigator.vibrate) navigator.vibrate(6);
      }, 180);
    }, { passive: true });

    el.addEventListener('pointermove', e => {
      if (!dragging) {
        if (Math.hypot(e.clientX - startClientX, e.clientY - startClientY) > 8) { clearTimeout(tapTimer); hasMoved = true; }
        return;
      }
      e.preventDefault(); hasMoved = true;
      const dx = (e.clientX - startClientX) / canvasScale;
      const dy = (e.clientY - startClientY) / canvasScale;
      const id = el.dataset.id;
      const newX = Math.max(0, startCardX + dx), newY = Math.max(0, startCardY + dy);
      canvasPositions[id] = { x: newX, y: newY };
      el.style.left = newX + 'px'; el.style.top = newY + 'px';
      const board = canvasActiveBoard ? cards.find(c => c.id === canvasActiveBoard) : null;
      drawAllCanvasLines(canvasActiveBoard ? (board ? board.subcards || [] : []) : cards);
    });

    const finish = () => {
      clearTimeout(tapTimer);
      if (!dragging) {
        if (!hasMoved) {
          const id = el.dataset.id;
          if (canvasLinkMode && canvasLinkSource && canvasLinkSource !== id) {
            canvasLinkTo(id); return;
          }
          canvasActiveBoard ? openCanvasSubcardDetail(id) : openBoard(id);
        }
        return;
      }
      el.classList.remove('cn-dragging'); dragging = false; saveCanvasData();
    };

    el.addEventListener('pointerup', finish);
    el.addEventListener('pointercancel', () => { clearTimeout(tapTimer); el.classList.remove('cn-dragging'); dragging = false; });
  });
}

// ---- Generic object drag (sticky, text, shape, upload) ----
function bindCanvasObjDrag() {
  const world = document.getElementById('canvas-world');
  if (!world) return;

  const selectors = [
    { sel: '.cn-sticky', arr: canvasStickyNotes, key: 'snid', save: 'sticky' },
    { sel: '.cn-textblock', arr: canvasTextBlocks, key: 'tbid', save: 'text' },
    { sel: '.cn-shape', arr: canvasShapes, key: 'shid', save: 'shape' },
    { sel: '.cn-upload', arr: canvasUploads, key: 'upid', save: 'upload' },
    { sel: '.cn-frame', arr: canvasFrames, key: 'frid', save: 'frame' },
  ];

  selectors.forEach(({ sel, arr, key }) => {
    world.querySelectorAll(sel).forEach(el => {
      let dragging = false, sx, sy, ox, oy, pid;

      el.addEventListener('pointerdown', e => {
        if (canvasActiveTool !== 'select') return;
        if (e.target.closest('.cn-obj-del,.cn-sticky-text,.cn-textblock-inner')) return;
        pid = e.pointerId; sx = e.clientX; sy = e.clientY;
        const id = el.dataset[key];
        const obj = arr.find(o => o.id === id);
        if (!obj) return;
        ox = obj.x; oy = obj.y; dragging = true;
        try { el.setPointerCapture(pid); } catch(err) {}
      }, { passive: true });

      el.addEventListener('pointermove', e => {
        if (!dragging) return;
        e.preventDefault();
        const dx = (e.clientX - sx) / canvasScale, dy = (e.clientY - sy) / canvasScale;
        const id = el.dataset[key];
        const obj = arr.find(o => o.id === id);
        if (!obj) return;
        obj.x = Math.max(0, ox + dx); obj.y = Math.max(0, oy + dy);
        el.style.left = obj.x + 'px'; el.style.top = obj.y + 'px';
      });

      el.addEventListener('pointerup', () => { dragging = false; saveCanvasData(); });
      el.addEventListener('pointercancel', () => { dragging = false; });
    });
  });
}

// ---- Pan + Pinch zoom ----
function bindCanvasPanZoom() {
  const vp = document.getElementById('canvas-vp');
  if (!vp || vp.dataset.panBound) return;
  vp.dataset.panBound = '1';

  let isPanning = false, panStartX = 0, panStartY = 0, panOriginX = 0, panOriginY = 0, lastPinchDist = 0, lastPinchMidX = 0, lastPinchMidY = 0;
  let lineDrawStart = null;

  function getTouchDist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }

  vp.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      lastPinchDist = getTouchDist(Array.from(e.touches));
      lastPinchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      lastPinchMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    }
  }, { passive: true });

  vp.addEventListener('touchmove', e => {
    const ts = Array.from(e.touches);
    if (ts.length === 2) {
      e.preventDefault();
      const dist = getTouchDist(ts), midX = (ts[0].clientX + ts[1].clientX) / 2, midY = (ts[0].clientY + ts[1].clientY) / 2;
      canvasX += midX - lastPinchMidX; canvasY += midY - lastPinchMidY;
      const ratio = dist / lastPinchDist;
      const newScale = Math.min(3, Math.max(0.2, canvasScale * ratio));
      const rect = vp.getBoundingClientRect();
      const ox = midX - rect.left, oy = midY - rect.top;
      canvasX = ox - (ox - canvasX) * (newScale / canvasScale);
      canvasY = oy - (oy - canvasY) * (newScale / canvasScale);
      canvasScale = newScale; lastPinchDist = dist; lastPinchMidX = midX; lastPinchMidY = midY;
      applyCanvasTransform(); updateCanvasZoomLabel();
    }
  }, { passive: false });

  vp.addEventListener('pointerdown', e => {
    if (e.target.closest('.cn,.cn-sticky,.cn-textblock,.cn-shape,.cn-upload,.cn-frame')) return;

    if (canvasActiveTool === 'line') {
      const rect = vp.getBoundingClientRect();
      const wx = (e.clientX - rect.left - canvasX) / canvasScale;
      const wy = (e.clientY - rect.top - canvasY) / canvasScale;
      lineDrawStart = { x: wx, y: wy, cx: e.clientX, cy: e.clientY };
      window._lineDrawing = { x1: wx, y1: wy, x2: wx, y2: wy };
      return;
    }

    if (canvasActiveTool === 'select') {
      isPanning = true; panStartX = e.clientX; panStartY = e.clientY; panOriginX = canvasX; panOriginY = canvasY;
      vp.style.cursor = 'grabbing';
    }
  }, { passive: true });

  vp.addEventListener('pointermove', e => {
    if (lineDrawStart && canvasActiveTool === 'line') {
      const rect = vp.getBoundingClientRect();
      const wx = (e.clientX - rect.left - canvasX) / canvasScale;
      const wy = (e.clientY - rect.top - canvasY) / canvasScale;
      window._lineDrawing = { x1: lineDrawStart.x, y1: lineDrawStart.y, x2: wx, y2: wy };
      const board = canvasActiveBoard ? cards.find(c => c.id === canvasActiveBoard) : null;
      drawAllCanvasLines(canvasActiveBoard ? (board?.subcards || []) : cards);
      return;
    }
    if (!isPanning) return;
    canvasX = panOriginX + (e.clientX - panStartX);
    canvasY = panOriginY + (e.clientY - panStartY);
    applyCanvasTransform();
  });

  vp.addEventListener('pointerup', e => {
    if (lineDrawStart && canvasActiveTool === 'line') {
      const rect = vp.getBoundingClientRect();
      const wx = (e.clientX - rect.left - canvasX) / canvasScale;
      const wy = (e.clientY - rect.top - canvasY) / canvasScale;
      const dist = Math.hypot(wx - lineDrawStart.x, wy - lineDrawStart.y);
      if (dist > 10) {
        canvasLines.push({ id: uid(), x1: lineDrawStart.x, y1: lineDrawStart.y, x2: wx, y2: wy, style: 'arrow', color: '#666' });
        saveCanvasData();
        renderCanvas();
      }
      window._lineDrawing = null;
      lineDrawStart = null;
      return;
    }
    isPanning = false; vp.style.cursor = '';

    // Click on empty canvas to place objects
    if (canvasActiveTool !== 'select') {
      const rect = vp.getBoundingClientRect();
      const wx = (e.clientX - rect.left - canvasX) / canvasScale;
      const wy = (e.clientY - rect.top - canvasY) / canvasScale;
      placeCanvasObject(canvasActiveTool, wx, wy);
    }
  });

  vp.addEventListener('pointercancel', () => { isPanning = false; vp.style.cursor = ''; window._lineDrawing = null; lineDrawStart = null; });

  vp.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.ctrlKey ? e.deltaY : e.deltaY * 0.5;
    const ratio = Math.pow(0.999, delta);
    const newScale = Math.min(3, Math.max(0.2, canvasScale * ratio));
    const rect = vp.getBoundingClientRect();
    const ox = e.clientX - rect.left, oy = e.clientY - rect.top;
    canvasX = ox - (ox - canvasX) * (newScale / canvasScale);
    canvasY = oy - (oy - canvasY) * (newScale / canvasScale);
    canvasScale = newScale; applyCanvasTransform(); updateCanvasZoomLabel();
  }, { passive: false });
}

// ---- Place objects ----
function placeCanvasObject(tool, wx, wy) {
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
      // Trigger file upload dialog
      document.getElementById('canvas-upload-input')?.click();
      window._canvasUploadPos = { x: wx - 100, y: wy - 75 };
      return;
  }
  saveCanvasData();
  setCanvasTool('select');
  renderCanvas();
}

// ---- Tool selection ----
function setCanvasTool(tool) {
  canvasActiveTool = tool;
  canvasLinkMode = false;
  updateCanvasToolbar();
  const vp = document.getElementById('canvas-vp');
  if (vp) {
    const cursors = { select: '', sticky: 'crosshair', text: 'text', shape: 'crosshair', line: 'crosshair', frame: 'crosshair', upload: 'default' };
    vp.style.cursor = cursors[tool] || '';
  }
}

function updateCanvasToolbar() {
  document.querySelectorAll('.canvas-tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === canvasActiveTool);
  });
  const linkBtn = document.getElementById('canvas-link-btn');
  if (linkBtn) linkBtn.classList.toggle('active', canvasLinkMode);
}

// ---- Link mode (FIX 5) ----
function startCanvasLinkMode(sourceId) {
  canvasLinkMode = true;
  canvasLinkSource = sourceId;
  canvasActiveTool = 'select';
  toast('Tap another card to link →');
  renderCanvas();
}

function canvasLinkTo(targetId) {
  if (!canvasLinkSource || !targetId || canvasLinkSource === targetId) {
    canvasLinkMode = false; canvasLinkSource = null; renderCanvas(); return;
  }

  // Find source item
  const board = canvasActiveBoard ? cards.find(c => c.id === canvasActiveBoard) : null;
  const items = canvasActiveBoard ? (board?.subcards || []) : cards;
  const srcItem = items.find(i => i.id === canvasLinkSource);
  if (srcItem) {
    if (!Array.isArray(srcItem.linkedCardIds)) srcItem.linkedCardIds = [];
    if (!srcItem.linkedCardIds.includes(targetId)) {
      srcItem.linkedCardIds.push(targetId);
    }
  }

  save();
  canvasLinkMode = false; canvasLinkSource = null;
  toast('Cards linked!');
  renderCanvas();
}

function cancelCanvasLink() {
  canvasLinkMode = false; canvasLinkSource = null;
  renderCanvas();
}

// ---- Delete objects ----
function deleteCanvasObj(type, id) {
  switch(type) {
    case 'sticky':  canvasStickyNotes = canvasStickyNotes.filter(o => o.id !== id); break;
    case 'text':    canvasTextBlocks  = canvasTextBlocks.filter(o => o.id !== id); break;
    case 'shape':   canvasShapes      = canvasShapes.filter(o => o.id !== id); break;
    case 'line':    canvasLines       = canvasLines.filter(o => o.id !== id); break;
    case 'frame':   canvasFrames      = canvasFrames.filter(o => o.id !== id); break;
    case 'upload':  canvasUploads     = canvasUploads.filter(o => o.id !== id); break;
  }
  saveCanvasData(); renderCanvas();
}

// ---- Update content ----
function updateStickyText(id, text) {
  const sn = canvasStickyNotes.find(o => o.id === id);
  if (sn) { sn.text = text; saveCanvasData(); }
}

function updateTextBlock(id, text) {
  const tb = canvasTextBlocks.find(o => o.id === id);
  if (tb) { tb.text = text; saveCanvasData(); }
}

// ---- Upload handler ----
function handleCanvasUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const pos = window._canvasUploadPos || { x: 40, y: 40 };
    canvasUploads.push({ id: uid(), x: pos.x, y: pos.y, w: 200, h: 150, src: reader.result, name: file.name });
    saveCanvasData(); renderCanvas();
    window._canvasUploadPos = null;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

// ---- Shape type picker ----
function showShapePicker(e) {
  e.stopPropagation();
  const popup = document.getElementById('canvas-shape-popup');
  if (!popup) return;
  popup.classList.toggle('open');
}

function selectShape(shape) {
  window._canvasShapeType = shape;
  document.getElementById('canvas-shape-popup')?.classList.remove('open');
  setCanvasTool('shape');
}

// ---- Sticky color ----
function setStickyColorPalette(colorName) {
  window._canvasStickyColor = colorName;
}

// ---- Canvas context menu ----
function openCanvasCtx(e, id, kind) {
  e.stopPropagation();
  canvasCtxTarget = id; canvasCtxKind = kind;
  const m = document.getElementById('canvas-ctx');
  m.classList.add('open');
  let x = e.clientX, y = e.clientY;
  if (x + 200 > innerWidth) x = innerWidth - 202;
  if (y + 220 > innerHeight - 60) y = y - 220;
  m.style.left = x + 'px'; m.style.top = y + 'px';

  // Show/hide link to board option
  const openBoardBtn = document.getElementById('canvas-ctx-open-board');
  if (openBoardBtn) openBoardBtn.style.display = kind === 'board' ? 'flex' : 'none';
}

function closeCanvasCtx() { document.getElementById('canvas-ctx').classList.remove('open'); }
function canvasCtxEdit() { closeCanvasCtx(); canvasCtxKind === 'subcard' ? openSubcardEdit(canvasCtxTarget) : openEdit(canvasCtxTarget); }
function canvasCtxColor() {
  closeCanvasCtx();
  canvasColorTarget = canvasCtxTarget;
  const popup = document.getElementById('canvas-color-popup');
  const el = document.querySelector(`.cn[data-id="${canvasCtxTarget}"]`);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  popup.classList.add('open');
  popup.style.left = Math.min(rect.left, innerWidth - 200) + 'px';
  popup.style.top = (rect.top - 60) + 'px';
}

function applyCanvasColor(colorName) {
  if (!canvasColorTarget) return;
  canvasCardColors[canvasColorTarget] = colorName;
  saveCanvasData();
  document.getElementById('canvas-color-popup').classList.remove('open');
  const el = document.querySelector(`.cn[data-id="${canvasColorTarget}"]`);
  if (el) el.dataset.color = colorName;
  renderCanvas();
}

function canvasCtxOpenBoard() { closeCanvasCtx(); openBoard(canvasCtxTarget); }

// FIX 5: Link from context menu
function canvasCtxLink() {
  closeCanvasCtx();
  startCanvasLinkMode(canvasCtxTarget);
}

function canvasCtxDel() {
  closeCanvasCtx();
  if (canvasCtxKind === 'subcard') {
    delSubcard(canvasCtxTarget); renderCanvas();
  } else {
    delCard(canvasCtxTarget);
    delete canvasPositions[canvasCtxTarget]; saveCanvasData(); renderCanvas();
  }
}

document.addEventListener('click', e => {
  if (!e.target.closest('#canvas-ctx') && !e.target.closest('.cn-menu')) document.getElementById('canvas-ctx')?.classList.remove('open');
  if (!e.target.closest('#canvas-color-popup') && !e.target.closest('.cn-menu')) document.getElementById('canvas-color-popup')?.classList.remove('open');
  if (!e.target.closest('#canvas-shape-popup') && !e.target.closest('[onclick^="showShapePicker"]')) document.getElementById('canvas-shape-popup')?.classList.remove('open');
});

// ---- Fit all ----
function canvasFitAll() {
  const vp = document.getElementById('canvas-vp');
  if (!vp) return;
  const board = canvasActiveBoard ? cards.find(c => c.id === canvasActiveBoard) : null;
  const items = canvasActiveBoard ? (board?.subcards || []) : cards;
  if (!items.length) return;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  items.forEach(item => {
    const p = canvasPositions[item.id]; if (!p) return;
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x + 210); maxY = Math.max(maxY, p.y + 180);
  });
  const vpW = vp.clientWidth, vpH = vp.clientHeight;
  const contentW = maxX - minX + 80, contentH = maxY - minY + 80;
  const scale = Math.min(1, Math.min(vpW / contentW, vpH / contentH));
  canvasScale = scale;
  canvasX = (vpW - contentW * scale) / 2 - minX * scale + 40 * scale;
  canvasY = (vpH - contentH * scale) / 2 - minY * scale + 40 * scale;
  applyCanvasTransform(); updateCanvasZoomLabel();
}

// ---- FIX 4: Card detail without edit button ----
function openCanvasSubcardDetail(subId) {
  const board = cards.find(c => c.id === canvasActiveBoard);
  const card = board?.subcards?.find(c => c.id === subId);
  if (!board || !card) return;

  document.getElementById('modal-detail').dataset.cid = subId;
  document.getElementById('modal-detail').dataset.boardId = board.id;
  document.getElementById('d-tag').innerHTML = tagListHTML(card.tags);
  document.getElementById('d-title').textContent = card.title;
  document.getElementById('d-desc').textContent = card.desc || '';

  // Hide edit button when opened from canvas
  const editBtn = document.querySelector('#modal-detail .mhead .icon-btn[onclick="editFromDetail()"]');
  if (editBtn) editBtn.style.display = 'none';

  let body = '';
  if ((card.items || []).length) {
    const done = card.items.filter(i => i.done).length;
    body += `<div class="fg"><label class="fl">Activities — ${done}/${card.items.length}</label><div class="detail-flds">${card.items.map(it => `<div class="detail-cl-item${it.done ? ' done' : ''}"><input type="checkbox" data-board-id="${board.id}" data-sub-id="${card.id}" data-iid="${it.id}" ${it.done ? 'checked' : ''}><span>${esc(it.text)}</span></div>`).join('')}</div></div>`;
  }

  const nf = card.nf || [];
  if (nf.length) body += `<div class="fg"><label class="fl">Fields</label><div class="detail-flds">${nf.map(f => fDisplayHTML(f)).join('')}</div></div>`;
  if (card.note) body += `<div class="fg"><label class="fl">Note</label><div class="card-note">${esc(card.note).replace(/\n/g, '<br>')}</div></div>`;
  // No edit button here (FIX 4) — only link and delete
  body += `<div class="act-row">
    <button class="act-btn" onclick="startCanvasLinkMode('${card.id}');closeModal('modal-detail')">🔗 Link</button>
    <button class="act-btn danger" onclick="delSubcard('${card.id}');closeModal('modal-detail');renderCanvas();">Delete</button>
  </div>`;

  document.getElementById('d-body').innerHTML = body;
  document.querySelectorAll('#d-body .detail-cl-item input').forEach(cb => cb.addEventListener('change', () => {
    toggleSubcardCheck(cb.dataset.boardId, cb.dataset.subId, cb.dataset.iid, cb.checked);
    renderCanvas(); openCanvasSubcardDetail(subId);
  }));
  openModal('modal-detail');
}

// Restore edit button when modal closes normally
document.addEventListener('click', e => {
  if (e.target.closest('#modal-detail .icon-btn[onclick*="closeModal"]') || (e.target === document.getElementById('modal-detail'))) {
    setTimeout(() => {
      const editBtn = document.querySelector('#modal-detail .mhead .icon-btn[onclick="editFromDetail()"]');
      if (editBtn) editBtn.style.display = '';
    }, 250);
  }
});

function openBoardCanvas() { openCanvas(activeBoardId); }

// init
loadCanvasData();
