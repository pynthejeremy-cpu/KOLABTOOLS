/* ---- IA Studio · onglet « Génération voix » (pont vers Voice Studio en local) ---- */
(function () {
if (window.__VSX) return; window.__VSX = 1;

var PORTS = [8765, 8766, 8767];
var base = null, db = null, health = null, voices = [], card = null;
var projects = [], pid = '', shots = [], board = null, busy = false, results = [], msg = '';

function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function toast(m){try{if(window.JPUX&&JPUX.toast)return JPUX.toast(m);}catch(e){}
  var t=document.createElement('div');t.className='vsx-toast';t.textContent=m;
  document.body.appendChild(t);setTimeout(function(){t.remove();},3400);}
function accent(){try{var v=getComputedStyle(document.documentElement).getPropertyValue('--red')
  ||getComputedStyle(document.documentElement).getPropertyValue('--accent');
  if(v&&v.trim())return v.trim();}catch(e){}return '#E3120B';}

/* ---------- styles ---------- */
function css(){
  if(document.getElementById('vsx-css'))return;
  var s=document.createElement('style');s.id='vsx-css';
  s.textContent=
  '.vsx{--vsx-a:'+accent()+';border:1px solid rgba(128,128,128,.32);border-radius:16px;padding:16px;margin:16px 0;font:inherit;color:inherit;text-align:left;'+
    'background:rgba(128,128,128,.05);-webkit-backdrop-filter:blur(18px) saturate(160%);backdrop-filter:blur(18px) saturate(160%)}'+
  '.vsx h3{margin:0 0 4px;font-size:16px;font-weight:800}'+
  '.vsx p{margin:0 0 10px;font-size:13px;line-height:1.45;opacity:.72}'+
  '.vsx label.vsx-f{display:block;margin:0 0 10px;font-size:12px;font-weight:700;opacity:.75}'+
  '.vsx select,.vsx input[type=text],.vsx textarea{display:block;width:100%;box-sizing:border-box;margin-top:4px;padding:9px 11px;'+
    'border:1px solid rgba(128,128,128,.4);border-radius:10px;background:rgba(128,128,128,.08);color:inherit;font:inherit;font-size:13.5px;font-weight:600}'+
  '.vsx textarea{font-weight:500;line-height:1.4;resize:vertical}'+
  '.vsx-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:38px;padding:0 14px;border:1px solid rgba(128,128,128,.4);'+
    'border-radius:10px;background:transparent;color:inherit;font:inherit;font-size:13px;font-weight:800;cursor:pointer}'+
  '.vsx-btn.p{background:var(--vsx-a);border-color:var(--vsx-a);color:#fff}'+
  '.vsx-btn[disabled]{opacity:.5;cursor:default}'+
  '.vsx-btn.full{display:flex;width:100%}'+
  '.vsx-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0;align-items:flex-end}'+
  '.vsx-row>*{flex:1;min-width:140px}'+
  '.vsx-row.tight>*{flex:0 0 auto;min-width:0}'+
  '.vsx-ok{border-left:3px solid var(--vsx-a);padding:8px 10px;border-radius:8px;background:rgba(128,128,128,.1);font-size:13px;margin-bottom:10px}'+
  '.vsx-err{border-left:3px solid #d33;padding:8px 10px;border-radius:8px;background:rgba(221,51,51,.12);font-size:13px;margin-bottom:10px}'+
  '.vsx-note{font-size:12.5px;line-height:1.45;opacity:.68;margin:8px 0 0}'+
  '.vsx-sh{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:start;padding:10px 0;border-top:1px solid rgba(128,128,128,.22)}'+
  '.vsx-sh .k{font-size:11.5px;font-weight:800;opacity:.65;padding-top:8px;min-width:44px}'+
  '.vsx-sh .t{font-size:12.5px;font-weight:700;margin-bottom:5px}'+
  '.vsx-sh.off{opacity:.42}'+
  '.vsx-list{max-height:52vh;overflow:auto;margin-top:6px}'+
  '.vsx-res{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid rgba(128,128,128,.2);font-size:12.5px}'+
  '.vsx-res b{font-weight:800}.vsx-res .sp{margin-left:auto}'+
  '.vsx-pill{display:inline-block;font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px;border:1px solid rgba(128,128,128,.4);opacity:.85}'+
  '.vsx-pill.on{color:#0a8f68;border-color:rgba(10,143,104,.45)}'+
  '.vsx-pill.off{color:#c33;border-color:rgba(204,51,51,.45)}'+
    'border:1px solid rgba(128,128,128,.4);background:rgba(20,20,22,.86);color:#fff;font:600 13px/1 -apple-system,sans-serif;cursor:pointer}'+
  '.vsx-wrap{position:fixed;inset:0;z-index:2147483001;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center}'+
  '.vsx-sheet{width:100%;max-width:620px;max-height:88vh;overflow:auto;background:var(--vsx-bg,#17171a);color:var(--vsx-fg,#fff);'+
    'border-radius:18px 18px 0 0;padding:16px 16px 28px}'+
  '.vsx-sheet .vsx{border:0;padding:0;margin:0;background:none}'+
  '.vsx-x{float:right;border:0;background:transparent;color:inherit;font-size:24px;line-height:1;cursor:pointer;padding:0 4px}'+
  '.vsx-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483002;background:#17171a;color:#fff;'+
    'padding:10px 16px;border-radius:12px;font:600 13px/1.3 -apple-system,sans-serif;max-width:86vw}'+
  '@media(min-width:620px){.vsx-wrap{align-items:center}.vsx-sheet{border-radius:18px}}';
  document.head.appendChild(s);
}

/* ---------- pont local ---------- */
function ping(port){
  return new Promise(function(res){
    var ctl=new AbortController(), t=setTimeout(function(){ctl.abort();},1500);
    fetch('http://127.0.0.1:'+port+'/health',{signal:ctl.signal,mode:'cors'})
      .then(function(r){return r.ok?r.json():null;})
      .then(function(j){clearTimeout(t);res(j&&j.app==='voice-studio'?{port:port,info:j}:null);})
      .catch(function(){clearTimeout(t);res(null);});
  });
}
async function discover(){
  base=null;health=null;
  for(var i=0;i<PORTS.length;i++){
    var r=await ping(PORTS[i]);
    if(r){base='http://127.0.0.1:'+r.port;health=r.info;break;}
  }
  if(base)await loadVoices();
  paint();
  return !!base;
}
async function call(route,body){
  var o={method:body?'POST':'GET',mode:'cors'};
  if(body){o.headers={'Content-Type':'application/json'};o.body=JSON.stringify(body);}
  var r=await fetch(base+route,o);
  if(!r.ok){var t=await r.text();throw new Error(t.slice(0,300)||('erreur '+r.status));}
  return r.json();
}
async function loadVoices(){
  try{voices=(await call('/voices')).voices||[];}catch(e){voices=[];}
}

/* ---------- données de l'appli ---------- */
async function boot(){
  try{
    if(!(window.CORE&&CORE.use))return;
    db=await CORE.use('db');
    if(!db)return;
    css();
    await loadProjects();
    await discover();
  }catch(e){}
}
function uid(){try{return (window.__VS_UID)||'';}catch(e){return '';}}
async function loadProjects(){
  projects=[];
  try{
    var me=await db.whoami?db.whoami():null;
  }catch(e){}
  // l'appli range tout sous v/<utilisateur>/… : on retrouve le chemin via l'index
  // l'identifiant utilisateur est la clé des documents par personne :
  // on le retrouve dans l'une des collections que l'appli écrit déjà.
  var ids=[],paths=[];
  var src=['pres','profiles','dir','r'];
  for(var k=0;k<src.length&&!ids.length;k++){
    try{ids=(await db.collection(src[k]).get()).docs.map(function(d){return d.id;});}catch(e){}
  }
  paths=ids.map(function(x){return 'v/'+x+'/idx';});
  for(var i=0;i<paths.length;i++){
    try{
      var sn=await db.collection(paths[i]).get();
      sn.docs.forEach(function(d){
        var o=d.data()||{};o.id=d.id;o.root=paths[i].replace(/\/idx$/,'');
        projects.push(o);
      });
      if(projects.length)break;
    }catch(e){}
  }
  projects.sort(function(a,b){return String(b.updatedAt||'').localeCompare(String(a.updatedAt||''));});
  if(projects.length&&!pid)pid=projects[0].id;
}
function current(){return projects.filter(function(p){return p.id===pid;})[0]||null;}
async function loadShots(){
  shots=[];board=null;
  var p=current();if(!p)return;
  try{
    var b=await db.doc(p.root+'/p/'+p.id+'/meta/board').get();
    board=b&&b.exists?b.data():null;
  }catch(e){}
  try{
    var sn=await db.collection(p.root+'/p/'+p.id+'/shots').get();
    var all=sn.docs.map(function(d){var o=d.data()||{};o.id=d.id;return o;});
    var order=(board&&board.order)||[];
    var by={};all.forEach(function(s){by[s.id]=s;});
    shots=order.map(function(i){return by[i];}).filter(Boolean);
    all.forEach(function(s){if(shots.indexOf(s)<0)shots.push(s);});
  }catch(e){shots=[];}
}

/* découpe le scénario par timecode, comme dans l'app */
function blocks(sc){
  var text=String(sc||''),re=/^\s*(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})\s*(?:\(([^)]*)\))?\s*$/gm,m,marks=[];
  while((m=re.exec(text)))marks.push({at:m.index,end:re.lastIndex,title:(m[3]||'').trim()});
  return marks.map(function(mk,i){
    var body=text.slice(mk.end,i+1<marks.length?marks[i+1].at:text.length);
    var lines=body.split('\n').map(function(l){return l.trim();}).filter(function(l){
      return l&&!/^(CAMÉRA|CAMERA|SON|TRANSITION)\s*:/i.test(l)&&!/^SÉQUENCE\s/i.test(l);});
    return {title:mk.title,text:lines.join(' ')};
  });
}
function suggest(s,i,mode){
  if(s.vo)return s.vo;
  if(mode==='scenario'){
    var bl=blocks(board&&board.scenario);
    var t=bl.filter(function(b){return b.title&&s.title&&b.title.toLowerCase()===String(s.title).toLowerCase();})[0];
    return (t||bl[i]||{}).text||'';
  }
  return s[mode]||'';
}
function fileName(s,i){
  var p=current()||{};
  var pre=[(p.client||''),String(p.project||'').split(' ')[0]].filter(Boolean).join('_').replace(/\s+/g,'')||'VoixOff';
  var seq=String(s.seq||1);if(seq.length<2)seq='0'+seq;
  var num=String(s.scene||(i+1));if(num.length<2)num='0'+num;
  return pre+'_'+seq+'_'+num+'_VOIXOFF_v01';
}

