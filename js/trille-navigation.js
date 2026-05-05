function setDark(v){dark=v;v?document.documentElement.setAttribute('data-dark',''):document.documentElement.removeAttribute('data-dark');document.getElementById('dark-tog')?.classList.toggle('on',v);localStorage.setItem('t-theme',v?'dark':'light');}
function toggleTheme(){setDark(!dark);}

function resetViewScroll(name){
  const sc=document.querySelector(`#view-${name} .scroll`);
  if(sc)sc.scrollTop=0;
}

function activateView(name){
  ['home','boards','board','stats','calendar','settings','canvas'].forEach(n=>document.getElementById('view-'+n)?.classList.toggle('active',n===name));
  document.querySelectorAll('.nbtn').forEach(b=>b.classList.remove('active'));
  if(['home','stats','calendar','settings'].includes(name))document.getElementById('nav-'+name)?.classList.add('active');
  curView=name;
}

function toggleSearch(){
  showSrch=!showSrch;
  document.getElementById('srch-wrap').style.display=showSrch?'block':'none';
  if(!showSrch){sq='';renderHome();resetViewScroll('home');}
  else setTimeout(()=>document.getElementById('srch-in').focus(),60);
}
function onSearch(v){sq=v;if(curView==='home'){renderHome();resetViewScroll('home');}}

