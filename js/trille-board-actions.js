function toggleCheck(cid,iid,v){const c=cards.find(x=>x.id===cid);const it=c?.items?.find(x=>x.id===iid);if(it){it.done=v;save();if(activeBoardId===cid)renderBoardCards(c);renderFolderBoards();}}

let addSourceView=null;
function openAdd(){
  editId=null;clItems=[{id:uid(),text:'',done:false}];nfFields=[];selType='habit';
  addSourceView=curView;
  document.getElementById('modal-add-title').textContent='New Card';
  document.getElementById('save-lbl').textContent='Create Card';
  document.getElementById('f-title').value='';document.getElementById('f-desc').value='';
  renderTypeGrid();selectType('habit');openModal('modal-add');
  setTimeout(()=>document.getElementById('f-title').focus(),200);
}
function openEdit(id){
  const card=cards.find(c=>c.id===id);if(!card)return;
  editId=id;selType=card.type;addSourceView=curView;
  clItems=(card.items||[]).map(i=>({...i}));if(!clItems.length)clItems=[{id:uid(),text:'',done:false}];
  nfFields=(card.nf||[]).map(f=>({...f,value:Array.isArray(f.value)?[...f.value]:f.value}));
  document.getElementById('modal-add-title').textContent='Edit Card';
  document.getElementById('save-lbl').textContent='Save Changes';
  document.getElementById('f-title').value=card.title||'';document.getElementById('f-desc').value=card.desc||'';
  renderTypeGrid();selectType(card.type,card);openModal('modal-add');
}

function rerenderCardSourceView(){
  const source = addSourceView || curView;

  if (source === 'board' && activeBoardId) {
    const card = cards.find(c => c.id === activeBoardId);
    if (card) {
      openBoard(activeBoardId);
      return;
    }
  }

  if (source === 'boards' && activeFolderId) {
    renderFolderBoards();
    document.getElementById('view-home')?.classList.remove('active');
    document.getElementById('view-board')?.classList.remove('active');
    document.getElementById('view-boards')?.classList.add('active');
    document.querySelectorAll('.nbtn').forEach(b => b.classList.remove('active'));
    curView = 'boards';
    return;
  }

  switchView(source || 'home');
}

function saveCard(){
  const title=document.getElementById('f-title').value.trim();if(!title){toast('Add a title');return;}
  document.querySelectorAll('.clrow input[type=text]').forEach((inp,i)=>{if(clItems[i])clItems[i].text=inp.value;});
  nfFields.forEach((f,i)=>{if(f.type==='multi'){const inp=document.getElementById('nfmin-'+f.id);if(inp&&inp.value.trim()){if(!Array.isArray(f.value))f.value=[];f.value.push(inp.value.trim());}}});
  const d={title,desc:document.getElementById('f-desc').value.trim(),type:selType,note:document.getElementById('f-note')?.value.trim()||'',nf:nfFields};
  if(selType==='habit')d.items=clItems.filter(i=>i.text.trim());
  if(editId){
    const i=cards.findIndex(c=>c.id===editId);if(i!==-1)cards[i]={...cards[i],...d};
    toast('Saved');
    // refresh whichever view we came from
    if(addSourceView==='board'&&activeBoardId===editId){
      const card=cards.find(c=>c.id===activeBoardId);
      if(card){document.getElementById('board-title-el').textContent=card.title;document.getElementById('board-desc-el').textContent=card.desc||'';renderBoardCards(card);}
    } else if(addSourceView==='boards'){
      renderFolderBoards();
    }
  } else {
    const fid=activeFolderId||(folders[0]?.id);
    cards.push({id:uid(),folderId:fid,...d});
    toast('Card created');
    // only refresh the list behind the modal, don't navigate
    if(addSourceView==='board'){
      // new card was added to folder, stay on board view — just refresh boards list silently
      renderFolderBoards();
    } else {
      renderFolderBoards();
    }
    renderFolders();
  }
  save();closeModal('modal-add');

  rerenderCardSourceView();
  addSourceView = null;
}

