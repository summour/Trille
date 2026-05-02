let folders=[],cards=[],editId=null,ctxId=null,selType='habit';
let clItems=[],nfFields=[];
let reorder=false,dark=false,bn='My Workspace';
let curView='home',activeFolderId=null,activeBoardId=null;
let activePicker=null,calY,calM,showSrch=false,sq='';
let editFolderId=null;

const TYPES={habit:{label:'Habit'},focus:{label:'Focus'},output:{label:'Output'},project:{label:'Project'},waiting:{label:'Waiting'},note:{label:'Note'},custom:{label:'Custom'}};
const FT={text:{label:'Text',sym:'T'},number:{label:'Number',sym:'#'},date:{label:'Date',sym:'D'},select:{label:'Select',sym:'S'},multi:{label:'Multi',sym:'M'},check:{label:'Check',sym:'☑'},url:{label:'URL',sym:'↗'},email:{label:'Email',sym:'@'},phone:{label:'Phone',sym:'☏'},person:{label:'Person',sym:'☺'},rating:{label:'Rating',sym:'★'},progress:{label:'Progress',sym:'%'},formula:{label:'Formula',sym:'f'},file:{label:'File',sym:'↑'},longtext:{label:'Long text',sym:'¶'}};
const FT_GROUPS=[{sec:'Basic',keys:['text','number','date','check']},{sec:'Select',keys:['select','multi']},{sec:'Contact',keys:['url','email','phone','person']},{sec:'Visual',keys:['rating','progress']},{sec:'Other',keys:['formula','file','longtext']}];

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function defVal(t){const m={check:false,multi:[],rating:0,progress:0,number:0};return m[t]!==undefined?m[t]:'';}

// Folder SVG icon (generic folder shape)
function folderSVG(){return `<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>`;}

function init(){
  const tc=localStorage.getItem('t-cards2'),tf=localStorage.getItem('t-folders2'),tb=localStorage.getItem('t-board'),th=localStorage.getItem('t-theme');
  if(tc)cards=JSON.parse(tc);
  if(tf)folders=JSON.parse(tf);
  if(tb)bn=tb;
  if(!folders.length&&!cards.length)loadDefaults();
  if(th==='dark')setDark(true);
  document.getElementById('bn-in').value=bn;
  renderTypeGrid();
  switchView('home');
}
function save(){localStorage.setItem('t-cards2',JSON.stringify(cards));localStorage.setItem('t-folders2',JSON.stringify(folders));localStorage.setItem('t-board',bn);}

function loadDefaults(){
  const f1={id:uid(),name:'OCSC Study'};
  const f2={id:uid(),name:'Personal'};
  const f3={id:uid(),name:'Projects'};
  folders=[f1,f2,f3];
  cards=[
    {id:uid(),folderId:f1.id,type:'habit',title:'Daily Routine',desc:'Low-load daily habits',items:[{id:uid(),text:'Yoga 10 min',done:true},{id:uid(),text:'Light diet',done:true},{id:uid(),text:'English input',done:false},{id:uid(),text:'1 online lecture',done:false},{id:uid(),text:'Savings transfer',done:false}],note:'Feeling more refreshed today.',nf:[]},
    {id:uid(),folderId:f1.id,type:'focus',title:'ก.พ. Phase ก',desc:'',nf:[{id:uid(),key:'D-Day',type:'date',value:'2026-07-05'},{id:uid(),key:'Best slot',type:'text',value:'08:00 – 10:00'},{id:uid(),key:'Status',type:'select',value:'In Progress'},{id:uid(),key:'Progress',type:'progress',value:60}]},
    {id:uid(),folderId:f1.id,type:'waiting',title:'Google Data Analytics',desc:'',nf:[{id:uid(),key:'Status',type:'text',value:'Awaiting Financial Aid'},{id:uid(),key:'Check date',type:'date',value:'2026-05-16'},{id:uid(),key:'Priority',type:'rating',value:4}]},
    {id:uid(),folderId:f2.id,type:'habit',title:'Morning Routine',desc:'Start the day right',items:[{id:uid(),text:'Meditate 10min',done:false},{id:uid(),text:'Cold shower',done:false},{id:uid(),text:'Journal',done:false}],note:'',nf:[]},
    {id:uid(),folderId:f3.id,type:'project',title:'Portfolio Website',desc:'Redesign personal site',nf:[{id:uid(),key:'Deadline',type:'date',value:'2026-06-01'},{id:uid(),key:'Progress',type:'progress',value:35},{id:uid(),key:'Stack',type:'multi',value:['React','Tailwind','Vercel']}]},
  ];
  save();
}

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
    return `<div class="board-item" onclick="openBoard('${c.id}')"><div class="bi-top"><span class="bi-type">${(TYPES[c.type]||TYPES.custom).label}</span><div class="mbtn-wrap" onclick="event.stopPropagation();showBoardCtx(event,'${c.id}')"><svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/></svg></div></div><div class="bi-title">${esc(c.title)}</div>${c.desc?`<div class="bi-desc">${esc(c.desc)}</div>`:''}<div class="bi-meta">${prog||prog2}</div></div>`;
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
  document.getElementById('board-back-btn').onclick=()=>{document.getElementById('view-board').classList.remove('active');document.getElementById('view-boards').classList.add('active');};
  renderBoardCards(card);
  document.getElementById('view-boards').classList.remove('active');
  document.getElementById('view-board').classList.add('active');
  curView='board';
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
  list.innerHTML=html;
  list.querySelectorAll('.ci input').forEach(cb=>cb.addEventListener('change',e=>{e.stopPropagation();toggleCheck(card.id,cb.dataset.iid,cb.checked);}));
}

