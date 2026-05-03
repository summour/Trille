function removeTypeEditor(){document.getElementById('type-grid')?.closest('.fg')?.remove();}
function renderTypeGrid(){removeTypeEditor();}
function selectType(t,card){renderDyn(card);}

function activitiesEditorHTML(){
  return `<div class="fg"><label class="fl">Activities</label><div class="cled" id="cl-editor">${clItems.map((it,i)=>`<div class="clrow" draggable="true" data-cli="${i}"><span class="drag-handle" aria-label="drag">⠿</span><input type="text" placeholder="Activity..." value="${esc(it.text)}" oninput="clItems[${i}].text=this.value" onkeydown="clKey(event,${i})"><button class="delbtn" onclick="clDel(${i})"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`).join('')}</div><button class="addbtn" onclick="clAdd()">+ Add activity</button></div>`;
}
function tagsEditorHTML(card){
  return `<div class="fg"><label class="fl">Hashtags</label><input class="fi" id="f-tags" placeholder="#work #idea #urgent" value="${esc(tagsToInput(card?.tags||[]))}"></div>`;
}
function getBoardCardOptions(card){
  if(curView!=='board'&&!activeBoardId)return [];
  const board=cards.find(c=>c.id===activeBoardId);
  const currentId=card?.id||editSubcardId;
  return (board?.subcards||[]).filter(item=>item.id!==currentId);
}
function linkedCardsEditorHTML(card){
  if((curView!=='board'&&!activeBoardId)||editId)return '';
  const options=getBoardCardOptions(card);
  if(!options.length)return `<div class="fg"><label class="fl">Linked cards</label><div class="Trille-linked-empty">Create another card in this board to link workflow steps.</div></div>`;
  return `<div class="fg"><label class="fl">Linked cards</label><div class="Trille-linked-editor">${options.map(item=>`<label class="Trille-linked-option"><input type="checkbox" value="${item.id}" ${linkedCardIds.includes(item.id)?'checked':''} onchange="toggleLinkedCard('${item.id}',this.checked)"><span>${esc(item.title)}</span></label>`).join('')}</div></div>`;
}
function toggleLinkedCard(id,checked){
  if(checked){
    if(!linkedCardIds.includes(id))linkedCardIds.push(id);
  }else{
    linkedCardIds=linkedCardIds.filter(item=>item!==id);
  }
}
function renderDyn(card){
  removeTypeEditor();
  let h=tagsEditorHTML(card);
  h+=linkedCardsEditorHTML(card);
  h+=activitiesEditorHTML();
  h+=`<div class="fg"><label class="fl">Note</label><textarea class="fi" id="f-note" rows="2" placeholder="Notes...">${esc(card?.note||'')}</textarea></div>`;
  h+=`<div class="fg"><label class="fl">Fields</label><div class="nf-editor" id="nf-editor">${nfFields.map((f,i)=>nfRowHTML(f,i)).join('')}</div><button class="addbtn" onclick="nfAdd()">+ Add field</button></div>`;
  document.getElementById('dyn-fields').innerHTML=h;
  bindClReorder();
  bindNfReorder();
}