/* ---------- rendu ---------- */
function html(){
  var h='<h3>Génération voix</h3>';
  if(!base){
    h+='<p>Les voix off sont générées sur ton Mac par <b>Voice Studio</b> : rien ne part sur internet, et le clonage de voix reste chez toi.</p>'+
       '<div class="vsx-err">Voice Studio n’est pas détecté sur cette machine.</div>'+
       '<p class="vsx-note">Ouvre l’application Voice Studio, attends que le moteur soit prêt, puis reviens ici. '+
       'Cet onglet a besoin de <b>Chrome</b> : Safari bloque les appels vers une application locale.</p>'+
       '<button class="vsx-btn p full" data-vsx="scan">Rechercher l’application</button>';
    if(msg)h+='<p class="vsx-note">'+esc(msg)+'</p>';
    return h;
  }
  h+='<div class="vsx-ok"><span class="vsx-pill on">connecté</span> '+esc(base)+
     ' · moteur '+esc(health.device||'?')+' · '+voices.length+' voix'+
     (health.loaded?'':' · le modèle se charge au premier essai')+'</div>';

  h+='<div class="vsx-row"><label class="vsx-f">Projet<select data-vsx="pid">'+
     projects.map(function(p){return '<option value="'+esc(p.id)+'"'+(p.id===pid?' selected':'')+'>'+esc(p.name||p.id)+'</option>';}).join('')+
     '</select></label>'+
     '<label class="vsx-f">Voix<select data-vsx="voice"><option value="">voix par défaut</option>'+
     voices.map(function(v){return '<option value="'+esc(v.id)+'">'+esc(v.name)+'</option>';}).join('')+
     '</select></label></div>';

  h+='<div class="vsx-row"><label class="vsx-f">Pré-remplir avec<select data-vsx="src">'+
     '<option value="scenario">le scénario découpé par plan</option>'+
     '<option value="son">le champ « son »</option>'+
     '<option value="image">la description de l’image</option>'+
     '<option value="title">le titre du plan</option>'+
     '<option value="">rien</option></select></label>'+
     '<div style="flex:0 0 auto"><button class="vsx-btn" data-vsx="fill">Appliquer</button></div></div>';

  if(!shots.length)h+='<p class="vsx-note">Aucun plan dans ce projet.</p>';
  else{
    h+='<div class="vsx-list">'+shots.map(function(s,i){
      return '<div class="vsx-sh" data-i="'+i+'">'+
        '<label class="k"><input type="checkbox" data-vsx="on" checked> '+esc(s.id)+'</label>'+
        '<div><div class="t">'+esc(s.title||'(sans titre)')+'</div>'+
        '<textarea rows="2" data-vsx="text" placeholder="Texte dit par la voix off">'+esc(suggest(s,i,'scenario'))+'</textarea>'+
        '<p class="vsx-note">'+esc(fileName(s,i))+'.wav</p></div></div>';
    }).join('')+'</div>';
    h+='<div class="vsx-row tight" style="margin-top:12px">'+
       '<button class="vsx-btn p" data-vsx="go"'+(busy?' disabled':'')+'>'+(busy?'Génération…':'Générer les voix off')+'</button>'+
       (busy?'<button class="vsx-btn" data-vsx="stop">Arrêter</button>':'')+
       '<button class="vsx-btn" data-vsx="save">Enregistrer les textes</button></div>';
    h+='<p class="vsx-note">Les textes sont gardés dans le plan (champ « voix off ») : tu les retrouves d’une session à l’autre. Les fichiers .wav sont écrits dans le dossier réglé dans Voice Studio.</p>';
  }
  if(msg)h+='<div class="vsx-ok" style="margin-top:10px">'+esc(msg)+'</div>';
  if(results.length){
    h+='<h3 style="margin-top:16px">Dernier rendu</h3>'+results.map(function(r){
      return '<div class="vsx-res"><b>'+esc(r.name)+'</b><span>'+(r.ok?(r.seconds+' s'):esc(r.error||'échec'))+'</span>'+
        (r.ok?'<span class="sp"><button class="vsx-btn" data-vsx="play" data-f="'+esc(r.file)+'" style="min-height:30px;font-size:11.5px">Écouter</button></span>':'')+
        '</div>';
    }).join('');
  }
  return h;
}
function paint(){
  if(card&&card.isConnected)card.innerHTML=html();
  var sh=document.getElementById('vsx-sheet');
  if(sh)sh.querySelector('.vsx').innerHTML=html();
}