function editFromBoardView(id){openEdit(id);}

function renderTypeGrid(){document.getElementById('type-grid').innerHTML=Object.keys(TYPES).map(t=>`<button class="tbtn" data-t="${t}" onclick="selectType('${t}')">${TYPES[t].label}</button>`).join('');}
function selectType(t,card){selType=t;document.querySelectorAll('.tbtn').forEach(b=>b.classList.toggle('sel',b.dataset.t===t));renderDyn(card);}

function renderDyn(card){
  let h='';
  if(selType==='habit'){h+=`<div class="fg"><label class="fl">Activities</label><div class="cled" id="cl-editor">${clItems.map((it,i)=>`<div class="clrow"><input type="text" placeholder="Activity..." value="${esc(it.text)}" oninput="clItems[${i}].text=this.value" onkeydown="clKey(event,${i})"><button class="delbtn" onclick="clDel(${i})"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`).join('')}</div><button class="addbtn" onclick="clAdd()">+ Add activity</button></div>`;}
  h+=`<div class="fg"><label class="fl">Note</label><textarea class="fi" id="f-note" rows="2" placeholder="Notes...">${esc(card?.note||'')}</textarea></div>`;
  h+=`<div class="fg"><label class="fl">Fields</label><div class="nf-editor" id="nf-editor">${nfFields.map((f,i)=>nfRowHTML(f,i)).join('')}</div><button class="addbtn" onclick="nfAdd()">+ Add field</button></div>`;
  document.getElementById('dyn-fields').innerHTML=h;
}

function nfRowHTML(f,i){const sym=FT[f.type]?FT[f.type].sym:'T';return `<div class="nf-row" id="nfrow-${f.id}"><button class="nf-type-btn" onclick="openPicker('${f.id}',${i})" title="${FT[f.type]?.label||'Text'}">${sym}</button><input class="nf-key" type="text" placeholder="Name" value="${esc(f.key)}" oninput="nfFields[${i}].key=this.value"><div class="nf-val-wrap">${nfValHTML(f,i)}</div><button class="delbtn" onclick="nfDel(${i})"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`;}