// ---- Activity (cl) reorder ----
let clDragIdx=null;
function bindClReorder(){
  const editor=document.getElementById('cl-editor');
  if(!editor)return;
  editor.querySelectorAll('.clrow').forEach(row=>{
    row.addEventListener('dragstart',e=>{
      clDragIdx=parseInt(row.dataset.cli);
      row.classList.add('Trille-field-reorder-dragging');
      e.dataTransfer.effectAllowed='move';
    });
    row.addEventListener('dragend',()=>{
      row.classList.remove('Trille-field-reorder-dragging');
      clDragIdx=null;
    });
    row.addEventListener('dragover',e=>{
      e.preventDefault();
      const target=e.currentTarget;
      const targetIdx=parseInt(target.dataset.cli);
      if(clDragIdx===null||clDragIdx===targetIdx)return;
      const moved=clItems.splice(clDragIdx,1)[0];
      clItems.splice(targetIdx,0,moved);
      clDragIdx=targetIdx;
      renderDyn();
    });
    // Touch-based long-press drag for activities
    let clTouchTimer=null,clTouchSrcIdx=null;
    const handle=row.querySelector('.drag-handle');
    if(handle){
      handle.addEventListener('touchstart',e=>{
        const idx=parseInt(row.dataset.cli);
        clTouchTimer=setTimeout(()=>{
          clTouchSrcIdx=idx;
          row.classList.add('Trille-field-reorder-dragging');
          if(navigator.vibrate)navigator.vibrate(6);
        },220);
      },{passive:true});
      handle.addEventListener('touchmove',e=>{
        if(clTouchSrcIdx===null)return;
        e.preventDefault();
        const touch=e.touches[0];
        const els=document.elementsFromPoint(touch.clientX,touch.clientY);
        const targetRow=els.find(el=>el.classList.contains('clrow')&&el!==row);
        if(targetRow){
          const targetIdx=parseInt(targetRow.dataset.cli);
          if(targetIdx!==clTouchSrcIdx){
            const moved=clItems.splice(clTouchSrcIdx,1)[0];
            clItems.splice(targetIdx,0,moved);
            clTouchSrcIdx=targetIdx;
            renderDyn();
          }
        }
      },{passive:false});
      handle.addEventListener('touchend',()=>{
        clearTimeout(clTouchTimer);
        row.classList.remove('Trille-field-reorder-dragging');
        clTouchSrcIdx=null;
      },{passive:true});
      handle.addEventListener('touchcancel',()=>{
        clearTimeout(clTouchTimer);
        row.classList.remove('Trille-field-reorder-dragging');
        clTouchSrcIdx=null;
      },{passive:true});
    }
  });
}

// ---- Field (nf) reorder ----
let nfDragIdx=null;
function bindNfReorder(){
  const editor=document.getElementById('nf-editor');
  if(!editor)return;
  editor.querySelectorAll('.nf-row').forEach((row,i)=>{
    row.setAttribute('draggable','true');
    row.dataset.nfi=i;
    row.addEventListener('dragstart',e=>{
      // Only start drag from handle
      if(!e.target.closest('.nf-drag-handle'))return;
      nfDragIdx=i;
      row.classList.add('Trille-field-reorder-dragging');
      e.dataTransfer.effectAllowed='move';
    });
    row.addEventListener('dragend',()=>{
      row.classList.remove('Trille-field-reorder-dragging');
      nfDragIdx=null;
    });
    row.addEventListener('dragover',e=>{
      if(nfDragIdx===null)return;
      e.preventDefault();
      const targetIdx=parseInt(row.dataset.nfi);
      if(nfDragIdx===targetIdx)return;
      const moved=nfFields.splice(nfDragIdx,1)[0];
      nfFields.splice(targetIdx,0,moved);
      nfDragIdx=targetIdx;
      renderDyn();
    });
    // Touch reorder for fields
    const handle=row.querySelector('.nf-drag-handle');
    if(handle){
      let nfTouchTimer=null,nfTouchSrcIdx=null;
      handle.addEventListener('touchstart',e=>{
        const idx=parseInt(row.dataset.nfi);
        nfTouchTimer=setTimeout(()=>{
          nfTouchSrcIdx=idx;
          row.classList.add('Trille-field-reorder-dragging');
          if(navigator.vibrate)navigator.vibrate(6);
        },220);
      },{passive:true});
      handle.addEventListener('touchmove',e=>{
        if(nfTouchSrcIdx===null)return;
        e.preventDefault();
        const touch=e.touches[0];
        const els=document.elementsFromPoint(touch.clientX,touch.clientY);
        const targetRow=els.find(el=>el.classList.contains('nf-row')&&el!==row);
        if(targetRow){
          const targetIdx=parseInt(targetRow.dataset.nfi);
          if(targetIdx!==nfTouchSrcIdx){
            const moved=nfFields.splice(nfTouchSrcIdx,1)[0];
            nfFields.splice(targetIdx,0,moved);
            nfTouchSrcIdx=targetIdx;
            renderDyn();
          }
        }
      },{passive:false});
      handle.addEventListener('touchend',()=>{
        clearTimeout(nfTouchTimer);
        row.classList.remove('Trille-field-reorder-dragging');
        nfTouchSrcIdx=null;
      },{passive:true});
      handle.addEventListener('touchcancel',()=>{
        clearTimeout(nfTouchTimer);
        row.classList.remove('Trille-field-reorder-dragging');
        nfTouchSrcIdx=null;
      },{passive:true});
    }
  });
}