/* ---------- actions ---------- */
function rows(){
  var root=(card&&card.isConnected)?card:document.getElementById('vsx-sheet');
  return root?[].slice.call(root.querySelectorAll('.vsx-sh')):[];
}
function collect(){
  var out=[];
  rows().forEach(function(el){
    if(!el.querySelector('[data-vsx=on]').checked)return;
    var i=+el.dataset.i,s=shots[i],t=el.querySelector('[data-vsx=text]').value.trim();
    if(!t)return;
    out.push({id:s.id,text:t,name:fileName(s,i),_i:i});
  });
  return out;
}
async function saveTexts(){
  var p=current();if(!p)return;
  var ops=[];
  rows().forEach(function(el){
    var i=+el.dataset.i,s=shots[i],t=el.querySelector('[data-vsx=text]').value;
    if(String(s.vo||'')===t)return;
    s.vo=t;ops.push({path:p.root+'/p/'+p.id+'/shots/'+s.id,vo:t});
  });
  if(!ops.length)return toast('Rien à enregistrer.');
  var done=0;
  for(var i=0;i<ops.length;i++){
    try{await db.doc(ops[i].path).update({vo:ops[i].vo});done++;}
    catch(e){try{await db.doc(ops[i].path).set({vo:ops[i].vo},{merge:true});done++;}catch(e2){}}
  }
  toast(done+' texte'+(done>1?'s':'')+' enregistré'+(done>1?'s':'')+'.');
}
async function generate(){
  var items=collect();
  if(!items.length)return toast('Aucun plan avec du texte.');
  var root=(card&&card.isConnected)?card:document.getElementById('vsx-sheet');
  var voice=root.querySelector('[data-vsx=voice]').value||null;
  items.forEach(function(it){it.voice=voice;delete it._i;});
  busy=true;results=[];msg='';paint();
  var timer=setInterval(async function(){
    try{var p=await call('/progress');if(p&&p.total){msg=p.done+' / '+p.total+' — '+(p.label||'');paint();}}catch(e){}
  },1200);
  try{
    await saveTexts();
    var r=await call('/batch',{items:items,lang:'fr'});
    results=r.results||[];
    msg=r.ok+' voix off générées'+(r.failed?', '+r.failed+' en échec':'')+' — '+r.outDir;
  }catch(e){msg='Échec : '+e.message;}
  finally{clearInterval(timer);busy=false;paint();}
}