function nfValHTML(f,i){
  const v=f.value;
  switch(f.type){
    case 'text':return `<input class="nf-in" type="text" placeholder="Value..." value="${esc(v||'')}" oninput="nfFields[${i}].value=this.value">`;
    case 'number':return `<input class="nf-in" type="number" placeholder="0" value="${v!==undefined?v:''}" oninput="nfFields[${i}].value=parseFloat(this.value)||0">`;
    case 'date':return `<input class="nf-in" type="date" value="${v||''}" style="color:var(--ink)" oninput="nfFields[${i}].value=this.value">`;
    case 'select':{const opts=['To Do','In Progress','Done','Blocked','On Hold','Not Started','Cancelled'];return `<select class="nf-in" onchange="nfFields[${i}].value=this.value"><option value="">— select —</option>${opts.map(o=>`<option value="${o}"${v===o?' selected':''}>${o}</option>`).join('')}${v&&!opts.includes(v)?`<option value="${esc(v)}" selected>${esc(v)}</option>`:''}</select>`;}
    case 'multi':return nfMultiHTML(f,i);
    case 'check':return `<div class="nf-check-wrap"><input type="checkbox" ${v?'checked':''} onchange="nfFields[${i}].value=this.checked;this.nextElementSibling.textContent=this.checked?'Yes':'No'"><span class="nf-check-label">${v?'Yes':'No'}</span></div>`;
    case 'url':return `<input class="nf-in" type="url" placeholder="https://..." value="${esc(v||'')}" oninput="nfFields[${i}].value=this.value">`;
    case 'email':return `<input class="nf-in" type="email" placeholder="email@..." value="${esc(v||'')}" oninput="nfFields[${i}].value=this.value">`;
    case 'phone':return `<input class="nf-in" type="tel" placeholder="+66..." value="${esc(v||'')}" oninput="nfFields[${i}].value=this.value">`;
    case 'person':return `<input class="nf-in" type="text" placeholder="Name..." value="${esc(v||'')}" oninput="nfFields[${i}].value=this.value">`;
    case 'rating':return nfRatingHTML(f,i);
    case 'progress':return `<div class="nf-prog-wrap"><input type="range" min="0" max="100" value="${parseInt(v)||0}" oninput="nfFields[${i}].value=parseInt(this.value);this.nextElementSibling.textContent=this.value+'%'"><span class="nf-prog-n">${parseInt(v)||0}%</span></div>`;
    case 'formula':return `<input class="nf-in" type="text" placeholder="formula..." value="${esc(v||'')}" style="font-style:italic;color:var(--ink3)" oninput="nfFields[${i}].value=this.value">`;
    case 'file':return `<div class="nf-file-wrap"><span class="nf-file-name">${v?esc(v):'No file'}</span><label class="nf-file-lbl">Upload<input type="file" style="display:none" onchange="nfFields[${i}].value=this.files[0]?.name||''"></label></div>`;
    case 'longtext':return `<textarea class="nf-in" rows="3" placeholder="Long text..." oninput="nfFields[${i}].value=this.value" style="resize:vertical">${esc(v||'')}</textarea>`;
    default:return `<input class="nf-in" type="text" placeholder="Value..." value="${esc(v||'')}" oninput="nfFields[${i}].value=this.value">`;
  }
}

function nfMultiHTML(f,i){const tags=Array.isArray(f.value)?f.value:[];return `<div class="nf-multi" id="nfm-${f.id}">${tags.map((t,ti)=>`<span class="nf-tag">${esc(t)}<button class="nf-tag-del" onclick="tagDel('${f.id}',${i},${ti})">×</button></span>`).join('')}<input class="nf-multi-in" id="nfmin-${f.id}" placeholder="${tags.length?'':'Add, Enter'}" onkeydown="tagKey(event,'${f.id}',${i})"></div>`;}
function nfRatingHTML(f,i){const n=parseInt(f.value)||0;return `<div class="nf-rating">${[1,2,3,4,5].map(s=>`<span class="nf-star${s<=n?' on':''}" data-s="${s}" onclick="setRating(${i},${s},'${f.id}')">★</span>`).join('')}</div>`;}
function setRating(idx,val,fid){nfFields[idx].value=val;document.querySelectorAll('#nfrow-'+fid+' .nf-star').forEach(s=>s.classList.toggle('on',parseInt(s.dataset.s)<=val));}
function tagKey(e,fid,idx){if(e.key==='Enter'||e.key===','||e.key==='Tab'){e.preventDefault();const v=e.target.value.trim();if(v){if(!Array.isArray(nfFields[idx].value))nfFields[idx].value=[];nfFields[idx].value.push(v);e.target.value='';const wrap=document.getElementById('nfm-'+fid);if(wrap)wrap.outerHTML=nfMultiHTML(nfFields[idx],idx);}}}
function tagDel(fid,idx,ti){if(!Array.isArray(nfFields[idx].value))return;nfFields[idx].value.splice(ti,1);const wrap=document.getElementById('nfm-'+fid);if(wrap)wrap.outerHTML=nfMultiHTML(nfFields[idx],idx);}
function nfAdd(){const f={id:uid(),key:'',type:'text',value:''};nfFields.push(f);const ed=document.getElementById('nf-editor');if(ed){const tmp=document.createElement('div');tmp.innerHTML=nfRowHTML(f,nfFields.length-1);ed.appendChild(tmp.firstElementChild);ed.lastElementChild.querySelector('.nf-key')?.focus();}}
function nfDel(i){nfFields.splice(i,1);renderDyn();}

