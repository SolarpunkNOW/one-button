/* One Button skins. ?skin=agnesiv or ?skin=plain switches and remembers (localStorage ob-skin). */
(function(){
  var DEFAULT='agnesiv', KNOWN={agnesiv:1,plain:1}, k='ob-skin', s=DEFAULT;
  try{
    var q=new URLSearchParams(location.search).get('skin');
    if(q&&KNOWN[q]){localStorage.setItem(k,q)}
    var v=localStorage.getItem(k); if(v&&KNOWN[v]) s=v;
  }catch(e){}
  if(s==='plain') return;
  var r=document.documentElement; r.classList.add('skin-'+s);
  var path=location.pathname, me=document.currentScript; if(!(me&&me.getAttribute('data-page')==='main')) r.classList.add('agv-sub'); if(/\/b\//.test(path)) r.classList.add('agv-b');
  var base=(me&&me.src)?me.src.replace(/skin\.js(\?.*)?$/,''):'skins/';
  document.write('<link rel="stylesheet" href="'+base+s+'/skin.css">');
  var meta=document.querySelector('meta[name=theme-color]'); if(meta) meta.content='#FFFFFF';
  addEventListener('DOMContentLoaded',function(){
    var spot=document.querySelector('#sheet-settings .sheet-body')||document.querySelector('.wrap')||document.body;
    var c=document.createElement('p'); c.className='agv-credit';
    c.innerHTML='<a href="https://infinitewin.world" target="_blank" rel="noopener">Agnesiv Theme by Agnes Friedrich, Solarpunk NOW</a>';
    spot.appendChild(c);
  });
})();
