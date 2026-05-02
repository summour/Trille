function toggleCheck(cid,iid,v){
  const c=cards.find(x=>x.id===cid);
  const it=c?.items?.find(x=>x.id===iid);
  if(it){
    it.done=v;
    save();
    if(activeBoardId===cid)renderBoardCards(c);
    renderFolderBoards();
  }
}

function toggleSubcardCheck(boardId,subId,itemId,value){
  const board=cards.find(x=>x.id===boardId);
  const sub=board?.subcards?.find(x=>x.id===subId);
  const item=sub?.items?.find(x=>x.id===itemId);
  if(!item)return;
  item.done=value;
  save();
  if(activeBoardId===boardId)renderBoardCards(board);
  renderFolderBoards();
}

let addSourceView=null;
let editSubcardId=null;
let ctxKind='board';

function fillCardForm(card){
  clItems=(card.items||[]).map(i=>({...i}));
  if(!clItems.length)clItems=[{id:uid(),text:'',done:false}];
  nfFields=(card.nf||[]).map(f=>({...f,value:Array.isArray(f.value)?[...f.value]:f.value}));
  document.getElementById('f-title').value=card.title||'';
  document.getElementById('f-desc').value=card.desc||'';
  renderDyn(card);
}

function openAdd(){
  editId=null;
  editSubcardId=null;
  clItems=[{id:uid(),text:'',done:false}];
  nfFields=[];
  addSourceView=curView;
  document.getElementById('modal-add-title').textContent=curView==='board'?'New Card':'New Board';
  document.getElementById('save-lbl').textContent=curView==='board'?'Create Card':'Create Board';
  document.getElementById('f-title').value='';
  document.getElementById('f-desc').value='';
  renderDyn({tags:[]});
  openModal('modal-add');
  setTimeout(()=>document.getElementById('f-title').focus(),200);
}

function openEdit(id){
  const card=cards.find(c=>c.id===id);
  if(!card)return;
  editId=id;
  editSubcardId=null;
  addSourceView=curView;
  document.getElementById('modal-add-title').textContent='Edit Board';
  document.getElementById('save-lbl').textContent='Save Board';
  fillCardForm(card);
  openModal('modal-add');
}

function openSubcardEdit(subId){
  const board=cards.find(c=>c.id===activeBoardId);
  if(!board)return;
  const sub=board.subcards?.find(c=>c.id===subId);
  if(!sub)return;
  editId=null;
  editSubcardId=subId;
  addSourceView='board';
  document.getElementById('modal-add-title').textContent='Edit Card';
  document.getElementById('save-lbl').textContent='Save Card';
  fillCardForm(sub);
  openModal('modal-add');
}

function rerenderCardSourceView(){
  const source=addSourceView||curView;
  if(source==='board'&&activeBoardId){
    const card=cards.find(c=>c.id===activeBoardId);
    if(card){
      openBoard(activeBoardId);
      return;
    }
  }
  if(source==='boards'&&activeFolderId){
    renderFolderBoards();
    document.getElementById('view-home')?.classList.remove('active');
    document.getElementById('view-board')?.classList.remove('active');
    document.getElementById('view-boards')?.classList.add('active');
    document.querySelectorAll('.nbtn').forEach(b=>b.classList.remove('active'));
    curView='boards';
    return;
  }
  switchView(source||'home');
}

function getCardFormData(){
  const title=document.getElementById('f-title').value.trim();
  if(!title)return null;
  document.querySelectorAll('.clrow input[type=text]').forEach((inp,i)=>{if(clItems[i])clItems[i].text=inp.value;});
  nfFields.forEach(f=>{
    if(f.type==='multi'){
      const inp=document.getElementById('nfmin-'+f.id);
      if(inp&&inp.value.trim()){
        if(!Array.isArray(f.value))f.value=[];
        f.value.push(inp.value.trim());
      }
    }
  });
  const d={
    title,
    desc:document.getElementById('f-desc').value.trim(),
    tags:parseTags(document.getElementById('f-tags')?.value||''),
    note:document.getElementById('f-note')?.value.trim()||'',
    nf:nfFields
  };
  d.items=clItems.filter(i=>i.text.trim());
  return d;
}