document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('[data-vsx]');if(!t)return;
  var a=t.getAttribute('data-vsx');
  if(a==='open'){sheet();return;}
  if(a==='close'){var w=document.getElementById('vsx-wrap');if(w)w.remove();return;}
  if(a==='scan'){msg='recherche…';paint();discover().then(function(ok){
    msg=ok?'':'Toujours rien. Vérifie que Voice Studio est ouvert et que le moteur est prêt.';paint();});return;}
  if(a==='fill'){
    var root=(card&&card.isConnected)?card:document.getElementById('vsx-sheet');
    var mode=root.querySelector('[data-vsx=src]').value;
    rows().forEach(function(el){var i=+el.dataset.i,s=shots[i];
      var v=mode?(mode==='scenario'?suggest({},i,'scenario')||'':(s[mode]||'')):'';
      if(mode==='scenario'){var bl=blocks(board&&board.scenario);
        var m=bl.filter(function(b){return b.title&&s.title&&b.title.toLowerCase()===String(s.title).toLowerCase();})[0];
        v=(m||bl[i]||{}).text||'';}
      el.querySelector('[data-vsx=text]').value=v;});
    return;}
  if(a==='save'){saveTexts();return;}
  if(a==='go'){generate();return;}
  if(a==='stop'){call('/cancel').catch(function(){});return;}
  if(a==='play'){
    fetch(base+'/file?path='+encodeURIComponent(t.getAttribute('data-f')),{mode:'cors'})
      .then(function(r){return r.blob();})
      .then(function(b){new Audio(URL.createObjectURL(b)).play();})
      .catch(function(){toast('Lecture impossible.');});
    return;}
},true);
document.addEventListener('change',function(e){
  var t=e.target.closest&&e.target.closest('[data-vsx=pid]');
  if(t){pid=t.value;loadShots().then(paint);return;}
  var o=e.target.closest&&e.target.closest('[data-vsx=on]');
  if(o){o.closest('.vsx-sh').classList.toggle('off',!o.checked);}
},true);

