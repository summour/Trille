function loadCompactBarsStyles(){
  if(document.querySelector('link[data-trille-compact-bars]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='trille-compact-bars.css?v=20260503-dock-low';
  link.dataset.trilleCompactBars='true';
  document.head.appendChild(link);
}

function loadReorderStyles(){
  if(document.querySelector('link[data-trille-reorder]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='trille-reorder.css';
  link.dataset.trilleReorder='true';
  document.head.appendChild(link);
}

function loadCanvasStyles(){
  if(document.querySelector('link[data-trille-canvas]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='trille-canvas.css';
  link.dataset.trilleCanvas='true';
  document.head.appendChild(link);
  // Patch: inline critical canvas/drag overrides
  const patch=document.createElement('link');
  patch.rel='stylesheet';
  patch.href='style-patch.css';
  patch.dataset.trilleCanvasPatch='true';
  document.head.appendChild(patch);
}

function loadAppIconMetadata(){
  if(!document.querySelector('link[rel="icon"]')){
    const favicon=document.createElement('link');
    favicon.rel='icon';
    favicon.type='image/svg+xml';
    favicon.href='app-icon.svg';
    document.head.appendChild(favicon);
  }
  if(!document.querySelector('link[rel="apple-touch-icon"]')){
    const apple=document.createElement('link');
    apple.rel='apple-touch-icon';
    apple.href='app-icon.svg';
    document.head.appendChild(apple);
  }
  if(!document.querySelector('link[rel="manifest"]')){
    const manifest=document.createElement('link');
    manifest.rel='manifest';
    manifest.href='site.webmanifest';
    document.head.appendChild(manifest);
  }
}

function quickAddFromNav(){
  if(curView==='home')openFolderModal();
  else openAdd();
}

function createPlusIcon(){
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('fill','none');
  svg.setAttribute('stroke','currentColor');

  const p1=document.createElementNS(ns,'path');
  p1.setAttribute('d','M12 5v14');

  const p2=document.createElementNS(ns,'path');
  p2.setAttribute('d','M5 12h14');

  svg.appendChild(p1);
  svg.appendChild(p2);
  return svg;
}

function ensureAddButton(){
  if(document.getElementById('nav-add'))return;
  const calendar=document.getElementById('nav-calendar');
  const bnav=document.querySelector('.bnav');
  if(!calendar||!bnav)return;

  const add=document.createElement('button');
  add.id='nav-add';
  add.className='nbtn';
  add.appendChild(createPlusIcon());
  add.onclick=quickAddFromNav;

  bnav.insertBefore(add,calendar);
}

function TrilleCanvasScopeKey(boardId=canvasActiveBoard){
  return boardId?`board:${boardId}`:'overview';
}

function TrilleReadCanvasState(key,fallback){
  try{
    const raw=localStorage.getItem(key);
    return raw?JSON.parse(raw):fallback;
  }catch(err){
    return fallback;
  }
}

function TrilleWriteCanvasState(key,value){
  localStorage.setItem(key,JSON.stringify(value));
}

function TrilleHideCanvasView(){
  const canvasView=document.getElementById('view-canvas');
  if(!canvasView)return;
  canvasView.classList.remove('active');
  canvasView.style.display='none';
  canvasView.style.pointerEvents='none';
}

function installCanvasScopedStorage(){
  if(typeof openCanvas!=='function')return;

  saveCanvasData=function(){
    const scope=TrilleCanvasScopeKey();
    TrilleWriteCanvasState(`t-canvas-pos:${scope}`,canvasPositions);
    TrilleWriteCanvasState(`t-canvas-colors:${scope}`,canvasCardColors);
    TrilleWriteCanvasState(`t-canvas-sticky:${scope}`,canvasStickyNotes);
    TrilleWriteCanvasState(`t-canvas-text:${scope}`,canvasTextBlocks);
    TrilleWriteCanvasState(`t-canvas-shapes:${scope}`,canvasShapes);
    TrilleWriteCanvasState(`t-canvas-lines:${scope}`,canvasLines);
    TrilleWriteCanvasState(`t-canvas-frames:${scope}`,canvasFrames);
    TrilleWriteCanvasState(`t-canvas-uploads:${scope}`,canvasUploads);
  };

  loadCanvasData=function(){
    const scope=TrilleCanvasScopeKey();
    canvasPositions=TrilleReadCanvasState(`t-canvas-pos:${scope}`,{});
    canvasCardColors=TrilleReadCanvasState(`t-canvas-colors:${scope}`,{});
    canvasStickyNotes=TrilleReadCanvasState(`t-canvas-sticky:${scope}`,[]);
    canvasTextBlocks=TrilleReadCanvasState(`t-canvas-text:${scope}`,[]);
    canvasShapes=TrilleReadCanvasState(`t-canvas-shapes:${scope}`,[]);
    canvasLines=TrilleReadCanvasState(`t-canvas-lines:${scope}`,[]);
    canvasFrames=TrilleReadCanvasState(`t-canvas-frames:${scope}`,[]);
    canvasUploads=TrilleReadCanvasState(`t-canvas-uploads:${scope}`,[]);
  };

  openCanvas=function(boardId){
    canvasActiveBoard=boardId||null;
    loadCanvasData();
    canvasScale=1;
    canvasX=0;
    canvasY=0;
    canvasActiveTool='select';
    canvasLinkMode=false;
    canvasLinkSource=null;

    if(canvasActiveBoard){
      const board=cards.find(c=>c.id===canvasActiveBoard);
      if(board)autoLayout(board.subcards||[],20,20,240,200,2);
    }else{
      autoLayout(cards,20,20,240,230,2);
    }

    const world=document.getElementById('canvas-world');
    if(world)world.innerHTML='';

    document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));
    const canvasView=document.getElementById('view-canvas');
    if(canvasView){
      canvasView.style.display='';
      canvasView.style.pointerEvents='';
      canvasView.classList.add('active');
    }
    document.querySelectorAll('.nbtn').forEach(b=>b.classList.remove('active'));

    updateCanvasToolbar();
    renderCanvas();
  };

  closeCanvas=function(){
    document.getElementById('canvas-ctx')?.classList.remove('open');
    document.getElementById('canvas-color-popup')?.classList.remove('open');
    document.getElementById('canvas-link-popup')?.classList.remove('open');

    const prevBoard=canvasActiveBoard;
    canvasActiveBoard=null;
    TrilleHideCanvasView();

    if(prevBoard)openBoard(prevBoard);
    else goHome();
  };
}

// Show/hide "Open board" option in canvas ctx based on kind
document.addEventListener('click',e=>{
  if(e.target.closest('#canvas-ctx')||e.target.closest('.cn-menu')){
    const openBoardBtn=document.getElementById('canvas-ctx-open-board');
    if(openBoardBtn)openBoardBtn.style.display=canvasCtxKind==='board'?'flex':'none';
  }
});

loadCompactBarsStyles();
loadReorderStyles();
loadCanvasStyles();
loadAppIconMetadata();
ensureAddButton();
installCanvasScopedStorage();
init();