function openDetail(id){
  const card=cards.find(c=>c.id===id);if(!card)return;
  document.getElementById('modal-detail').dataset.cid=id;
  document.getElementById('d-tag').textContent=(TYPES[card.type]||TYPES.custom).label;
  document.getElementById('d-title').textContent=card.title;
  document.getElementById('d-desc').textContent=card.desc||'';
  let body='';
  if(card.type==='habit'&&(card.items||[]).length){const done=card.items.filter(i=>i.done).length;body+=`<div class="fg"><label class="fl">Activities — ${done}/${card.items.length}</label><div class="detail-flds">${card.items.map(it=>`<div class="detail-cl-item${it.done?' done':''}"><input type="checkbox" data-cid="${card.id}" data-iid="${it.id}" ${it.done?'checked':''}><span>${esc(it.text)}</span></div>`).join('')}</div></div>`;}
  const nf=card.nf||[];
  if(nf.length)body+=`<div class="fg"><label class="fl">Fields</label><div class="detail-flds">${nf.map(f=>fDisplayHTML(f)).join('')}</div></div>`;
  if(card.note)body+=`<div class="fg"><label class="fl">Note</label><div class="card-note">${esc(card.note).replace(/\n/g,'<br>')}</div></div>`;
  body+=`<div class="act-row"><button class="act-btn" onclick="dupCard('${card.id}')">Duplicate</button><button class="act-btn danger" onclick="delCard('${card.id}')">Delete</button></div>`;
  document.getElementById('d-body').innerHTML=body;
  document.querySelectorAll('#d-body .detail-cl-item input').forEach(cb=>cb.addEventListener('change',()=>{toggleCheck(cb.dataset.cid,cb.dataset.iid,cb.checked);openDetail(id);}));
  openModal('modal-detail');
}
function editFromDetail(){const id=document.getElementById('modal-detail').dataset.cid;closeModal('modal-detail');setTimeout(()=>openEdit(id),200);}
function delCard(id){if(!confirm('Delete this card?'))return;cards=cards.filter(c=>c.id!==id);save();renderFolderBoards();renderFolders();closeModal('modal-detail');if(activeBoardId===id){document.getElementById('view-board').classList.remove('active');document.getElementById('view-boards').classList.add('active');}toast('Deleted');}
function dupCard(id){const c=cards.find(x=>x.id===id);if(!c)return;const dup={...JSON.parse(JSON.stringify(c)),id:uid(),title:c.title+' (copy)'};const i=cards.findIndex(x=>x.id===id);cards.splice(i+1,0,dup);save();renderFolderBoards();renderFolders();closeModal('modal-detail');toast('Duplicated');}

function showCtx(e,id){ctxId=id;const m=document.getElementById('ctx');m.classList.add('open');let x=e.clientX,y=e.clientY;if(x+160>innerWidth)x=innerWidth-162;if(y+120>innerHeight-80)y=y-120;m.style.left=x+'px';m.style.top=y+'px';}
function closeCtx(){document.getElementById('ctx').classList.remove('open');}
function ctxEdit(){closeCtx();openEdit(ctxId);}
function ctxDup(){closeCtx();dupCard(ctxId);}
function ctxDel(){closeCtx();delCard(ctxId);}

function toggleReorder(){reorder=!reorder;document.getElementById('reorder-btn').style.color=reorder?'var(--ink)':'';toast(reorder?'Drag to reorder':'Reorder off');}

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
  const f=folders.find(x=>x.id===fid);if(!f)return;
  editFolderId=fid;
  document.getElementById('modal-folder-title').textContent='Edit Folder';
  document.getElementById('folder-name-in').value=f.name;
  document.getElementById('folder-save-lbl').textContent='Save';
  document.getElementById('folder-del-btn').classList.remove('hidden');
  openModal('modal-folder');
}
function saveFolder(){
  const name=document.getElementById('folder-name-in').value.trim();if(!name){toast('Add a name');return;}
  if(editFolderId){const i=folders.findIndex(f=>f.id===editFolderId);if(i!==-1)folders[i]={...folders[i],name};toast('Folder saved');}
  else{folders.push({id:uid(),name});toast('Folder created');}
  save();closeModal('modal-folder');renderHome();
}
function deleteFolder(){
  if(!editFolderId)return;
  if(!confirm('Delete folder and all its boards?'))return;
  cards=cards.filter(c=>c.folderId!==editFolderId);
  folders=folders.filter(f=>f.id!==editFolderId);
  save();closeModal('modal-folder');if(activeFolderId===editFolderId)goHome();else renderHome();toast('Deleted');
}

function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