function saveCard(){
  const d=getCardFormData();
  if(!d){toast('Add a title');return;}
  if(editSubcardId&&activeBoardId){
    const board=cards.find(c=>c.id===activeBoardId);
    const i=board?.subcards?.findIndex(c=>c.id===editSubcardId)??-1;
    if(i!==-1)board.subcards[i]={...board.subcards[i],...d};
    toast('Card saved');
  }else if(editId){
    const i=cards.findIndex(c=>c.id===editId);
    if(i!==-1)cards[i]={...cards[i],...d};
    toast('Board saved');
  }else if(addSourceView==='board'&&activeBoardId){
    const board=cards.find(c=>c.id===activeBoardId);
    if(!board){toast('Board not found');return;}
    if(!Array.isArray(board.subcards))board.subcards=[];
    board.subcards.push({id:uid(),...d});
    toast('Card created');
  }else{
    const fid=activeFolderId||(folders[0]?.id);
    cards.push({id:uid(),folderId:fid,...d});
    toast('Board created');
  }
  save();
  closeModal('modal-add');
  renderFolders();
  renderFolderBoards();
  rerenderCardSourceView();
  addSourceView=null;
  editSubcardId=null;
}

function openDetail(id){
  const card=cards.find(c=>c.id===id);
  if(!card)return;
  document.getElementById('modal-detail').dataset.cid=id;
  document.getElementById('d-tag').innerHTML=tagListHTML(card.tags);
  document.getElementById('d-title').textContent=card.title;
  document.getElementById('d-desc').textContent=card.desc||'';
  let body='';
  if((card.items||[]).length){
    const done=card.items.filter(i=>i.done).length;
    body+=`<div class="fg"><label class="fl">Activities — ${done}/${card.items.length}</label><div class="detail-flds">${card.items.map(it=>`<div class="detail-cl-item${it.done?' done':''}"><input type="checkbox" data-cid="${card.id}" data-iid="${it.id}" ${it.done?'checked':''}><span>${esc(it.text)}</span></div>`).join('')}</div></div>`;
  }
  const nf=card.nf||[];
  if(nf.length)body+=`<div class="fg"><label class="fl">Fields</label><div class="detail-flds">${nf.map(f=>fDisplayHTML(f)).join('')}</div></div>`;
  if(card.note)body+=`<div class="fg"><label class="fl">Note</label><div class="card-note">${esc(card.note).replace(/\n/g,'<br>')}</div></div>`;
  body+=`<div class="act-row"><button class="act-btn" onclick="dupCard('${card.id}')">Duplicate</button><button class="act-btn danger" onclick="delCard('${card.id}')">Delete</button></div>`;
  document.getElementById('d-body').innerHTML=body;
  document.querySelectorAll('#d-body .detail-cl-item input').forEach(cb=>cb.addEventListener('change',()=>{toggleCheck(cb.dataset.cid,cb.dataset.iid,cb.checked);openDetail(id);}));
  openModal('modal-detail');
}

function editFromDetail(){
  const id=document.getElementById('modal-detail').dataset.cid;
  closeModal('modal-detail');
  setTimeout(()=>openEdit(id),200);
}

function delCard(id){
  if(!confirm('Delete this board?'))return;
  cards=cards.filter(c=>c.id!==id);
  save();
  renderFolderBoards();
  renderFolders();
  closeModal('modal-detail');
  if(activeBoardId===id){
    document.getElementById('view-board').classList.remove('active');
    document.getElementById('view-boards').classList.add('active');
  }
  toast('Deleted');
}

function dupCard(id){
  const c=cards.find(x=>x.id===id);
  if(!c)return;
  const dup={...JSON.parse(JSON.stringify(c)),id:uid(),title:c.title+' (copy)'};
  const i=cards.findIndex(x=>x.id===id);
  cards.splice(i+1,0,dup);
  save();
  renderFolderBoards();
  renderFolders();
  closeModal('modal-detail');
  toast('Duplicated');
}

function dupSubcard(subId){
  const board=cards.find(c=>c.id===activeBoardId);
  if(!board?.subcards)return;
  const sub=board.subcards.find(c=>c.id===subId);
  if(!sub)return;
  const dup={...JSON.parse(JSON.stringify(sub)),id:uid(),title:sub.title+' (copy)'};
  const i=board.subcards.findIndex(c=>c.id===subId);
  board.subcards.splice(i+1,0,dup);
  save();
  renderBoardCards(board);
  renderFolderBoards();
  toast('Duplicated');
}