function nfLockedAttrs(){return 'readonly data-trille-edit-locked="1" onclick="fieldEditTap(this,event)" onblur="lockFieldInput(this)"';}
function nfRowHTML(f,i){const sym=FT[f.type]?FT[f.type].sym:'T';return `<div class="nf-row" id="nfrow-${f.id}" data-nfi="${i}"><div class="nf-drag-handle Trille-field-drag-handle" title="Drag to reorder">⠿</div><button class="nf-type-btn" onclick="openPicker('${f.id}',${i})" title="${FT[f.type]?.label||'Text'}">${sym}</button><input class="nf-key" type="text" placeholder="Name" value="${esc(f.key)}" ${nfLockedAttrs()} oninput="nfFields[${i}].key=this.value"><div class="nf-val-wrap">${nfValHTML(f,i)}</div><button class="delbtn" onclick="nfDel(${i})"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`;}

function fieldEditTap(el,e){
  const now=Date.now();
  const last=parseInt(el.dataset.trilleLastTap||'0',10);
  if(now-last<450){
    el.readOnly=false;
    el.dataset.trilleEditLocked='0';
    setTimeout(()=>{
      el.focus();
      if(el.setSelectionRange&&typeof el.value==='string'){
        const end=el.value.length;
        el.setSelectionRange(end,end);
      }
    },0);
    return;
  }
  el.dataset.trilleLastTap=String(now);
  if(e)e.preventDefault();
  el.blur();
}
function lockFieldInput(el){
  el.readOnly=true;
  el.dataset.trilleEditLocked='1';
}

function nfValHTML(f,i){
  const v=f.value;
  switch(f.type){
    case 'text':return `<input class="nf-in" type="text" placeholder="Value..." value="${esc(v||'')}" ${nfLockedAttrs()} oninput="nfFields[${i}].value=this.value">`;
    case 'number':return `<input class="nf-in" type="number" placeholder="0" value="${v!==undefined?v:''}" ${nfLockedAttrs()} oninput="nfFields[${i}].value=parseFloat(this.value)||0">`;
    case 'date':return `<input class="nf-in" type="date" value="${v||''}" style="color:var(--ink)" ${nfLockedAttrs()} oninput="nfFields[${i}].value=this.value">`;
    case 'select':{const opts=['To Do','In Progress','Done','Blocked','On Hold','Not Started','Cancelled'];return `<select class="nf-in" onchange="nfFields[${i}].value=this.value"><option value="">— select —</option>${opts.map(o=>`<option value="${o}"${v===o?' selected':''}>${o}</option>`).join('')}${v&&!opts.includes(v)?`<option value="${esc(v)}" selected>${esc(v)}</option>`:''}</select>`;}
    case 'multi':return nfMultiHTML(f,i);
    case 'check':return `<div class="nf-check-wrap"><input type="checkbox" ${v?'checked':''} onchange="nfFields[${i}].value=this.checked;this.nextElementSibling.textContent=this.checked?'Yes':'No'"><span class="nf-check-label">${v?'Yes':'No'}</span></div>`;
    case 'url':return `<input class="nf-in" type="url" placeholder="https://..." value="${esc(v||'')}" ${nfLockedAttrs()} oninput="nfFields[${i}].value=this.value">`;
    case 'email':return `<input class="nf-in" type="email" placeholder="email@..." value="${esc(v||'')}" ${nfLockedAttrs()} oninput="nfFields[${i}].value=this.value">`;
    case 'phone':return `<input class="nf-in" type="tel" placeholder="+66..." value="${esc(v||'')}" ${nfLockedAttrs()} oninput="nfFields[${i}].value=this.value">`;
    case 'person':return `<input class="nf-in" type="text" placeholder="Name..." value="${esc(v||'')}" ${nfLockedAttrs()} oninput="nfFields[${i}].value=this.value">`;
    case 'rating':return nfRatingHTML(f,i);
    case 'progress':return `<div class="nf-prog-wrap"><input type="range" min="0" max="100" value="${parseInt(v)||0}" oninput="nfFields[${i}].value=parseInt(this.value);this.nextElementSibling.textContent=this.value+'%'"><span class="nf-prog-n">${parseInt(v)||0}%</span></div>`;
    case 'formula':return `<input class="nf-in" type="text" placeholder="formula..." value="${esc(v||'')}" style="font-style:italic;color:var(--ink3)" ${nfLockedAttrs()} oninput="nfFields[${i}].value=this.value">`;
    case 'file':return `<div class="nf-file-wrap"><span class="nf-file-name">${v?esc(v):'No file'}</span><label class="nf-file-lbl">Upload<input type="file" style="display:none" onchange="nfFields[${i}].value=this.files[0]?.name||''"></label></div>`;
    case 'longtext':return `<textarea class="nf-in" rows="3" placeholder="Long text..." ${nfLockedAttrs()} oninput="nfFields[${i}].value=this.value" style="resize:vertical">${esc(v||'')}</textarea>`;
    default:return `<input class="nf-in" type="text" placeholder="Value..." value="${esc(v||'')}" ${nfLockedAttrs()} oninput="nfFields[${i}].value=this.value">`;
  }
}

