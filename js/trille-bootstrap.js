function loadCompactBarsStyles(){
  if(document.querySelector('link[data-trille-compact-bars]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='trille-compact-bars.css';
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

function normalizeBottomNav(){
  const home=document.getElementById('nav-home');
  const stats=document.getElementById('nav-stats');
  const calendar=document.getElementById('nav-calendar');
  const settings=document.getElementById('nav-settings');

  if(home)home.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>';
  if(stats)stats.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 19V5"/><path d="M10 19V9"/><path d="M16 19v-6"/></svg>';
  if(calendar)calendar.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
  if(settings)settings.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.33 1.82v.09a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.82-.33h-.09a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9c.2-.4.2-.9 0-1.3a1.7 1.7 0 0 0-.6-1l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6c.4-.2.9-.2 1.3 0 .4.2.7.6 1 1a1.7 1.7 0 0 0 1.82.33h.09a2 2 0 1 1 4 0h-.09c-.7 0-1.3.3-1.82.33-.4.2-.7.6-1 1 .2.4.2.9 0 1.3.2.4.6.7 1 1 .5 0 1.1.2 1.82.33h.09a2 2 0 1 1 0 4h-.09c-.7 0-1.3.3-1.82.33-.4.2-.7.6-1 1z"/></svg>';

  if(!document.getElementById('nav-add')){
    const add=document.createElement('button');
    add.id='nav-add';
    add.className='nbtn';
    add.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>';
    add.onclick=quickAddFromNav;
    const bnav=document.querySelector('.bnav');
    if(bnav)bnav.insertBefore(add,calendar);
  }
}

loadCompactBarsStyles();
loadReorderStyles();
loadAppIconMetadata();
normalizeBottomNav();
init();
