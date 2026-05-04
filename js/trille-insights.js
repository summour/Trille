function renderStats(){
  const el=document.getElementById('stats-content');
  if(!el)return;
  const totalBoards=cards.length;
  const totalCards=cards.reduce((sum,c)=>sum+(Array.isArray(c.subcards)?c.subcards.length:0),0);
  const totalItems=cards.reduce((sum,c)=>sum+(Array.isArray(c.items)?c.items.length:0)+(Array.isArray(c.subcards)?c.subcards.reduce((s,sub)=>s+(Array.isArray(sub.items)?sub.items.length:0),0):0),0);
  const doneItems=cards.reduce((sum,c)=>sum+(Array.isArray(c.items)?c.items.filter(i=>i.done).length:0)+(Array.isArray(c.subcards)?c.subcards.reduce((s,sub)=>s+(Array.isArray(sub.items)?sub.items.filter(i=>i.done).length:0),0):0),0);
  el.innerHTML=`<div class="stats-grid"><div class="sc"><div class="sn">${totalBoards}</div><div class="sl">Boards</div></div><div class="sc"><div class="sn">${totalCards}</div><div class="sl">Cards</div></div><div class="sc"><div class="sn">${doneItems}</div><div class="sl">Done</div></div><div class="sc"><div class="sn">${totalItems}</div><div class="sl">Activities</div></div></div>`;
}

function getLinkedDateEntries(){
  const entries=[];
  cards.forEach(board=>{
    (board.nf||[]).forEach(field=>{
      if(field.type==='date'&&field.value){
        entries.push({date:field.value,boardId:board.id,subId:null,title:board.title,folderId:board.folderId,fieldKey:field.key||'Date',kind:'Board'});
      }
    });
    (board.subcards||[]).forEach(sub=>{
      (sub.nf||[]).forEach(field=>{
        if(field.type==='date'&&field.value){
          entries.push({date:field.value,boardId:board.id,subId:sub.id,title:sub.title,boardTitle:board.title,folderId:board.folderId,fieldKey:field.key||'Date',kind:'Card'});
        }
      });
    });
  });
  return entries;
}