function nfMultiHTML(f,i){const tags=Array.isArray(f.value)?f.value:[];return `<div class="nf-multi" id="nfm-${f.id}">${tags.map((t,ti)=>`<span class="nf-tag">${esc(t)}<button class="nf-tag-del" onclick="tagDel('${f.id}',${i},${ti})">×</button></span>`).join('')}<input class="nf-multi-in" id="nfmin-${f.id}" placeholder="${tags.length?'':'Add, Enter'}" ${nfLockedAttrs()} onkeydown="tagKey(event,'${f.id}',${i})"></div>`;}
function nfRatingHTML(f,i){const n=parseInt(f.value)||0;return `<div class="nf-rating">${[1,2,3,4,5].map(s=>`<span class="nf-star${s<=n?' on':''}" data-s="${s}" onclick="setRating(${i},${s},'${f.id}')">★</span>`).join('')}</div>`;}
function setRating(idx,val,fid){nfFields[idx].value=val;document.querySelectorAll('#nfrow-'+fid+' .nf-star').forEach(s=>s.classList.toggle('on',parseInt(s.dataset.s)<=val));}
function tagKey(e,fid,idx){if(e.key==='Enter'||e.key===','||e.key==='Tab'){e.preventDefault();const v=e.target.value.trim();if(v){if(!Array.isArray(nfFields[idx].value))nfFields[idx].value=[];nfFields[idx].value.push(v);e.target.value='';const wrap=document.getElementById('nfm-'+fid);if(wrap)wrap.outerHTML=nfMultiHTML(nfFields[idx],idx);}}}
function tagDel(fid,idx,ti){if(!Array.isArray(nfFields[idx].value))return;nfFields[idx].value.splice(ti,1);const wrap=document.getElementById('nfm-'+fid);if(wrap)wrap.outerHTML=nfMultiHTML(nfFields[idx],idx);}
function nfAdd(){const f={id:uid(),key:'',type:'text',value:''};nfFields.push(f);const ed=document.getElementById('nf-editor');if(ed){const tmp=document.createElement('div');tmp.innerHTML=nfRowHTML(f,nfFields.length-1);ed.appendChild(tmp.firstElementChild);}bindNfReorder();}
function nfDel(i){nfFields.splice(i,1);renderDyn();}

