/* ---- Sauvegarde : module commun aux applis de Jérémy (bkx) ---- */
(function(){
if(window.__BKX)return;window.__BKX=1;
var CFGP="cfg/_backup",LISTC="backups";
var db=null,cfg={},list=[],RS=null,card=null,fab=null,ready=false,tab=0;

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function accent(){try{var cs=getComputedStyle(document.documentElement),v;
  var ks=["--red","--accent","--da-accent","--brand","--primary","--ac"];
  for(var i=0;i<ks.length;i++){v=(cs.getPropertyValue(ks[i])||"").trim();if(v)return v}
}catch(e){}return "#E3120B"}
function when(t){if(!t)return "";var d=new Date(t);return isNaN(d)?String(t):d.toLocaleString("fr-FR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
function fid(v){var m=String(v||"").trim().match(/[-\w]{25,}/);return m?m[0]:""}
function toast(m){try{if(window.JPUX&&JPUX.toast)return JPUX.toast(m)}catch(e){}
  var t=document.createElement("div");t.className="bkx-toast";t.textContent=m;document.body.appendChild(t);
  setTimeout(function(){t.remove()},3200)}

/* ---------- styles ---------- */
function css(){
  if(document.getElementById("bkx-css"))return;
  var s=document.createElement("style");s.id="bkx-css";
  s.textContent=
  ".bkx{--bkx-a:"+accent()+";border:1px solid rgba(128,128,128,.32);border-radius:16px;padding:16px;margin:16px 0;font:inherit;color:inherit;text-align:left}"+
  ".bkx h3{margin:0 0 4px;font-size:16px;font-weight:800}"+
  ".bkx p{margin:0 0 10px;font-size:13px;line-height:1.45;opacity:.72}"+
  ".bkx label.bkx-f{display:block;margin:0 0 10px;font-size:12px;font-weight:700;opacity:.75}"+
  ".bkx input[type=text],.bkx input[type=number]{display:block;width:100%;box-sizing:border-box;margin-top:4px;padding:10px 12px;border:1px solid rgba(128,128,128,.4);border-radius:10px;background:rgba(128,128,128,.07);color:inherit;font:inherit;font-size:14px;font-weight:600}"+
  ".bkx-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:40px;padding:0 14px;border:1px solid rgba(128,128,128,.4);border-radius:10px;background:transparent;color:inherit;font:inherit;font-size:13px;font-weight:800;cursor:pointer}"+
  ".bkx-btn.p{background:var(--bkx-a);border-color:var(--bkx-a);color:#fff}"+
  ".bkx-btn[disabled]{opacity:.5;cursor:default}"+
  ".bkx-btn.full{display:flex;width:100%}"+
  ".bkx-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}"+
  ".bkx-row>*{flex:1;min-width:130px}"+
  ".bkx-note{font-size:12.5px;line-height:1.45;opacity:.68;margin:8px 0 0}"+
  ".bkx-ok{border-left:3px solid var(--bkx-a);padding:8px 10px;border-radius:8px;background:rgba(128,128,128,.1);font-size:13px;margin-bottom:10px}"+
  ".bkx-err{border-left:3px solid #d33;padding:8px 10px;border-radius:8px;background:rgba(221,51,51,.12);font-size:13px;margin-bottom:10px}"+
  ".bkx-it{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid rgba(128,128,128,.22);font-size:13px}"+
  ".bkx-it b{display:block;font-weight:800;font-size:13px;word-break:break-all}"+
  ".bkx-it span{display:block;font-size:11.5px;opacity:.65;margin-top:2px}"+
  ".bkx-it a{margin-left:auto;flex:0 0 auto;font-size:11.5px;font-weight:800;color:var(--bkx-a);text-decoration:none;border:1px solid rgba(128,128,128,.4);border-radius:8px;padding:5px 9px}"+
  ".bkx-chip{display:inline-flex;align-items:center;gap:5px;min-height:32px;padding:0 11px;margin:0 6px 6px 0;border:1px solid rgba(128,128,128,.4);border-radius:999px;background:transparent;color:inherit;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}"+
  ".bkx-chip.on{background:var(--bkx-a);border-color:var(--bkx-a);color:#fff}"+
  ".bkx-chip i{font-style:normal;opacity:.65;font-size:11px}"+
  ".bkx-fab{position:fixed;left:14px;bottom:14px;z-index:2147483000;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid rgba(128,128,128,.4);background:rgba(20,20,22,.86);color:#fff;font:600 13px/1 -apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;backdrop-filter:blur(12px)}"+
  ".bkx-wrap{position:fixed;inset:0;z-index:2147483001;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}"+
  ".bkx-sheet{width:100%;max-width:560px;max-height:88vh;overflow:auto;background:var(--bkx-bg,#17171a);color:var(--bkx-fg,#fff);border-radius:20px;padding:18px 18px 22px;border:1px solid rgba(255,255,255,.14);box-shadow:0 20px 60px rgba(0,0,0,.45);-webkit-overflow-scrolling:touch}"+
  ".bkx-sheet .bkx{border:0;padding:0;margin:0}"+
  ".bkx-x{float:right;border:0;background:transparent;color:inherit;font-size:24px;line-height:1;cursor:pointer;padding:0 4px}"+
  ".bkx-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483002;background:#17171a;color:#fff;padding:10px 16px;border-radius:12px;font:600 13px/1.3 -apple-system,sans-serif;max-width:86vw}"+
  "@media(min-width:620px){.bkx-wrap{align-items:center}.bkx-sheet{border-radius:18px}}";
  document.head.appendChild(s);
}

/* ---------- base ---------- */
async function boot(){
  try{
    if(!(window.CORE&&CORE.use))return;
    db=await CORE.use("db");
    if(!db)return;
    try{var d=await db.doc(CFGP).get();if(d&&d.exists)cfg=d.data()||{}}catch(e){}
    try{db.collection(LISTC).onSnapshot(function(sn){
      list=sn.docs.map(function(x){var o=x.data()||{};o.id=x.id;return o})
        .sort(function(a,b){return String(b.at||"").localeCompare(String(a.at||""))});
      paint();
    },function(){})}catch(e){}
    ready=true;css();paint();
  }catch(e){}
}

async function save(){
  var box=card&&card.querySelector("#bkx-folder"),nm=card&&card.querySelector("#bkx-name"),kp=card&&card.querySelector("#bkx-keep");
  var raw=box?box.value:"",id=fid(raw);
  if(raw.trim()&&!id)return toast("Lien de dossier Drive non reconnu.");
  var keep=Math.max(5,Math.min(365,parseInt(kp&&kp.value,10)||30));
  var next={folderId:id,folderName:(nm&&nm.value||"").trim(),
    folderUrl:id?(/^https?:/i.test(raw.trim())?raw.trim():"https://drive.google.com/drive/folders/"+id):"",
    keep:keep,at:new Date().toISOString()};
  try{
    var cur=null;try{cur=await db.doc(CFGP).get()}catch(e){}
    if(cur&&cur.exists)await db.doc(CFGP).set(next);else await db.doc(CFGP).set(next);
    cfg=next;toast("Dossier de sauvegarde enregistré");paint();
  }catch(e){toast("Enregistrement impossible : "+(e&&e.message||"refusé"))}
}

/* ---------- restauration ---------- */
async function take(f){
  RS={name:f.name};paint();
  try{
    var d=JSON.parse(await f.text());
    if(!d||typeof d!=="object"||!d.collections)throw 0;
    RS.data=d;RS.pick={};
    Object.keys(d.collections).forEach(function(c){RS.pick[c]=!/^(roles|access|invites|admin)$/.test(c)});
  }catch(e){RS={err:"Ce fichier n'est pas une sauvegarde lisible. Prenez le fichier .json du dossier de sauvegarde."}}
  paint();
}
async function run(mode){
  var all=RS.data.collections||{},cols=Object.keys(RS.pick).filter(function(c){return RS.pick[c]&&(all[c]||[]).length});
  var n=cols.reduce(function(a,c){return a+all[c].length},0);
  if(!n)return toast("Aucune table sélectionnée.");
  var msg=n+" document"+(n>1?"s":"")+" sur "+cols.length+" table"+(cols.length>1?"s":"")+" ("+cols.join(", ")+").\n"+
    (mode==="over"?"Les éléments portant le même identifiant seront remplacés par ceux du fichier.":"Seuls les éléments absents aujourd'hui seront recréés.");
  var ok=false;
  try{ok=window.JPUX&&JPUX.confirm?await JPUX.confirm({title:mode==="over"?"Écraser avec cette sauvegarde ?":"Compléter avec cette sauvegarde ?",msg:msg,ok:mode==="over"?"Écraser":"Compléter",cancel:"Annuler",danger:mode==="over"}):confirm(msg)}catch(e){ok=confirm(msg)}
  if(!ok)return;
  RS.run={i:0,n:n};paint();
  var w=0,sk=0,bad=0;
  for(var ci=0;ci<cols.length;ci++){var c=cols[ci],arr=all[c];
    for(var k=0;k<arr.length;k++){var doc=arr[k],id=doc&&doc.id;
      if(!id){bad++;RS.run.i++;continue}
      var body={};for(var f in doc)if(f!=="id")body[f]=doc[f];
      try{
        if(mode==="fill"){var ex=null;try{ex=await db.doc(c+"/"+id).get()}catch(e){}
          if(ex&&ex.exists){sk++;RS.run.i++;continue}}
        await db.doc(c+"/"+id).set(body);w++;
      }catch(e){bad++}
      RS.run.i++;
      if(RS.run.i%10===0)paint();
    }
  }
  RS={done:w+" document"+(w>1?"s":"")+" restauré"+(w>1?"s":"")+(sk?" · "+sk+" déjà présent"+(sk>1?"s":""):"")+(bad?" · "+bad+" en échec":"")};
  paint();
}

/* ---------- rendu ---------- */
function html(){
  var f=cfg||{},h="";
  h+='<h3>Sauvegarde quotidienne</h3>'+
     '<p>Chaque soir, toutes les données de cette appli sont enregistrées dans un fichier Excel et un fichier .json déposés dans ce dossier Google Drive.</p>';
  if(f.folderId)h+='<div class="bkx-ok">Dossier actuel : <b>'+esc(f.folderName||f.folderId)+'</b>'+(f.folderUrl?' · <a href="'+esc(f.folderUrl)+'" target="_blank" rel="noopener" style="color:inherit">ouvrir dans Drive</a>':'')+'</div>';
  else h+='<div class="bkx-ok">Aucun dossier choisi ici : la sauvegarde se dépose dans le dossier par défaut de cette appli.</div>';
  h+='<label class="bkx-f">Lien ou identifiant du dossier Drive<input type="text" id="bkx-folder" value="'+esc(f.folderUrl||f.folderId||"")+'" placeholder="https://drive.google.com/drive/folders/…"></label>'+
     '<label class="bkx-f">Nom du dossier (pour l\'affichage)<input type="text" id="bkx-name" maxlength="80" value="'+esc(f.folderName||"")+'" placeholder="ex. Sauvegardes de l\'appli"></label>'+
     '<label class="bkx-f">Nombre de sauvegardes conservées<input type="number" id="bkx-keep" min="5" max="365" value="'+(f.keep||30)+'"></label>'+
     '<button class="bkx-btn p full" data-bkx="save">Enregistrer le dossier</button>'+
     '<p class="bkx-note">Le dossier doit appartenir au compte Google connecté, ou être partagé avec lui en modification. Au-delà du nombre indiqué, les plus anciennes passent à la corbeille.</p>';

  h+='<h3 style="margin-top:18px">Restaurer une sauvegarde</h3>';
  if(RS&&RS.run)h+='<div class="bkx-ok">'+RS.run.i+' / '+RS.run.n+' documents écrits…</div>';
  else if(RS&&RS.done)h+='<div class="bkx-ok">'+esc(RS.done)+'</div><button class="bkx-btn full" data-bkx="clear">Fermer</button>';
  else{
    h+='<p>Reprenez le fichier <b>.json</b> qui accompagne le fichier Excel. Rien n\'est écrit tant que vous n\'avez pas confirmé.</p>';
    if(RS&&RS.err)h+='<div class="bkx-err">'+esc(RS.err)+'</div>';
    if(!RS||!RS.data)h+='<label class="bkx-btn full" style="cursor:pointer">📂 Choisir un fichier de sauvegarde<input type="file" accept=".json,application/json" id="bkx-file" style="display:none"></label>';
    else{
      var cols=Object.keys(RS.data.collections||{}).filter(function(c){return (RS.data.collections[c]||[]).length});
      h+='<div class="bkx-ok">'+esc(RS.name)+' · sauvegarde du '+esc(when(RS.data.at))+(RS.data.app?' · '+esc(RS.data.app):'')+'</div><div>'+
        cols.map(function(c){return '<button class="bkx-chip'+(RS.pick[c]?" on":"")+'" data-bkx="col" data-k="'+esc(c)+'">'+esc(c)+'<i>'+RS.data.collections[c].length+'</i></button>'}).join("")+
        '</div><p class="bkx-note">Appuyez sur une table pour l\'inclure ou l\'exclure. Les rôles et les accès sont exclus par défaut.</p>'+
        '<div class="bkx-row"><button class="bkx-btn" data-bkx="fill">Compléter</button><button class="bkx-btn p" data-bkx="over">Écraser</button></div>'+
        '<p class="bkx-note"><b>Compléter</b> n\'écrit que les éléments absents aujourd\'hui. <b>Écraser</b> réécrit par-dessus chaque élément du fichier ; ce qui a été créé depuis n\'est pas supprimé.</p>'+
        '<button class="bkx-btn full" data-bkx="clear">Choisir un autre fichier</button>';
    }
  }

  h+='<h3 style="margin-top:18px">Dernières sauvegardes</h3>';
  if(!list.length)h+='<p>Aucune sauvegarde enregistrée pour l\'instant. La première arrivera ce soir.</p>';
  else h+=list.slice(0,8).map(function(b){
    var c=b.counts||{},det=Object.keys(c).map(function(k){return c[k]+" "+k}).join(" · ");
    return '<div class="bkx-it"><div><b>'+esc(b.file||b.id||"Sauvegarde")+'</b><span>'+esc(when(b.at))+(det?" · "+esc(det):"")+(b.err?" · "+esc(b.err):"")+'</span></div>'+
      (b.url?'<a href="'+esc(b.url)+'" target="_blank" rel="noopener">Ouvrir</a>':'')+'</div>';
  }).join("");
  return h;
}
function paint(){
  if(!ready)return;
  if(card&&card.isConnected)card.innerHTML=html();
  var sh=document.getElementById("bkx-sheet");
  if(sh)sh.querySelector(".bkx").innerHTML=html();
}

/* ---------- insertion dans l'écran de réglages ---------- */
var RX=/^(r[ée]glages|param[èe]tres|settings|back.?office|pr[ée]f[ée]rences|interface)\b/i;
function vis(el){if(!el||!el.getClientRects)return false;var r=el.getBoundingClientRect();return r.width>40&&r.height>6}
function findHost(){
  var hs=document.querySelectorAll("h1,h2,h3,.kicker,.eyebrow,.sub-kicker");
  for(var i=0;i<hs.length;i++){
    var el=hs[i],t=(el.textContent||"").trim();
    if(!t||t.length>40||!RX.test(t))continue;
    if(el.closest("nav,.rail,.tabbar,.bkx,[role=navigation],[role=tablist]"))continue;
    if(!vis(el))continue;
    var p=el.parentElement,n=0,sec=el.closest("section,main,article");
    while(p&&n<7){
      var r=p.getBoundingClientRect();
      if(r.height>180&&p!==document.body&&p.tagName!=="HTML"&&!/^(NAV|HEADER)$/.test(p.tagName))return p;
      p=p.parentElement;n++;
    }
    if(sec&&sec!==document.body&&vis(sec))return sec;
  }
  return null;
}
function place(){
  if(!ready)return;
  if(card&&card.isConnected&&card.parentElement&&vis(card.parentElement)){if(fab)fab.style.display="none";return}
  var host=findHost();
  if(host){
    if(!card){card=document.createElement("div");card.className="bkx";card.id="bkx-card"}
    if(card.parentElement!==host){host.appendChild(card);card.innerHTML=html()}
    if(fab)fab.style.display="none";
    return;
  }
  if(!fab){
    fab=document.createElement("button");fab.className="bkx-fab";fab.type="button";
    fab.textContent="Sauvegarde";fab.setAttribute("data-bkx","open");
    document.body.appendChild(fab);
  }
  fab.style.display="";
}
function sheet(){
  if(document.getElementById("bkx-wrap"))return;
  var w=document.createElement("div");w.className="bkx-wrap";w.id="bkx-wrap";
  w.innerHTML='<div class="bkx-sheet" id="bkx-sheet"><button class="bkx-x" data-bkx="close" aria-label="Fermer">×</button><div class="bkx"></div></div>';
  document.body.appendChild(w);
  w.querySelector(".bkx").innerHTML=html();
  w.addEventListener("click",function(e){if(e.target===w)w.remove()});
}

/* ---------- interactions ---------- */
document.addEventListener("click",function(e){
  var t=e.target.closest&&e.target.closest("[data-bkx]");if(!t)return;
  var a=t.getAttribute("data-bkx");
  if(a==="open"){sheet();return}
  if(a==="close"){var w=document.getElementById("bkx-wrap");if(w)w.remove();return}
  if(!ready)return;
  if(a==="save"){t.disabled=true;save().then(function(){t.disabled=false});return}
  if(a==="clear"){RS=null;paint();return}
  if(a==="col"){if(RS&&RS.pick){RS.pick[t.getAttribute("data-k")]=!RS.pick[t.getAttribute("data-k")];paint()}return}
  if(a==="fill"||a==="over"){if(RS&&RS.data)run(a==="fill"?"fill":"over");return}
},true);
document.addEventListener("change",function(e){
  if(e.target&&e.target.id==="bkx-file"&&e.target.files&&e.target.files[0])take(e.target.files[0]);
});

/* ---------- démarrage ---------- */
function start(){
  css();boot();
  var q=0;
  new MutationObserver(function(){if(q)return;q=requestAnimationFrame(function(){q=0;place()})})
    .observe(document.body,{childList:true,subtree:true});
  setInterval(place,1500);
  setTimeout(place,600);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