function openPicker(fid,idx){if(activePicker===fid){closePicker();return;}activePicker=fid;const popup=document.getElementById('ft-popup');popup.innerHTML=FT_GROUPS.map(g=>`<div class="ftp-sec">${g.sec}</div>`+g.keys.map(k=>`<div class="ftp-item" onclick="setFType('${fid}',${idx},'${k}')"><span class="ftp-icon">${FT[k].sym}</span>${FT[k].label}</div>`).join('')).join('');const btn=document.querySelector('#nfrow-'+fid+' .nf-type-btn');if(!btn)return;const r=btn.getBoundingClientRect();popup.style.left=Math.min(r.left,innerWidth-210)+'px';popup.style.top=Math.min(r.bottom+4,innerHeight-320)+'px';popup.classList.add('open');}
function closePicker(){activePicker=null;document.getElementById('ft-popup').classList.remove('open');}
function setFType(fid,idx,type){nfFields[idx].type=type;nfFields[idx].value=defVal(type);closePicker();const row=document.getElementById('nfrow-'+fid);if(row){const sym=FT[type]?.sym||'T';row.querySelector('.nf-type-btn').innerHTML=sym;row.querySelector('.nf-type-btn').title=FT[type]?.label||type;const vw=row.querySelector('.nf-val-wrap');if(vw)vw.innerHTML=nfValHTML(nfFields[idx],idx);}}

document.addEventListener('click',e=>{if(activePicker&&!e.target.closest('.nf-type-btn')&&!e.target.closest('#ft-popup'))closePicker();if(!e.target.closest('#ctx')&&!e.target.closest('.mbtn-wrap'))closeCtx();});

function clKey(e,i){if(e.key==='Enter'){e.preventDefault();clAdd(i);}}
function clAdd(after){const it={id:uid(),text:'',done:false};if(after!==undefined)clItems.splice(after+1,0,it);else clItems.push(it);renderDyn();setTimeout(()=>{const rows=document.querySelectorAll('.clrow input');const t=rows[after!==undefined?after+1:rows.length-1];if(t)t.focus();},30);}
function clDel(i){if(clItems.length>1){clItems.splice(i,1);renderDyn();}}