function delSubcard(subId){
  const board=cards.find(c=>c.id===activeBoardId);
  if(!board?.subcards)return;
  if(!confirm('Delete this card?'))return;
  board.subcards=board.subcards.filter(c=>c.id!==subId);
  save();
  renderBoardCards(board);
  renderFolderBoards();
  toast('Deleted');
}

function showCtx(e,id){
  ctxId=id;
  const m=document.getElementById('ctx');
  m.classList.add('open');
  let x=e.clientX,y=e.clientY;
  if(x+160>innerWidth)x=innerWidth-162;
  if(y+120>innerHeight-80)y=y-120;
  m.style.left=x+'px';
  m.style.top=y+'px';
}

function showSubcardCtx(e,id){
  e.stopPropagation();
  ctxKind='subcard';
  showCtx(e,id);
}

function closeCtx(){document.getElementById('ctx').classList.remove('open');}
function ctxEdit(){closeCtx();ctxKind==='subcard'?openSubcardEdit(ctxId):openEdit(ctxId);}
function ctxDup(){closeCtx();ctxKind==='subcard'?dupSubcard(ctxId):dupCard(ctxId);}
function ctxDel(){closeCtx();ctxKind==='subcard'?delSubcard(ctxId):delCard(ctxId);}

function getActiveReorderContainer(){
  if(curView==='boards')return document.getElementById('boards-grid');
  if(curView==='board')return document.getElementById('board-cards');
  return null;
}

function updateReorderButtons(){
  document.getElementById('reorder-btn')?.classList.toggle('active',reorder&&curView==='board');
  document.getElementById('boards-reorder-btn')?.classList.toggle('active',reorder&&curView==='boards');
  document.querySelectorAll('.trille-reorder-active').forEach(el=>el.classList.remove('trille-reorder-active'));
  if(reorder)getActiveReorderContainer()?.classList.add('trille-reorder-active');
}

function toggleReorder(scope){
  const target=scope||curView;
  reorder=curView===target?!reorder:true;
  curView=target;
  updateReorderButtons();
  toast(reorder?'Hold a card, then drag':'Reorder off');
}

function shouldSkipDragTarget(target){
  return !!target.closest('.mbtn-wrap,input,button,label,a,textarea,select,.ci,.detail-cl-item');
}

function findClosestReorderTarget(container,selector,x,y,dragged){
  let closest=null;
  let closestDistance=Infinity;
  container.querySelectorAll(selector).forEach(item=>{
    if(item===dragged)return;
    const rect=item.getBoundingClientRect();
    const cx=rect.left+rect.width/2;
    const cy=rect.top+rect.height/2;
    const distance=Math.hypot(x-cx,y-cy);
    if(distance<closestDistance){
      closestDistance=distance;
      closest=item;
    }
  });
  return closest;
}

function placeDraggedItem(container,selector,dragged,x,y){
  const target=findClosestReorderTarget(container,selector,x,y,dragged);
  if(!target){
    container.appendChild(dragged);
    return;
  }
  const rect=target.getBoundingClientRect();
  const sameRow=Math.abs(y-(rect.top+rect.height/2))<rect.height/2;
  const after=sameRow?x>rect.left+rect.width/2:y>rect.top+rect.height/2;
  if(after)target.after(dragged);
  else container.insertBefore(dragged,target);
}

