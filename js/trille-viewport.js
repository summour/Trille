/**
 * trille-viewport.js — iOS PWA fullscreen fix
 */
(function(){
  'use strict';

  function getFullHeight(){
    return window.screen && window.screen.height ? window.screen.height : window.innerHeight;
  }

  function applyHeight(){
    var h=getFullHeight();
    var px=h+'px';

    document.documentElement.style.setProperty('height',px,'important');
    document.documentElement.style.setProperty('min-height',px,'important');
    document.documentElement.style.setProperty('max-height',px,'important');
    document.documentElement.style.setProperty('overflow','hidden','important');
    document.documentElement.style.setProperty('background','var(--bg, #f5f5f7)','important');

    if(document.body){
      document.body.style.setProperty('height',px,'important');
      document.body.style.setProperty('min-height',px,'important');
      document.body.style.setProperty('max-height',px,'important');
      document.body.style.setProperty('overflow','hidden','important');
      document.body.style.setProperty('background','var(--bg, #f5f5f7)','important');
    }

    var app=document.getElementById('app');
    if(app){
      app.style.setProperty('position','fixed','important');
      app.style.setProperty('top','0','important');
      app.style.setProperty('left','0','important');
      app.style.setProperty('right','0','important');
      app.style.setProperty('bottom','0','important');
      app.style.setProperty('width','100%','important');
      app.style.setProperty('height',px,'important');
      app.style.setProperty('min-height','unset','important');
      app.style.setProperty('max-height','none','important');
      app.style.setProperty('overflow','hidden','important');
      app.style.setProperty('background','var(--bg, #f5f5f7)','important');
    }

    document.documentElement.style.setProperty('--app-height',px);
    document.documentElement.style.setProperty('--Trille-vh',px);
  }

  applyHeight();

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',applyHeight,{once:true});
  }

  window.addEventListener('resize',applyHeight,{passive:true});
  window.addEventListener('orientationchange',function(){
    setTimeout(applyHeight,150);
    setTimeout(applyHeight,500);
  },{passive:true});

  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',applyHeight,{passive:true});
  }
})();
