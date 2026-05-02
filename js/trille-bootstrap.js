function loadCompactBarsStyles(){
  if(document.querySelector('link[data-trille-compact-bars]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='trille-compact-bars.css';
  link.dataset.trilleCompactBars='true';
  document.head.appendChild(link);
}

loadCompactBarsStyles();
init();