function bindScopedLongPressReorder(container,selector,commitOrder){
  if(!container)return;
  container.querySelectorAll(selector).forEach(el=>{
    let holdTimer=null;
    let dragging=false;
    let moved=false;
    let pointerId=null;
    let startX=0;
    let startY=0;
    const clearHold=()=>{if(holdTimer){clearTimeout(holdTimer);holdTimer=null;}};
    const cancel=()=>{
      clearHold();
      if(dragging)el.classList.remove('trille-reorder-dragging');
      dragging=false;
      moved=false;
      pointerId=null;
    };
    const finish=()=>{
      clearHold();
      if(dragging&&moved){
        commitOrder([...container.querySelectorAll(selector)].map(item=>item.dataset.id));
      }else if(dragging){
        el.classList.remove('trille-reorder-dragging');
      }
      dragging=false;
      moved=false;
      pointerId=null;
    };
    const scrollParent=el.closest('.scroll');
    el.addEventListener('pointerdown',e=>{
      if(!reorder||shouldSkipDragTarget(e.target))return;
      startX=e.clientX;
      startY=e.clientY;
      pointerId=e.pointerId;
      clearHold();
      holdTimer=setTimeout(()=>{
        if(!reorder)return;
        dragging=true;
        moved=false;
        el.classList.add('trille-reorder-dragging');
        try{el.setPointerCapture(pointerId);}catch(err){}
        if(navigator.vibrate)navigator.vibrate(8);
      },260);
      scrollParent?.addEventListener('scroll',cancel,{once:true,passive:true});
    },{passive:true});
    el.addEventListener('pointermove',e=>{
      if(!holdTimer&&!dragging)return;
      if(!dragging&&Math.hypot(e.clientX-startX,e.clientY-startY)>10){cancel();return;}
      if(!dragging)return;
      e.preventDefault();
      moved=true;
      placeDraggedItem(container,selector,el,e.clientX,e.clientY);
    });
    el.addEventListener('pointerup',finish);
    el.addEventListener('pointercancel',cancel);
  });
}

function applyBoardOrder(ids){
  const folderIds=new Set(cards.filter(c=>c.folderId===activeFolderId).map(c=>c.id));
  const ordered=ids.filter(id=>folderIds.has(id));
  const rank=new Map(ordered.map((id,i)=>[id,i]));
  cards.sort((a,b)=>{
    const ar=rank.has(a.id),br=rank.has(b.id);
    if(ar&&br)return rank.get(a.id)-rank.get(b.id);
    if(ar)return -1;
    if(br)return 1;
    return 0;
  });
  save();
  renderFolderBoards();
}

function applySubcardOrder(ids){
  const board=cards.find(c=>c.id===activeBoardId);
  if(!board?.subcards)return;
  const map=new Map(board.subcards.map(c=>[c.id,c]));
  board.subcards=ids.map(id=>map.get(id)).filter(Boolean);
  save();
  renderBoardCards(board);
  renderFolderBoards();
}

function bindBoardListReorder(){
  bindScopedLongPressReorder(document.getElementById('boards-grid'),'.board-item',applyBoardOrder);
}

function bindSubcardReorder(){
  bindScopedLongPressReorder(document.getElementById('board-cards'),'.card[data-subcard-id]',applySubcardOrder);
}

function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
function ovClose(e,id){if(e.target===document.getElementById(id))closeModal(id);}

function openFolderModal(){
  editFolderId=null;
  document.getElementById('modal-folder-title').textContent='New Folder';
  document.getElementById('folder-name-in').value='';
  document.getElementById('folder-save-lbl').textContent='Create Folder';
  document.getElementById('folder-del-btn').classList.add('hidden');
  openModal('modal-folder');
  setTimeout(()=>document.getElementById('folder-name-in').focus(),200);
}

function editFolder(fid){
  const f=folders.find(x=>x.id===fid);
  if(!f)return;
  editFolderId=fid;
  document.getElementById('modal-folder-title').textContent='Edit Folder';
  document.getElementById('folder-name-in').value=f.name;
  document.getElementById('folder-save-lbl').textContent='Save';
  document.getElementById('folder-del-btn').classList.remove('hidden');
  openModal('modal-folder');
}

function saveFolder(){
  const name=document.getElementById('folder-name-in').value.trim();
  if(!name){toast('Add a name');return;}
  if(editFolderId){
    const i=folders.findIndex(f=>f.id===editFolderId);
    if(i!==-1)folders[i]={...folders[i],name};
    toast('Folder saved');
  }else{
    folders.push({id:uid(),name});
    toast('Folder created');
  }
  save();
  closeModal('modal-folder');
  renderHome();
}

function deleteFolder(){
  if(!editFolderId)return;
  if(!confirm('Delete folder and all its boards?'))return;
  cards=cards.filter(c=>c.folderId!==editFolderId);
  folders=folders.filter(f=>f.id!==editFolderId);
  save();
  closeModal('modal-folder');
  if(activeFolderId===editFolderId)goHome();
  else renderHome();
  toast('Deleted');
}

function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2200);
}
