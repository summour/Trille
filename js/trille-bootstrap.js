function loadCompactBarsStyles(){
  if(document.querySelector('link[data-trille-compact-bars]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='trille-compact-bars.css?v=20260503-dock-low';
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

loadCompactBarsStyles();
loadReorderStyles();
loadAppIconMetadata();
ensureAddButton();
init();