function openPicker(fid,idx){if(activePicker===fid){closePicker();return;}activePicker=fid;const popup=document.getElementById('ft-popup');popup.innerHTML=FT_GROUPS.map(g=>`<div class="ftp-sec">${g.sec}</div>`+g.keys.map(k=>`<div class="ftp-item" onclick="setFType('${fid}',${idx},'${k}')"><span class="ftp-icon">${FT[k].sym}</span>${FT[k].label}</div>`).join('')).join('');const btn=document.querySelector('#nfrow-'+fid+' .nf-type-btn');if(!btn)return;const r=btn.getBoundingClientRect();popup.style.left=Math.min(r.left,innerWidth-210)+'px';popup.style.top=Math.min(r.bottom+4,innerHeight-320)+'px';popup.classList.add('open');}
function closePicker(){activePicker=null;document.getElementById('ft-popup').classList.remove('open');}
function setFType(fid,idx,type){nfFields[idx].type=type;nfFields[idx].value=defVal(type);closePicker();const row=document.getElementById('nfrow-'+fid);if(row){const sym=FT[type]?.sym||'T';row.querySelector('.nf-type-btn').innerHTML=sym;row.querySelector('.nf-type-btn').title=FT[type]?.label||type;const vw=row.querySelector('.nf-val-wrap');if(vw)vw.innerHTML=nfValHTML(nfFields[idx],idx);}}

document.addEventListener('click',e=>{if(activePicker&&!e.target.closest('.nf-type-btn')&&!e.target.closest('#ft-popup'))closePicker();if(!e.target.closest('#ctx')&&!e.target.closest('.mbtn-wrap'))closeCtx();});

function clKey(e,i){if(e.key==='Enter'){e.preventDefault();clAdd(i);}}
function clAdd(after){const it={id:uid(),text:'',done:false};if(after!==undefined)clItems.splice(after+1,0,it);else clItems.push(it);renderDyn();setTimeout(()=>{const rows=document.querySelectorAll('.clrow input[type=text]');const t=rows[after!==undefined?after+1:rows.length-1];if(t)t.focus();},30);}
function clDel(i){if(clItems.length>1){clItems.splice(i,1);renderDyn();}}

function fDisplayHTML(f){
  let v='';const val=f.value;
  switch(f.type){
    case 'text':case 'formula':case 'person':v=esc(val||'—');break;
    case 'number':v=val!==''&&val!==undefined?String(val):'—';break;
    case 'date':if(val){const d=new Date(val);const today=new Date();today.setHours(0,0,0,0);d.setHours(0,0,0,0);const left=Math.ceil((d-today)/86400000);v=d.toLocaleDateString('en-GB')+` <span class="fv warn">(${left}d)</span>`;}else v='—';break;
    case 'select':v=val?`<span class="pill">${esc(val)}</span>`:'—';break;
    case 'multi':v=(Array.isArray(val)?val:[]).map(t=>`<span class="tag-chip">${esc(t)}</span>`).join('')||'—';break;
    case 'check':v=val?'☑ Yes':'☐ No';break;
    case 'url':v=val?`<a href="${esc(val)}" target="_blank" rel="noopener">${esc(val.replace(/^https?:\/\//,'').slice(0,40))}</a>`:'—';break;
    case 'email':v=val?`<a href="mailto:${esc(val)}">${esc(val)}</a>`:'—';break;
    case 'phone':v=val?`<a href="tel:${esc(val)}">${esc(val)}</a>`:'—';break;
    case 'rating':{const n=parseInt(val)||0;v=`<span class="stars">${'★'.repeat(n)}<span style="color:var(--line)">${'★'.repeat(5-n)}</span></span>`;break;}
    case 'progress':{const p=parseInt(val)||0;v=`<span class="prog-bar"><span class="prog-fill" style="width:${p}%;display:block"></span></span>${p}%`;break;}
    case 'file':v=val?`<span style="text-decoration:underline">${esc(val)}</span>`:'—';break;
    case 'longtext':v=`<span style="white-space:pre-wrap">${esc(val||'')}</span>`;break;
    default:v=esc(val||'—');
  }
  return `<div class="frow"><span class="fk">${esc(f.key||'—')}</span><span class="fv">${v}</span></div>`;
}