function dateKeyFromParts(y,m,d){return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
function monthName(y,m){return new Date(y,m,1).toLocaleDateString('en-US',{month:'long',year:'numeric'});}
function sameDayKey(date){return date.toISOString().slice(0,10);}

function renderCal(){
  const el=document.getElementById('cal-content');
  if(!el)return;
  const now=new Date();
  if(calY===undefined||calM===undefined){calY=now.getFullYear();calM=now.getMonth();}
  const entries=getLinkedDateEntries();
  const byDate=entries.reduce((map,item)=>{
    if(!map[item.date])map[item.date]=[];
    map[item.date].push(item);
    return map;
  },{});
  const first=new Date(calY,calM,1);
  const startDay=first.getDay();
  const daysInMonth=new Date(calY,calM+1,0).getDate();
  const prevDays=new Date(calY,calM,0).getDate();
  const todayKey=sameDayKey(now);
  const cells=[];

  for(let i=0;i<42;i++){
    let day,month=calM,year=calY,other=false;
    if(i<startDay){day=prevDays-startDay+i+1;month=calM-1;other=true;if(month<0){month=11;year--;}}
    else if(i>=startDay+daysInMonth){day=i-startDay-daysInMonth+1;month=calM+1;other=true;if(month>11){month=0;year++;}}
    else{day=i-startDay+1;}
    const key=dateKeyFromParts(year,month,day);
    const count=(byDate[key]||[]).length;
    cells.push(`<button class="cd ${other?'other-month':''} ${key===todayKey?'today':''} ${count?'hev':''}" onclick="openCalendarDay('${key}')"><span>${day}</span>${count>1?`<small>${count}</small>`:''}</button>`);
  }

  el.innerHTML=`
    <div class="cal-nav">
      <button class="icon-btn" onclick="moveCalMonth(-1)"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>
      <div class="cal-title">${monthName(calY,calM)}</div>
      <button class="icon-btn" onclick="moveCalMonth(1)"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></button>
    </div>
    <div class="cal-g">
      ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div class="cdh">${d}</div>`).join('')}
      ${cells.join('')}
    </div>
    <div class="settings-section"><div class="ss-t">Linked cards</div><div class="settings-group">${entries.length?entries.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(calendarEntryRow).join(''):'<div class="si"><span class="si-label">No linked dates yet</span><span class="si-r">—</span></div>'}</div></div>
  `;
}

function calendarEntryRow(entry){
  const folder=folders.find(f=>f.id===entry.folderId);
  return `<div class="si" onclick="openLinkedCalendarCard('${entry.boardId}','${entry.subId||''}')"><span class="si-label">${esc(entry.title)}</span><span class="si-r">${esc(entry.date)} · ${esc(entry.kind)}${folder?' · '+esc(folder.name):''}</span></div>`;
}

function moveCalMonth(delta){
  calM+=delta;
  if(calM<0){calM=11;calY--;}
  if(calM>11){calM=0;calY++;}
  renderCal();
}

function openCalendarDay(dateKey){
  const items=getLinkedDateEntries().filter(entry=>entry.date===dateKey);
  document.getElementById('calday-title').textContent=new Date(dateKey+'T00:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const body=document.getElementById('calday-body');
  body.innerHTML=items.length?`<div class="settings-group">${items.map(calendarEntryRow).join('')}</div>`:'<div class="empty"><h3>No linked cards</h3><p>Add a date field to a board or card.</p></div>';
  openModal('modal-calday');
}

function openLinkedCalendarCard(boardId,subId){
  closeModal('modal-calday');
  const board=cards.find(c=>c.id===boardId);
  if(!board)return;
  openFolder(board.folderId);
  setTimeout(()=>{
    openBoard(boardId);
    if(subId){
      setTimeout(()=>{
        const node=document.querySelector(`[data-subcard-id="${subId}"]`);
        node?.scrollIntoView({behavior:'smooth',block:'center'});
        node?.classList.add('trille-calendar-target');
        setTimeout(()=>node?.classList.remove('trille-calendar-target'),1400);
      },80);
    }
  },40);
}

function updateBN(v){bn=v;save();}

function isTrilleBackupKey(key){
  if(!key)return false;
  const k=String(key).toLowerCase();
  return k.startsWith('t-')||k.startsWith('trille')||k.includes('canvas');
}

function getTrilleLocalStorageBackup(){
  const storage={};
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(!isTrilleBackupKey(key))continue;
    storage[key]=localStorage.getItem(key);
  }
  return storage;
}

function createBackupPayload(){
  save();
  saveCanvasData();
  return {
    app:'Trille',
    version:2,
    createdAt:new Date().toISOString(),
    folders,
    cards,
    bn,
    localStorage:getTrilleLocalStorageBackup()
  };
}

function exportData(){
  const data=JSON.stringify(createBackupPayload(),null,2);
  const blob=new Blob([data],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const date=new Date().toISOString().slice(0,10);
  a.href=url;
  a.download=`trille-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(){document.getElementById('import-file')?.click();}

function getImportStorage(data){
  if(data&&data.localStorage&&typeof data.localStorage==='object')return data.localStorage;
  const storage={};
  if(Array.isArray(data?.folders))storage['t-folders2']=JSON.stringify(data.folders);
  if(Array.isArray(data?.cards))storage['t-cards2']=JSON.stringify(data.cards);
  if(typeof data?.bn==='string')storage['t-board']=data.bn;
  return storage;
}

function restoreTrilleStorage(storage){
  Object.entries(storage||{}).forEach(([key,value])=>{
    if(!isTrilleBackupKey(key))return;
    if(typeof value==='string')localStorage.setItem(key,value);
    else localStorage.setItem(key,JSON.stringify(value));
  });
}

function syncStateFromBackup(data,storage){
  const nextFolders=Array.isArray(data?.folders)?data.folders:JSON.parse(storage['t-folders2']||'[]');
  const nextCards=Array.isArray(data?.cards)?data.cards:JSON.parse(storage['t-cards2']||'[]');
  const nextBN=typeof data?.bn==='string'?data.bn:(storage['t-board']||bn);

  if(Array.isArray(nextFolders))folders=nextFolders;
  if(Array.isArray(nextCards))cards=nextCards;
  if(nextBN)bn=nextBN;
}

function handleImport(e){
  const file=e.target.files?.[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      const storage=getImportStorage(data);
      restoreTrilleStorage(storage);
      syncStateFromBackup(data,storage);
      save();
      if(typeof loadCanvasData==='function')loadCanvasData();
      toast('Imported');
      setTimeout(()=>window.location.reload(),250);
    }catch(err){
      console.error('Import failed',err);
      toast('Import failed');
    }finally{
      e.target.value='';
    }
  };
  reader.readAsText(file);
}
function clearAll(){
  if(!confirm('Clear all Trille data?'))return;
  folders=[];cards=[];loadDefaults();switchView('home');toast('Cleared');
}
