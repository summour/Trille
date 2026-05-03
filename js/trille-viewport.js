function updateTrilleViewportHeight(){
  const viewport=window.visualViewport;
  const height=Math.ceil(viewport?.height||window.innerHeight||document.documentElement.clientHeight);
  document.documentElement.style.setProperty('--Trille-vh',height+'px');
}

function installTrilleViewportHeight(){
  updateTrilleViewportHeight();
  window.addEventListener('resize',updateTrilleViewportHeight,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(updateTrilleViewportHeight,120),{passive:true});
  window.visualViewport?.addEventListener('resize',updateTrilleViewportHeight,{passive:true});
  window.visualViewport?.addEventListener('scroll',updateTrilleViewportHeight,{passive:true});
}

installTrilleViewportHeight();