function switchView(v,btn){
  activateView(v);
  if(btn){document.querySelectorAll('.nbtn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}
  if(v==='home')renderHome();
  if(v==='stats')renderStats();
  if(v==='calendar')renderCal();
  resetViewScroll(v);
}

function renderHome(){renderFolders();}

function renderFolders(){
  const grid=document.getElementById('folders-grid');
  let html='';
  const list=sq?folders.filter(f=>f.name.toLowerCase().includes(sq.toLowerCase())):folders;
  list.forEach(f=>{
    const cnt=cards.filter(c=>c.folderId===f.id).length;
    html+=`<div class="folder-card" onclick="openFolder('${f.id}')"><div class="folder-icon-wrap">${folderSVG()}</div><div class="folder-name">${esc(f.name)}</div><div class="folder-count">${cnt} canvas${cnt!==1?'es':''}</div></div>`;
  });
  html+=`<div class="folder-card folder-add" onclick="openFolderModal()"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><p>New</p></div>`;
  grid.innerHTML=html;
  grid.querySelectorAll('.folder-card:not(.folder-add)').forEach((el,i)=>{
    let timer;
    el.addEventListener('touchstart',()=>{timer=setTimeout(()=>{editFolder(list[i].id);},500);},{passive:true});
    el.addEventListener('touchend',()=>clearTimeout(timer),{passive:true});
    el.addEventListener('touchmove',()=>clearTimeout(timer),{passive:true});
  });
}

function renderRecent(){
  const rl=document.getElementById('recent-list');
  const list=sq?cards.filter(c=>(c.title+(c.desc||'')+tagsToInput(c.tags)).toLowerCase().includes(sq.toLowerCase())):cards.slice(-5).reverse();
  if(!list.length){rl.innerHTML='<div class="empty"><p>No canvases yet. Create a folder and add canvases!</p></div>';return;}
  rl.innerHTML=list.map(c=>{
    const folder=folders.find(f=>f.id===c.folderId);
    const tagText=tagsToInput(c.tags);
    return `<div class="recent-item" onclick="openBoardFromCard('${c.id}')"><div class="ri-dot"></div><div class="ri-body"><div class="ri-title">${esc(c.title)}</div><div class="ri-sub">${folder?esc(folder.name):'No folder'}${tagText?' · '+esc(tagText):''}</div></div><div class="ri-arrow"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div></div>`;
  }).join('');
}

function openBoardFromCard(cid){
  const card=cards.find(c=>c.id===cid);
  if(!card)return;
  openFolder(card.folderId,false);
  setTimeout(()=>openCanvasFromFolder(card.id),100);
}

function openFolder(fid){
  activeFolderId=fid;
  const folder=folders.find(f=>f.id===fid);
  if(!folder)return;
  const cnt=cards.filter(c=>c.folderId===fid).length;
  document.getElementById('boards-folder-hdr').innerHTML=`<div class="boards-folder-icon-wrap">${folderSVG()}</div><div><div class="boards-folder-name">${esc(folder.name)}</div><div class="boards-folder-meta">${cnt} canvas${cnt!==1?'es':''}</div></div><button class="icon-btn" id="boards-reorder-btn" onclick="toggleReorder('boards')" title="Reorder canvases"><svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></button>`;
  renderFolderBoards();
  activateView('boards');
  resetViewScroll('boards');
  updateReorderButtons?.();
}

function renderFolderBoards(){
  const bg=document.getElementById('boards-grid');
  const folderCards=cards.filter(c=>c.folderId===activeFolderId);
  if(!folderCards.length){bg.innerHTML='<div class="empty"><h3>Empty folder</h3><p>Add your first canvas below.</p></div>'+addBoardBtnHTML();return;}
  bg.innerHTML=folderCards.map(c=>{
    const pct=(c.items||[]).length?Math.round(c.items.filter(i=>i.done).length/c.items.length*100):null;
    const prog=pct!==null?`<div class="bi-prog-pill"><div class="bi-prog-bar"><div class="bi-prog-fill" style="width:${pct}%"></div></div>${pct}%</div>`:'';
    const nfProgress=c.nf?.find(f=>f.type==='progress');
    const prog2=nfProgress?`<div class="bi-prog-pill"><div class="bi-prog-bar"><div class="bi-prog-fill" style="width:${nfProgress.value||0}%"></div></div>${nfProgress.value||0}%</div>`:'';
    const subCount=Array.isArray(c.subcards)&&c.subcards.length?`<span class="bi-type">${c.subcards.length} card${c.subcards.length!==1?'s':''}</span>`:'';
    const tags=tagListHTML(c.tags)||subCount;
    return `<div class="board-item" data-id="${c.id}" onclick="if(!reorder)openCanvasFromFolder('${c.id}')"><div class="bi-top"><span class="bi-type">${tags||'Canvas'}</span><div class="mbtn-wrap" onclick="event.stopPropagation();ctxKind='board';showBoardCtx(event,'${c.id}')"><svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/></svg></div></div><div class="bi-title">${esc(c.title)}</div>${c.desc?`<div class="bi-desc">${esc(c.desc)}</div>`:''}<div class="bi-meta">${prog||prog2}</div></div>`;
  }).join('');
  bg.innerHTML+=addBoardBtnHTML();
  bindBoardListReorder?.();
  updateReorderButtons?.();
}
function addBoardBtnHTML(){return `<button class="add-board-btn" onclick="openAddInFolder()">+ Add canvas</button>`;}

function goHome(){
  activeFolderId=null;
  reorder=false;
  activateView('home');
  renderHome();
  resetViewScroll('home');
}

function openAddInFolder(){
  editId=null;
  openAdd();
  document.getElementById('modal-add-title').textContent='New Canvas';
  document.getElementById('save-lbl').textContent='Create Canvas';
}
function showBoardCtx(e,id){ctxKind='board';ctxId=id;const m=document.getElementById('ctx');m.classList.add('open');let x=e.clientX,y=e.clientY;if(x+160>innerWidth)x=innerWidth-162;if(y+120>innerHeight-80)y=y-120;m.style.left=x+'px';m.style.top=y+'px';}

function openCanvasFromFolder(cid){
  reorder=false;
  activeBoardId=cid;
  curView='board';
  openCanvas(cid);
  ensureCanvasWorkspaceControls();
}

function ensureCanvasWorkspaceControls(){
  const view=document.getElementById('view-canvas');
  if(!view)return;
  view.classList.add('Trille-canvas-direct');
  let back=view.querySelector('.Trille-canvas-back-btn');
  if(!back){
    back=document.createElement('button');
    back.type='button';
    back.className='Trille-canvas-back-btn';
    back.innerHTML='<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg><span>Canvases</span>';
    back.addEventListener('click',closeCanvasToFolder);
    view.appendChild(back);
  }
  let cardsBtn=view.querySelector('.Trille-canvas-cards-btn');
  if(!cardsBtn){
    cardsBtn=document.createElement('button');
    cardsBtn.type='button';
    cardsBtn.className='Trille-canvas-cards-btn';
    cardsBtn.textContent='Cards';
    cardsBtn.addEventListener('click',openCanvasCards);
    view.appendChild(cardsBtn);
  }
}

function closeCanvasToFolder(){
  document.getElementById('canvas-ctx')?.classList.remove('open');
  document.getElementById('canvas-color-popup')?.classList.remove('open');
  document.getElementById('canvas-link-popup')?.classList.remove('open');
  const prevBoard=canvasActiveBoard||activeBoardId;
  const board=cards.find(c=>c.id===prevBoard);
  canvasActiveBoard=null;
  document.getElementById('view-canvas')?.classList.remove('Trille-canvas-direct');
  if(board?.folderId){
    activeFolderId=board.folderId;
    openFolder(board.folderId);
    return;
  }
  goHome();
}

function openCanvasCards(){
  const id=canvasActiveBoard||activeBoardId;
  if(!id)return;
  document.getElementById('view-canvas')?.classList.remove('Trille-canvas-direct');
  openBoard(id);
}

function openBoard(cid){
  reorder=false;
  activeBoardId=cid;
  const card=cards.find(c=>c.id===cid);
  if(!card)return;
  const folder=folders.find(f=>f.id===card.folderId);
  document.getElementById('board-type-tag').innerHTML=tagListHTML(card.tags);
  document.getElementById('board-title-el').textContent=card.title;
  document.getElementById('board-desc-el').textContent=card.desc||'';
  document.getElementById('board-back-label').textContent=folder?folder.name:'Back';
  document.getElementById('board-back-btn').onclick=()=>{reorder=false;activateView('boards');resetViewScroll('boards');updateReorderButtons?.();};
  renderBoardCards(card);
  activateView('board');
  resetViewScroll('board');
  updateReorderButtons?.();
}

function scrollToLinkedCard(id){
  const el=document.querySelector(`[data-subcard-id="${id}"]`);
  if(el)el.scrollIntoView({behavior:'smooth',block:'center'});
}

function linkedCardsHTML(board,sub){
  const ids=Array.isArray(sub.linkedCardIds)?sub.linkedCardIds:[];
  if(!board||!ids.length)return '';
  const linked=ids.map(id=>(board.subcards||[]).find(card=>card.id===id)).filter(Boolean);
  if(!linked.length)return '';
  return `<div class="Trille-linked-flow"><div class="Trille-linked-label">Linked workflow</div>${linked.map(card=>`<button class="Trille-linked-chip" type="button" onclick="event.stopPropagation();scrollToLinkedCard('${card.id}')">${esc(card.title)}</button>`).join('')}</div>`;
}

function nestedCardHTML(sub){
  const board=cards.find(c=>c.id===activeBoardId);
  const tagHtml=tagListHTML(sub.tags);
  const desc=sub.desc?`<div class="card-desc">${esc(sub.desc)}</div>`:'';
  const menu=`<div class="mbtn-wrap" onclick="showSubcardCtx(event,'${sub.id}')"><svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/></svg></div>`;
  let body='';
  const items=Array.isArray(sub.items)?sub.items:[];
  if(items.length){
    const done=items.filter(i=>i.done).length;
    body+=`<div class="cl">${items.map(it=>`<label class="ci${it.done?' done':''}"><input type="checkbox" data-subid="${sub.id}" data-iid="${it.id}" ${it.done?'checked':''}><span>${esc(it.text)}</span></label>`).join('')}</div><div class="cl-prog">${done} / ${items.length} done</div>`;
  }
  const fields=Array.isArray(sub.nf)?sub.nf:[];
  if(fields.length)body+=`<div class="flds">${fields.map(f=>fDisplayHTML(f)).join('')}</div>`;
  if(sub.note)body+=`<div class="card-note">${esc(sub.note).replace(/\n/g,'<br>')}</div>`;
  body+=linkedCardsHTML(board,sub);
  if(!body&&!sub.desc){body='<div class="card-desc">No details yet.</div>';}
  return `<div class="card" data-subcard-id="${sub.id}" data-id="${sub.id}"><div class="card-top"><div class="card-left">${tagHtml?`<div class="type-tag">${tagHtml}</div>`:''}<div class="card-title">${esc(sub.title)}</div>${desc}</div>${menu}</div>${body}</div>`;
}

let TrilleBoardLinesBound=false;
function bindBoardLineResize(){
  if(TrilleBoardLinesBound)return;
  TrilleBoardLinesBound=true;
  window.addEventListener('resize',()=>{
    if(curView==='board')requestAnimationFrame(drawBoardLinkedLines);
  },{passive:true});
}
function ensureBoardLineSvg(container){
  let svg=container.querySelector('.Trille-board-lines');
  if(svg)return svg;
  svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.classList.add('Trille-board-lines');
  container.prepend(svg);
  return svg;
}
function boardLinePath(sx,sy,tx,ty){
  const midY=(sy+ty)/2;
  return `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;
}
function drawBoardLinkedLines(){
  const container=document.getElementById('board-cards');
  if(!container||!activeBoardId)return;
  const board=cards.find(c=>c.id===activeBoardId);
  if(!board)return;
  const subcards=Array.isArray(board.subcards)?board.subcards:[];
  const nodeMap=new Map();
  container.querySelectorAll('.card[data-subcard-id]').forEach(node=>nodeMap.set(node.dataset.subcardId,node));
  const svg=ensureBoardLineSvg(container);
  const containerRect=container.getBoundingClientRect();
  const width=Math.max(container.clientWidth,1);
  const height=Math.max(container.scrollHeight,1);
  const parts=[`<defs><marker id="Trille-board-line-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 8 4 L 0 8 z" class="Trille-board-line-arrow"></path></marker></defs>`];
  subcards.forEach(source=>{
    const sourceNode=nodeMap.get(source.id);
    if(!sourceNode)return;
    const sourceRect=sourceNode.getBoundingClientRect();
    const sourceX=sourceRect.left-containerRect.left+(sourceRect.width/2);
    const sourceY=sourceRect.top-containerRect.top+sourceRect.height;
    const linkedIds=Array.isArray(source.linkedCardIds)?source.linkedCardIds:[];
    linkedIds.forEach(targetId=>{
      const targetNode=nodeMap.get(targetId);
      if(!targetNode)return;
      const targetRect=targetNode.getBoundingClientRect();
      const targetX=targetRect.left-containerRect.left+(targetRect.width/2);
      const targetY=targetRect.top-containerRect.top;
      parts.push(`<path class="Trille-board-line-path" d="${boardLinePath(sourceX,sourceY,targetX,targetY)}" marker-end="url(#Trille-board-line-arrow)"></path><circle class="Trille-board-line-dot" cx="${sourceX}" cy="${sourceY}" r="4"></circle><circle class="Trille-board-line-dot" cx="${targetX}" cy="${targetY}" r="4"></circle>`);
    });
  });
  svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  svg.setAttribute('width',width);
  svg.setAttribute('height',height);
  svg.innerHTML=parts.join('');
}

function renderBoardCards(card){
  const list=document.getElementById('board-cards');
  let html='';
  if((card.items||[]).length){
    const done=card.items.filter(i=>i.done).length;
    const moreBtn=`<div class="mbtn-wrap" onclick="event.stopPropagation();editFromBoardView('${card.id}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>`;
    html+=`<div class="card"><div class="card-top"><div class="card-left"><div class="type-tag">Activities</div></div>${moreBtn}</div><div class="cl">${card.items.map(it=>`<label class="ci${it.done?' done':''}"><input type="checkbox" data-iid="${it.id}" ${it.done?'checked':''}><span>${esc(it.text)}</span></label>`).join('')}</div><div class="cl-prog">${done} / ${card.items.length} done</div></div>`;
  }
  const nf=card.nf||[];
  if(nf.length){
    const editBtn=`<div class="mbtn-wrap" onclick="event.stopPropagation();editFromBoardView('${card.id}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>`;
    html+=`<div class="card"><div class="card-top"><div class="card-left"><div class="type-tag">Fields</div><div class="card-title">Details</div></div>${editBtn}</div><div class="flds">${nf.map(f=>fDisplayHTML(f)).join('')}</div></div>`;
  }
  if(card.note){
    html+=`<div class="card"><div class="card-top"><div class="card-left"><div class="type-tag">Note</div></div></div><div class="card-note">${esc(card.note).replace(/\n/g,'<br>')}</div></div>`;
  }
  const subcards=Array.isArray(card.subcards)?card.subcards:[];
  if(subcards.length){
    html+=`<div class="section-hdr" style="padding:4px 0 0"><span class="section-title">Cards</span></div>`;
    html+=subcards.map(nestedCardHTML).join('');
  }
  list.innerHTML=html;
  list.querySelectorAll('.ci input:not([data-subid])').forEach(cb=>cb.addEventListener('change',e=>{e.stopPropagation();toggleCheck(card.id,cb.dataset.iid,cb.checked);}));
  list.querySelectorAll('.ci input[data-subid]').forEach(cb=>cb.addEventListener('change',e=>{e.stopPropagation();toggleSubcardCheck(card.id,cb.dataset.subid,cb.dataset.iid,cb.checked);}));
  bindSubcardReorder?.();
  updateReorderButtons?.();
  bindBoardLineResize();
  requestAnimationFrame(drawBoardLinkedLines);
}

function editFromBoardView(id){openEdit(id);}
