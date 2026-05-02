function setDark(v){dark=v;v?document.documentElement.setAttribute('data-dark',''):document.documentElement.removeAttribute('data-dark');document.getElementById('dark-tog')?.classList.toggle('on',v);localStorage.setItem('t-theme',v?'dark':'light');}
function toggleTheme(){setDark(!dark);}

function toggleSearch(){
  showSrch=!showSrch;
  document.getElementById('srch-wrap').style.display=showSrch?'block':'none';
  if(!showSrch){sq='';renderHome();}
  else setTimeout(()=>document.getElementById('srch-in').focus(),60);
}
function onSearch(v){sq=v;if(curView==='home')renderHome();}

function switchView(v,btn){
  curView=v;
  ['home','boards','board','stats','calendar','settings'].forEach(n=>document.getElementById('view-'+n)?.classList.toggle('active',n===v));
  document.querySelectorAll('.nbtn').forEach(b=>b.classList.remove('active'));
  if(['home','stats','calendar','settings'].includes(v)){
    (btn||document.getElementById('nav-'+v))?.classList.add('active');
  }
  if(v==='home')renderHome();
  if(v==='stats')renderStats();
  if(v==='calendar')renderCal();
}

function renderHome(){renderFolders();}

function renderFolders(){
  const grid=document.getElementById('folders-grid');
  let html='';
  const list=sq?folders.filter(f=>f.name.toLowerCase().includes(sq.toLowerCase())):folders;
  list.forEach(f=>{
    const cnt=cards.filter(c=>c.folderId===f.id).length;
    html+=`<div class="folder-card" onclick="openFolder('${f.id}')"><div class="folder-icon-wrap">${folderSVG()}</div><div class="folder-name">${esc(f.name)}</div><div class="folder-count">${cnt} board${cnt!==1?'s':''}</div></div>`;
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
  const list=sq?cards.filter(c=>(c.title+(c.desc||'')).toLowerCase().includes(sq.toLowerCase())):cards.slice(-5).reverse();
  if(!list.length){rl.innerHTML='<div class="empty"><p>No boards yet. Create a folder and add boards!</p></div>';return;}
  rl.innerHTML=list.map(c=>{
    const folder=folders.find(f=>f.id===c.folderId);
    return `<div class="recent-item" onclick="openBoardFromCard('${c.id}')"><div class="ri-dot"></div><div class="ri-body"><div class="ri-title">${esc(c.title)}</div><div class="ri-sub">${folder?esc(folder.name):'No folder'} · ${(TYPES[c.type]||TYPES.custom).label}</div></div><div class="ri-arrow"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div></div>`;
  }).join('');
}

function openBoardFromCard(cid){
  const card=cards.find(c=>c.id===cid);
  if(!card)return;
  openFolder(card.folderId,false);
  setTimeout(()=>openDetail(card.id),100);
}

function openFolder(fid){
  curView = 'boards';
  activeFolderId=fid;
  const folder=folders.find(f=>f.id===fid);
  if(!folder)return;
  const cnt=cards.filter(c=>c.folderId===fid).length;
  document.getElementById('boards-folder-hdr').innerHTML=`<div class="boards-folder-icon-wrap">${folderSVG()}</div><div><div class="boards-folder-name">${esc(folder.name)}</div><div class="boards-folder-meta">${cnt} board${cnt!==1?'s':''}</div></div>`;
  renderFolderBoards();
  document.getElementById('view-home').classList.remove('active');
  document.getElementById('view-boards').classList.add('active');
  document.querySelectorAll('.nbtn').forEach(b=>b.classList.remove('active'));
  curView='boards';
}

function renderFolderBoards(){
  const bg=document.getElementById('boards-grid');
  const folderCards=cards.filter(c=>c.folderId===activeFolderId);
  if(!folderCards.length){bg.innerHTML='<div class="empty"><h3>Empty folder</h3><p>Add your first board below.</p></div>'+addBoardBtnHTML();return;}
  bg.innerHTML=folderCards.map(c=>{
    const pct=c.type==='habit'&&c.items?.length?Math.round(c.items.filter(i=>i.done).length/c.items.length*100):null;
    const prog=pct!==null?`<div class="bi-prog-pill"><div class="bi-prog-bar"><div class="bi-prog-fill" style="width:${pct}%"></div></div>${pct}%</div>`:'';
    const nfProgress=c.nf?.find(f=>f.type==='progress');
    const prog2=nfProgress?`<div class="bi-prog-pill"><div class="bi-prog-bar"><div class="bi-prog-fill" style="width:${nfProgress.value||0}%"></div></div>${nfProgress.value||0}%</div>`:'';
    const subCount=Array.isArray(c.subcards)&&c.subcards.length?` · ${c.subcards.length} card${c.subcards.length!==1?'s':''}`:'';
    return `<div class="board-item" onclick="openBoard('${c.id}')"><div class="bi-top"><span class="bi-type">${(TYPES[c.type]||TYPES.custom).label}${subCount}</span><div class="mbtn-wrap" onclick="event.stopPropagation();showBoardCtx(event,'${c.id}')"><svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/></svg></div></div><div class="bi-title">${esc(c.title)}</div>${c.desc?`<div class="bi-desc">${esc(c.desc)}</div>`:''}<div class="bi-meta">${prog||prog2}</div></div>`;
  }).join('');
  bg.innerHTML+=addBoardBtnHTML();
}
function addBoardBtnHTML(){return `<button class="add-board-btn" onclick="openAddInFolder()">+ Add board</button>`;}

function goHome(){
  activeFolderId=null;
  document.getElementById('view-boards').classList.remove('active');
  document.getElementById('view-home').classList.add('active');
  curView='home';
  document.getElementById('nav-home').classList.add('active');
  renderHome();
}

function openAddInFolder(){editId=null;openAdd();}
function showBoardCtx(e,id){ctxId=id;const m=document.getElementById('ctx');m.classList.add('open');let x=e.clientX,y=e.clientY;if(x+160>innerWidth)x=innerWidth-162;if(y+120>innerHeight-80)y=y-120;m.style.left=x+'px';m.style.top=y+'px';}

function openBoard(cid){
  curView = 'board';
  activeBoardId=cid;
  const card=cards.find(c=>c.id===cid);
  if(!card)return;
  const folder=folders.find(f=>f.id===card.folderId);
  document.getElementById('board-type-tag').textContent=(TYPES[card.type]||TYPES.custom).label;
  document.getElementById('board-title-el').textContent=card.title;
  document.getElementById('board-desc-el').textContent=card.desc||'';
  document.getElementById('board-back-label').textContent=folder?folder.name:'Back';
  document.getElementById('board-back-btn').onclick=()=>{document.getElementById('view-board').classList.remove('active');document.getElementById('view-boards').classList.add('active');curView='boards';};
  renderBoardCards(card);
  document.getElementById('view-boards').classList.remove('active');
  document.getElementById('view-board').classList.add('active');
  curView='board';
}

function nestedCardHTML(sub){
  const type=(TYPES[sub.type]||TYPES.custom).label;
  const note=sub.note?`<div class="card-note">${esc(sub.note).replace(/\n/g,'<br>')}</div>`:'';
  const desc=sub.desc?`<div class="bi-desc">${esc(sub.desc)}</div>`:'';
  const actions=`<div class="act-row"><button class="act-btn" onclick="openSubcardEdit('${sub.id}')">Edit</button><button class="act-btn" onclick="dupSubcard('${sub.id}')">Duplicate</button><button class="act-btn danger" onclick="delSubcard('${sub.id}')">Delete</button></div>`;
  let body='';
  if(sub.type==='habit'&&sub.items?.length){
    const done=sub.items.filter(i=>i.done).length;
    body+=`<div class="cl">${sub.items.map(it=>`<label class="ci${it.done?' done':''}"><input type="checkbox" data-subid="${sub.id}" data-iid="${it.id}" ${it.done?'checked':''}><span>${esc(it.text)}</span></label>`).join('')}</div><div class="cl-prog">${done} / ${sub.items.length} done</div>`;
  }
  if(sub.nf?.length)body+=`<div class="flds">${sub.nf.map(f=>fDisplayHTML(f)).join('')}</div>`;
  return `<div class="card"><div class="card-top"><div class="card-left"><div class="type-tag">${type}</div><div class="card-title">${esc(sub.title)}</div>${desc}</div></div>${body}${note}${actions}</div>`;
}

function renderBoardCards(card){
  const list=document.getElementById('board-cards');
  let html='';
  if(card.type==='habit'&&card.items?.length){
    const done=card.items.filter(i=>i.done).length;
    const moreBtn=`<div class="mbtn-wrap" onclick="event.stopPropagation();editFromBoardView('${card.id}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>`;
    html+=`<div class="card"><div class="card-top"><div class="card-left"><div class="type-tag">Checklist</div><div class="card-title">Activities</div></div>${moreBtn}</div><div class="cl">${card.items.map(it=>`<label class="ci${it.done?' done':''}"><input type="checkbox" data-iid="${it.id}" ${it.done?'checked':''}><span>${esc(it.text)}</span></label>`).join('')}</div><div class="cl-prog">${done} / ${card.items.length} done</div></div>`;
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
}

function editFromBoardView(id){openEdit(id);}