/* ---------- insertion dans le back office ---------- */
var RX=/^(r[ée]glages|param[èe]tres|settings|back.?office|pr[ée]f[ée]rences|interface|administration)\b/i;
function vis(el){if(!el||!el.getClientRects)return false;var r=el.getBoundingClientRect();return r.width>40&&r.height>6;}
/* un seul point d'ancrage : le sous-onglet « Outils extérieurs » des Réglages.
   Plus de recherche par titre, qui faisait apparaître ce bloc à plusieurs endroits. */
function findHost(){
  return document.getElementById('ext-host-vsx');
  /* eslint-disable no-unreachable */
  var hs=document.querySelectorAll('h1,h2,h3,.kicker,.eyebrow,.sub-kicker');
  for(var i=0;i<hs.length;i++){
    var el=hs[i],t=(el.textContent||'').trim();
    if(!t||t.length>40||!RX.test(t))continue;
    if(el.closest('nav,.rail,.tabbar,.vsx,.bkx,[role=navigation],[role=tablist]'))continue;
    if(!vis(el))continue;
    var p=el.parentElement,n=0,sec=el.closest('section,main,article');
    while(p&&n<7){
      var r=p.getBoundingClientRect();
      if(r.height>180&&p!==document.body&&p.tagName!=='HTML'&&!/^(NAV|HEADER)$/.test(p.tagName))return p;
      p=p.parentElement;n++;
    }
    if(sec&&sec!==document.body&&vis(sec))return sec;
  }
  return null;
}
function place(){
  if(!db)return;
  if(card&&card.isConnected&&card.parentElement&&
     (card.parentElement.id==='ext-host-vsx'||vis(card.parentElement)))return;
  var host=findHost();
  if(host){
    if(!card){card=document.createElement('div');card.className='vsx';card.id='vsx-card';}
    if(card.parentElement!==host){
      host.appendChild(card);
      card.innerHTML=html();
      if(!shots.length)loadShots().then(paint);
    }
    return;
  }
  // pas de bouton flottant : rien ne doit passer par-dessus l'interface.
}
function sheet(){
  if(document.getElementById('vsx-wrap'))return;
  var w=document.createElement('div');w.className='vsx-wrap';w.id='vsx-wrap';
  w.innerHTML='<div class="vsx-sheet" id="vsx-sheet"><button class="vsx-x" data-vsx="close" aria-label="Fermer">×</button><div class="vsx"></div></div>';
  document.body.appendChild(w);
  w.querySelector('.vsx').innerHTML=html();
  if(!shots.length)loadShots().then(paint);
  w.addEventListener('click',function(e){if(e.target===w)w.remove();});
}

function start(){
  css();boot();
  var q=0;
  new MutationObserver(function(){if(q)return;q=requestAnimationFrame(function(){q=0;place();});})
    .observe(document.body,{childList:true,subtree:true});
  setInterval(place,1500);setTimeout(place,900);
  setInterval(function(){if(!base)discover();},30000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
