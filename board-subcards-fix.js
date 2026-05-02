function renderBoardCards(card){
  const list=document.getElementById('board-cards');
  let html='';

  const subcards=card.subcards||[];
  if(subcards.length){
    html+=subcards.map(sc=>subcardHTML(sc,card.id)).join('');
  }

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

  list.innerHTML=html;
  list.querySelectorAll('.ci input').forEach(cb=>cb.addEventListener('change',e=>{
    e.stopPropagation();
    toggleCheck(card.id,cb.dataset.iid,cb.checked);
  }));
}

function subcardHTML(sc,parentId){
  const type=(TYPES[sc.type]||TYPES.custom).label;
  const fields=(sc.nf||[]).length?`<div class="flds">${sc.nf.map(f=>fDisplayHTML(f)).join('')}</div>`:'';
  const checklist=(sc.type==='habit'&&sc.items?.length)?`<div class="cl">${sc.items.map(it=>`<label class="ci${it.done?' done':''}"><input type="checkbox" disabled ${it.done?'checked':''}><span>${esc(it.text)}</span></label>`).join('')}</div>`:'';
  const note=sc.note?`<div class="card-note">${esc(sc.note).replace(/\n/g,'<br>')}</div>`:'';
  const delBtn=`<div class="mbtn-wrap" onclick="event.stopPropagation();deleteSubcard('${parentId}','${sc.id}')"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></div>`;
  return `<div class="card"><div class="card-top"><div class="card-left"><div class="type-tag">${type}</div><div class="card-title">${esc(sc.title)}</div>${sc.desc?`<div class="card-desc">${esc(sc.desc)}</div>`:''}</div>${delBtn}</div>${checklist}${fields}${note}</div>`;
}

function deleteSubcard(parentId,subcardId){
  const parent=cards.find(c=>c.id===parentId);
  if(!parent||!Array.isArray(parent.subcards))return;
  parent.subcards=parent.subcards.filter(sc=>sc.id!==subcardId);
  save();
  renderBoardCards(parent);
  toast('Deleted');
}

function saveCard(){
  const title=document.getElementById('f-title').value.trim();
  if(!title){toast('Add a title');return;}

  document.querySelectorAll('.clrow input[type=text]').forEach((inp,i)=>{
    if(clItems[i])clItems[i].text=inp.value;
  });

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
    type:selType,
    note:document.getElementById('f-note')?.value||'',
    items:selType==='habit'?clItems.filter(i=>i.text.trim()).map(i=>({...i,text:i.text.trim()})):[],
    nf:nfFields.filter(f=>f.key.trim()).map(f=>({...f,key:f.key.trim()}))
  };

  if(editId){
    const idx=cards.findIndex(c=>c.id===editId);
    if(idx>-1)cards[idx]={...cards[idx],...d};
  }else if(addSourceView==='board'&&activeBoardId){
    const parent=cards.find(c=>c.id===activeBoardId);
    if(parent){
      if(!Array.isArray(parent.subcards))parent.subcards=[];
      parent.subcards.push({id:uid(),...d});
    }
  }else{
    cards.push({id:uid(),folderId:activeFolderId||folders[0]?.id,...d});
  }

  save();
  rerenderCardSourceView();
  addSourceView=null;
  closeModal('modal-add');
  toast('Saved');
}