function fDisplayHTML(f){
  let v='';const val=f.value;
  switch(f.type){
    case 'text':case 'formula':case 'person':v=esc(val||'—');break;
    case 'number':v=val!==''&&val!==undefined?String(val):'—';break;
    case 'date':if(val){const d=new Date(val);const left=Math.ceil((d-new Date())/86400000);v=d.toLocaleDateString('en-GB')+(left>=0&&left<=30?` <span class="fv warn">(${left}d)</span>`:'')}else v='—';break;
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
  if (source === 'board' && typeof activeBoardId !== 'undefined' && activeBoardId) {
    if (typeof renderBoard === 'function') renderBoard(activeBoardId);
    if (typeof showView === 'function') showView('board');
    return;
  }
  if (source === 'boards' && typeof activeFolderId !== 'undefined' && activeFolderId) {
    if (typeof renderFolderBoards === 'function') renderFolderBoards(activeFolderId);
    if (typeof showView === 'function') showView('boards');
    return;
  }
  if (typeof renderFolders === 'function') renderFolders();
  if (typeof renderRecent === 'function') renderRecent();
  if (typeof showView === 'function') showView(source || 'home');
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

function renderStats(){
  const wrap=document.getElementById('stats-content');
  const tot=cards.length;
  const habits=cards.filter(c=>c.type==='habit');
  const totI=habits.reduce((a,c)=>a+(c.items||[]).length,0);
  const doneI=habits.reduce((a,c)=>a+(c.items||[]).filter(i=>i.done).length,0);
  const byType={};cards.forEach(c=>byType[c.type]=(byType[c.type]||0)+1);
  const byFolder={};cards.forEach(c=>{const f=folders.find(x=>x.id===c.folderId);const n=f?f.name:'No folder';byFolder[n]=(byFolder[n]||0)+1;});
  wrap.innerHTML=`<div class="stats-grid"><div class="sc"><div class="sn">${folders.length}</div><div class="sl">Folders</div></div><div class="sc"><div class="sn">${tot}</div><div class="sl">Boards</div></div><div class="sc"><div class="sn">${doneI}</div><div class="sl">Done</div></div><div class="sc"><div class="sn">${totI?Math.round(doneI/totI*100):0}%</div><div class="sl">Completion</div></div></div><div style="background:var(--surface);border-radius:var(--r);padding:16px;box-shadow:var(--shadow);margin-bottom:12px"><div class="ss-t" style="margin-bottom:12px">By Type</div>${Object.keys(byType).map(t=>{const p=tot?Math.round(byType[t]/tot*100):0;return `<div class="bar-row"><div class="bar-lbl"><span>${(TYPES[t]||TYPES.custom).label}</span><span>${byType[t]}</span></div><div class="btrack"><div class="bfill" style="width:${p}%"></div></div></div>`;}).join('')}</div><div style="background:var(--surface);border-radius:var(--r);padding:16px;box-shadow:var(--shadow)"><div class="ss-t" style="margin-bottom:12px">By Folder</div>${Object.keys(byFolder).map(n=>{const p=tot?Math.round(byFolder[n]/tot*100):0;return `<div class="bar-row"><div class="bar-lbl"><span>${esc(n)}</span><span>${byFolder[n]}</span></div><div class="btrack"><div class="bfill" style="width:${p}%"></div></div></div>`;}).join('')}</div>`;
}

function renderCal(){
  const now=new Date();if(calY===undefined){calY=now.getFullYear();calM=now.getMonth();}
  const wrap=document.getElementById('cal-content');
  const first=new Date(calY,calM,1).getDay(),last=new Date(calY,calM+1,0).getDate();
  // build map: day -> cards
  const evMap={};
  cards.forEach(c=>(c.nf||[]).forEach(f=>{
    if(f.type==='date'&&f.value){
      const d=new Date(f.value);
      if(d.getMonth()===calM&&d.getFullYear()===calY){
        const day=d.getDate();
        if(!evMap[day])evMap[day]=[];
        evMap[day].push(c.id);
      }
    }
  }));
  const days=['Su','Mo','Tu','We','Th','Fr','Sa'];
  let g=days.map(d=>`<div class="cdh">${d}</div>`).join('');
  for(let i=0;i<first;i++)g+=`<div></div>`;
  for(let d=1;d<=last;d++){
    const it=d===now.getDate()&&calM===now.getMonth()&&calY===now.getFullYear();
    const hasEv=!!evMap[d];
    const onclick=hasEv?`onclick="openCalDay(${d})"`:''
    g+=`<div class="cd${it?' today':''}${hasEv?' hev':''}" ${onclick}>${d}</div>`;
  }
  wrap.innerHTML=`<div class="cal-nav"><button class="icon-btn" onclick="prevM()"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button><span class="cal-title">${new Date(calY,calM).toLocaleDateString('en-US',{month:'long',year:'numeric'})}</span><button class="icon-btn" onclick="nextM()"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></button></div><div class="cal-g">${g}</div><div style="text-align:center;font-size:12px;color:var(--ink3);margin-top:16px;font-weight:400">· tap a marked date to see boards</div>`;
}

function openCalDay(day){
  const dateStr=`${calY}-${String(calM+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const matched=[];
  cards.forEach(c=>(c.nf||[]).forEach(f=>{
    if(f.type==='date'&&f.value===dateStr)matched.push({card:c,fieldKey:f.key});
  }));
  const d=new Date(calY,calM,day);
  document.getElementById('calday-title').textContent=d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  if(!matched.length){
    document.getElementById('calday-body').innerHTML='<div class="empty"><p>No boards on this date.</p></div>';
  } else {
    document.getElementById('calday-body').innerHTML=matched.map(({card,fieldKey})=>{
      const folder=folders.find(f=>f.id===card.folderId);
      return `<div class="recent-item" style="cursor:pointer" onclick="navToCard('${card.id}')">
        <div class="ri-dot"></div>
        <div class="ri-body">
          <div class="ri-title">${esc(card.title)}</div>
          <div class="ri-sub">${folder?esc(folder.name):'No folder'} · ${esc(fieldKey)}</div>
        </div>
        <div class="ri-arrow"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div>
      </div>`;
    }).join('');
  }
  openModal('modal-calday');
}

function navToCard(cid){
  closeModal('modal-calday');
  const card=cards.find(c=>c.id===cid);if(!card)return;
  // navigate: switch to home, open folder, open detail
  switchView('home',document.getElementById('nav-home'));
  setTimeout(()=>{
    openFolder(card.folderId);
    setTimeout(()=>openDetail(card.id),80);
  },80);
}
function prevM(){calM--;if(calM<0){calM=11;calY--;}renderCal();}
function nextM(){calM++;if(calM>11){calM=0;calY++;}renderCal();}

function updateBN(v){bn=v||'My Workspace';localStorage.setItem('t-board',bn);}
function exportData(){const b=new Blob([JSON.stringify({boardName:bn,folders,cards,exported:new Date().toISOString()},null,2)],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='trille.json';a.click();URL.revokeObjectURL(u);toast('Exported');}
function importData(){document.getElementById('import-file').click();}
function handleImport(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(d.cards){cards=d.cards;if(d.folders)folders=d.folders;if(d.boardName){bn=d.boardName;document.getElementById('bn-in').value=bn;}save();renderHome();toast('Imported');}}catch{toast('Invalid file');}};r.readAsText(f);e.target.value='';}
function clearAll(){if(!confirm('Delete all data?'))return;cards=[];folders=[];save();goHome();toast('Cleared');}

init();
