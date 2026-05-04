function loadCompactBarsStyles(){
  if(document.querySelector('link[data-trille-compact-bars]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='trille-compact-bars.css?v=20260503-d';
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
  const patch=document.createElement('link');
  patch.rel='stylesheet';
  patch.href='style-patch.css';
  patch.dataset.trilleCanvasPatch='true';
  document.head.appendChild(patch);
}

function loadCanvasTools(){
  if(document.querySelector('script[data-trille-canvas-tools]'))return;
  const script=document.createElement('script');
  script.src='js/trille-canvas-tools.js?v=20260505-a';
  script.dataset.trilleCanvasTools='true';
  document.body.appendChild(script);
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

function TrilleFindCanvasItem(itemId){
  if(canvasActiveBoard){
    const board=cards.find(c=>c.id===canvasActiveBoard);
    return (board?.subcards||[]).find(item=>item.id===itemId)||null;
  }
  return cards.find(item=>item.id===itemId)||null;
}

function TrilleSaveCanvasLinkData(){
  save();
  renderCanvas();
}

function deleteCanvasCardLink(sourceId,targetId){
  const source=TrilleFindCanvasItem(sourceId);
  if(!source||!Array.isArray(source.linkedCardIds))return;
  source.linkedCardIds=source.linkedCardIds.filter(id=>id!==targetId);
  TrilleSaveCanvasLinkData();
}

function TrilleCanvasLayerDefault(kind,index=0){
  const defaults={frame:20,card:120,shape:180,upload:190,sticky:220,text:230};
  return (defaults[kind]||120)+index;
}

function TrilleCanvasLayerValue(kind,obj,id,index=0){
  const stored=kind==='card'?canvasPositions[id]?.layer:obj?.layer;
  const parsed=Number(stored);
  return Number.isFinite(parsed)&&parsed!==0?parsed:TrilleCanvasLayerDefault(kind,index);
}

function TrilleCanvasObjectGroups(){
  const board=canvasActiveBoard?cards.find(c=>c.id===canvasActiveBoard):null;
  const cardItems=canvasActiveBoard?(board?.subcards||[]):cards;
  return [
    {kind:'frame',items:canvasFrames,selector:'.cn-frame',key:'frid'},
    {kind:'card',items:cardItems,selector:'.cn',key:'id'},
    {kind:'shape',items:canvasShapes,selector:'.cn-shape',key:'shid'},
    {kind:'upload',items:canvasUploads,selector:'.cn-upload',key:'upid'},
    {kind:'sticky',items:canvasStickyNotes,selector:'.cn-sticky',key:'snid'},
    {kind:'text',items:canvasTextBlocks,selector:'.cn-textblock',key:'tbid'}
  ];
}

function TrilleFindLayerTarget(kind,id){
  if(kind==='card'){
    if(!canvasPositions[id])canvasPositions[id]={x:0,y:0};
    return canvasPositions[id];
  }
  const group=TrilleCanvasObjectGroups().find(g=>g.kind===kind);
  return group?.items.find(obj=>obj.id===id)||null;
}

function TrilleNextCanvasLayer(){
  let maxLayer=0;
  TrilleCanvasObjectGroups().forEach(group=>{
    group.items.forEach((obj,index)=>{
      maxLayer=Math.max(maxLayer,TrilleCanvasLayerValue(group.kind,obj,obj.id,index));
    });
  });
  return maxLayer+10;
}

function TrilleMinCanvasLayer(){
  let minLayer=0;
  TrilleCanvasObjectGroups().forEach(group=>{
    group.items.forEach((obj,index)=>{
      minLayer=Math.min(minLayer,TrilleCanvasLayerValue(group.kind,obj,obj.id,index));
    });
  });
  return minLayer-10;
}

function moveCanvasLayer(kind,id,direction){
  const target=TrilleFindLayerTarget(kind,id);
  if(!target)return;
  target.layer=direction==='front'?TrilleNextCanvasLayer():TrilleMinCanvasLayer();
  saveCanvasData();
  renderCanvas();
}

function TrilleCanvasLayerControls(kind,id){
  return `<div class="Trille-canvas-layer-controls" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()">
    <button class="Trille-canvas-layer-btn" type="button" title="Bring to front" onclick="event.stopPropagation();moveCanvasLayer('${kind}','${id}','front')">↑</button>
    <button class="Trille-canvas-layer-btn" type="button" title="Send to back" onclick="event.stopPropagation();moveCanvasLayer('${kind}','${id}','back')">↓</button>
  </div>`;
}

function TrilleApplyCanvasLayers(){
  TrilleCanvasObjectGroups().forEach(group=>{
    group.items.forEach((obj,index)=>{
      const id=obj.id;
      const node=document.querySelector(`${group.selector}[data-${group.key}="${id}"]`);
      if(!node)return;
      node.style.zIndex=String(TrilleCanvasLayerValue(group.kind,obj,id,index));
    });
  });
}

function TrilleApplyObjectSizes(){
  canvasTextBlocks.forEach(text=>{
    const node=document.querySelector(`.cn-textblock[data-tbid="${text.id}"]`);
    if(!node)return;
    if(text.w)node.style.width=text.w+'px';
    if(text.h){
      node.style.height=text.h+'px';
      node.style.minHeight=text.h+'px';
    }
  });
  canvasShapes.forEach(shape=>{
    const node=document.querySelector(`.cn-shape[data-shid="${shape.id}"]`);
    if(!node)return;
    if(shape.w)node.style.width=shape.w+'px';
    if(shape.h)node.style.height=shape.h+'px';
  });
  canvasFrames.forEach(frame=>{
    const node=document.querySelector(`.cn-frame[data-frid="${frame.id}"]`);
    if(!node)return;
    if(frame.w)node.style.width=frame.w+'px';
    if(frame.h)node.style.height=frame.h+'px';
  });
  canvasUploads.forEach(upload=>{
    const node=document.querySelector(`.cn-upload[data-upid="${upload.id}"]`);
    if(!node)return;
    if(upload.w)node.style.width=upload.w+'px';
    if(upload.h)node.style.height=upload.h+'px';
  });
}

function TrilleInjectCanvasLayerControls(){
  TrilleCanvasObjectGroups().forEach(group=>{
    group.items.forEach(obj=>{
      const id=obj.id;
      const node=document.querySelector(`${group.selector}[data-${group.key}="${id}"]`);
      if(!node||node.querySelector('.Trille-canvas-layer-controls'))return;
      node.insertAdjacentHTML('afterbegin',TrilleCanvasLayerControls(group.kind,id));
    });
  });
}

function TrilleInjectResizeHandles(){
  const configs=[
    {items:canvasStickyNotes,selector:'.cn-sticky',key:'snid',cls:'Trille-canvas-sticky-resize',label:'Resize post-it'},
    {items:canvasTextBlocks,selector:'.cn-textblock',key:'tbid',cls:'Trille-canvas-text-resize',label:'Resize text'},
    {items:canvasShapes,selector:'.cn-shape',key:'shid',cls:'Trille-canvas-shape-resize',label:'Resize shape'},
    {items:canvasFrames,selector:'.cn-frame',key:'frid',cls:'Trille-canvas-frame-resize',label:'Resize frame'},
    {items:canvasUploads,selector:'.cn-upload',key:'upid',cls:'Trille-canvas-upload-resize',label:'Resize image'}
  ];

  configs.forEach(config=>{
    config.items.forEach(item=>{
      const node=document.querySelector(`${config.selector}[data-${config.key}="${item.id}"]`);
      if(!node||node.querySelector(`.${config.cls}`))return;
      node.insertAdjacentHTML('beforeend',`<button class="${config.cls} Trille-canvas-resize-handle" type="button" title="${config.label}" aria-label="${config.label}"></button>`);
    });
  });
}

function TrilleBindCanvasResizeHandle(handle,config){
  if(handle.dataset.resizeBound)return;
  handle.dataset.resizeBound='1';
  let resizing=false,startX=0,startY=0,startW=0,startH=0,target=null,pointerId=null;

  handle.addEventListener('pointerdown',event=>{
    const node=handle.closest(config.selector);
    if(!node)return;
    target=config.findTarget(node);
    if(!target)return;
    resizing=true;
    pointerId=event.pointerId;
    startX=event.clientX;
    startY=event.clientY;
    startW=target.w||node.offsetWidth||config.defaultW;
    startH=target.h||node.offsetHeight||config.defaultH;
    event.stopPropagation();
    event.preventDefault();
    try{handle.setPointerCapture(pointerId);}catch(err){}
  },{passive:false});

  handle.addEventListener('pointermove',event=>{
    if(!resizing||!target)return;
    const dx=(event.clientX-startX)/canvasScale;
    const dy=(event.clientY-startY)/canvasScale;
    target.w=Math.max(config.minW,Math.round(startW+dx));
    target.h=Math.max(config.minH,Math.round(startH+dy));
    const node=handle.closest(config.selector);
    if(node){
      node.style.width=target.w+'px';
      node.style.minHeight=target.h+'px';
      if(config.useHeight)node.style.height=target.h+'px';
    }
    event.stopPropagation();
    event.preventDefault();
  },{passive:false});

  const finish=event=>{
    if(!resizing)return;
    resizing=false;
    saveCanvasData();
    if(event)event.stopPropagation();
  };
  handle.addEventListener('pointerup',finish);
  handle.addEventListener('pointercancel',finish);
}

function TrilleBindCanvasResizeHandles(){
  const world=document.getElementById('canvas-world');
  if(!world)return;
  const configs=[
    {
      handleSelector:'.Trille-canvas-sticky-resize',
      selector:'.cn-sticky',
      defaultW:160,
      defaultH:120,
      minW:120,
      minH:80,
      useHeight:false,
      findTarget:node=>canvasStickyNotes.find(note=>note.id===node.dataset.snid)
    },
    {
      handleSelector:'.Trille-canvas-text-resize',
      selector:'.cn-textblock',
      defaultW:180,
      defaultH:80,
      minW:80,
      minH:36,
      useHeight:true,
      findTarget:node=>canvasTextBlocks.find(text=>text.id===node.dataset.tbid)
    },
    {
      handleSelector:'.Trille-canvas-shape-resize',
      selector:'.cn-shape',
      defaultW:120,
      defaultH:80,
      minW:48,
      minH:48,
      useHeight:true,
      findTarget:node=>canvasShapes.find(shape=>shape.id===node.dataset.shid)
    },
    {
      handleSelector:'.Trille-canvas-frame-resize',
      selector:'.cn-frame',
      defaultW:300,
      defaultH:200,
      minW:120,
      minH:90,
      useHeight:true,
      findTarget:node=>canvasFrames.find(frame=>frame.id===node.dataset.frid)
    },
    {
      handleSelector:'.Trille-canvas-upload-resize',
      selector:'.cn-upload',
      defaultW:200,
      defaultH:150,
      minW:80,
      minH:60,
      useHeight:true,
      findTarget:node=>canvasUploads.find(upload=>upload.id===node.dataset.upid)
    }
  ];

  configs.forEach(config=>{
    world.querySelectorAll(config.handleSelector).forEach(handle=>TrilleBindCanvasResizeHandle(handle,config));
  });
}

function changeCanvasStickyColor(id,color){
  const note=canvasStickyNotes.find(item=>item.id===id);
  if(!note)return;
  note.color=color;
  saveCanvasData();
  renderCanvas();
}

function toggleCanvasStickyPalette(id){
  const node=document.querySelector(`.cn-sticky[data-snid="${id}"]`);
  if(!node)return;
  const shouldOpen=!node.classList.contains('Trille-sticky-palette-open');
  document.querySelectorAll('.cn-sticky.Trille-sticky-palette-open').forEach(el=>el.classList.remove('Trille-sticky-palette-open'));
  if(shouldOpen)node.classList.add('Trille-sticky-palette-open');
}

function TrilleStickyColorControls(id,currentColor='yellow'){
  const colors=['yellow','pink','blue','green','purple','orange','white'];
  return `<div class="Trille-canvas-sticky-colors" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()">
    <button class="Trille-canvas-sticky-palette-btn" type="button" data-color="${currentColor}" title="Post-it color" aria-label="Post-it color" onclick="event.stopPropagation();toggleCanvasStickyPalette('${id}')"></button>
    <div class="Trille-canvas-sticky-palette-panel">
      ${colors.map(color=>`<button class="Trille-canvas-sticky-color ${color===currentColor?'is-active':''}" type="button" data-color="${color}" title="${color}" onclick="event.stopPropagation();changeCanvasStickyColor('${id}','${color}')"></button>`).join('')}
    </div>
  </div>`;
}

function TrilleInjectStickyColorControls(){
  canvasStickyNotes.forEach(note=>{
    const node=document.querySelector(`.cn-sticky[data-snid="${note.id}"]`);
    if(!node||node.querySelector('.Trille-canvas-sticky-colors'))return;
    node.insertAdjacentHTML('afterbegin',TrilleStickyColorControls(note.id,note.color||'yellow'));
  });
}

function TrilleUploadTitleValue(upload){
  if(typeof upload?.title==='string'&&upload.title.trim())return upload.title.trim();
  if(typeof upload?.name==='string'&&upload.name.trim())return upload.name.trim();
  return 'Photo';
}

function TrilleEnhanceUploadCards(){
  canvasUploads.forEach(upload=>{
    const node=document.querySelector(`.cn-upload[data-upid="${upload.id}"]`);
    if(!node)return;

    node.classList.add('Trille-canvas-upload-host');

    const img=node.querySelector('img');
    if(!img)return;

    const oldShell=node.querySelector('.Trille-canvas-upload-shell');
    if(oldShell){
      const oldMedia=oldShell.querySelector('.Trille-canvas-upload-media');
      const oldImg=oldMedia?.querySelector('img');
      if(oldImg)node.appendChild(oldImg);
      oldShell.remove();
    }

    let header=node.querySelector('.Trille-canvas-upload-header');
    let media=node.querySelector('.Trille-canvas-upload-media');
    let titleInput=node.querySelector('.Trille-canvas-upload-title');

    if(!header){
      header=document.createElement('div');
      header.className='Trille-canvas-upload-header';
      header.addEventListener('pointerdown',event=>event.stopPropagation());
      header.addEventListener('click',event=>event.stopPropagation());

      const avatar=document.createElement('div');
      avatar.className='Trille-canvas-upload-avatar';

      titleInput=document.createElement('input');
      titleInput.className='Trille-canvas-upload-title';
      titleInput.type='text';
      titleInput.placeholder='Photo';

      titleInput.addEventListener('pointerdown',event=>event.stopPropagation());
      titleInput.addEventListener('click',event=>event.stopPropagation());

      const commit=()=>{
        upload.title=(titleInput.value||'').trim()||'Photo';
        saveCanvasData();
      };

      titleInput.addEventListener('input',()=>{
        upload.title=titleInput.value;
      });
      titleInput.addEventListener('change',commit);
      titleInput.addEventListener('blur',commit);

      header.append(avatar,titleInput);
      node.insertBefore(header,node.firstChild);
    }

    if(!media){
      media=document.createElement('div');
      media.className='Trille-canvas-upload-media';
      if(header.nextSibling)node.insertBefore(media,header.nextSibling);
      else node.appendChild(media);
    }

    if(img.parentElement!==media){
      media.appendChild(img);
    }

    titleInput=node.querySelector('.Trille-canvas-upload-title');
    if(titleInput&&document.activeElement!==titleInput){
      titleInput.value=TrilleUploadTitleValue(upload);
    }
  });
}

function installCanvasLayers(){
  if(typeof renderCanvas!=='function')return;
  const baseRenderCanvas=renderCanvas;
  renderCanvas=function(){
    baseRenderCanvas();
    TrilleEnhanceUploadCards();
    TrilleApplyCanvasLayers();
    TrilleApplyObjectSizes();
    TrilleInjectCanvasLayerControls();
    TrilleInjectStickyColorControls();
    TrilleInjectResizeHandles();
    TrilleBindCanvasResizeHandles();
  };
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

function installCanvasLinkDeleteControls(){
  if(typeof drawAllCanvasLines!=='function')return;

  drawAllCanvasLines=function(items){
    const world=document.getElementById('canvas-world');
    if(!world)return;

    let svg=world.querySelector('.canvas-svg');
    if(!svg){
      svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.classList.add('canvas-svg');
      world.insertBefore(svg,world.firstChild);
    }

    const defs=`<defs>
      <marker id="canvas-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M 0 0 L 8 4 L 0 8 z" class="canvas-line-arrow"/>
      </marker>
    </defs>`;

    let paths='';

    items.forEach(item=>{
      const ids=Array.isArray(item.linkedCardIds)?item.linkedCardIds:[];
      if(!ids.length)return;
      const srcPos=canvasPositions[item.id];
      if(!srcPos)return;

      ids.forEach(tid=>{
        const tgtPos=canvasPositions[tid];
        if(!tgtPos)return;
        const sx=srcPos.x+100;
        const sy=srcPos.y+110;
        const tx=tgtPos.x+100;
        const ty=tgtPos.y;
        const midY=(sy+ty)/2;
        const deleteX=(sx+tx)/2;
        const deleteY=midY;

        paths+=`<path class="canvas-line" d="M${sx},${sy} C${sx},${midY} ${tx},${midY} ${tx},${ty}" marker-end="url(#canvas-arrow)"/>`;
        paths+=`<g class="Trille-canvas-link-delete" onclick="event.stopPropagation();deleteCanvasCardLink('${item.id}','${tid}')" aria-label="Delete link">
          <circle class="Trille-canvas-link-delete-bg" cx="${deleteX}" cy="${deleteY}" r="10"></circle>
          <text class="Trille-canvas-link-delete-x" x="${deleteX}" y="${deleteY+4}" text-anchor="middle">×</text>
        </g>`;
      });
    });

    canvasLines.forEach(ln=>{
      const stroke=ln.color||'#666';
      const dash=ln.style==='dashed'?'stroke-dasharray="8 4"':'';
      const marker=(ln.style==='arrow')?'marker-end="url(#canvas-arrow)"':'';
      paths+=`<line x1="${ln.x1}" y1="${ln.y1}" x2="${ln.x2}" y2="${ln.y2}" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" ${dash} ${marker}/>
        <g class="canvas-line-del" onclick="deleteCanvasObj('line','${ln.id}')" style="cursor:pointer">
          <circle cx="${(ln.x1+ln.x2)/2}" cy="${(ln.y1+ln.y2)/2}" r="8" fill="white" stroke="#ccc" stroke-width="1"/>
          <text x="${(ln.x1+ln.x2)/2}" y="${(ln.y1+ln.y2)/2+4}" text-anchor="middle" font-size="12" fill="#999">×</text>
        </g>`;
    });

    if(window._lineDrawing){
      const ld=window._lineDrawing;
      paths+=`<line x1="${ld.x1}" y1="${ld.y1}" x2="${ld.x2}" y2="${ld.y2}" stroke="#4a90d9" stroke-width="2" stroke-dasharray="6 3" stroke-linecap="round"/>`;
    }

    const maxX=Math.max(...items.map(i=>(canvasPositions[i.id]?.x||0)+220),...canvasLines.map(l=>Math.max(l.x1,l.x2)),800);
    const maxY=Math.max(...items.map(i=>(canvasPositions[i.id]?.y||0)+200),...canvasLines.map(l=>Math.max(l.y1,l.y2)),600);
    svg.setAttribute('width',maxX);
    svg.setAttribute('height',maxY);
    svg.style.width=maxX+'px';
    svg.style.height=maxY+'px';
    svg.innerHTML=defs+paths;
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
loadCanvasTools();
loadAppIconMetadata();
ensureAddButton();
installCanvasScopedStorage();
installCanvasLinkDeleteControls();
installCanvasLayers();
init();
