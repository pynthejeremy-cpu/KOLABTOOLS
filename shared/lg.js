/* Liquid Glass — couche universelle (fond vivant, parallaxe, verre, relief 3D, profondeur).
   S'adapte aux couleurs de l'application. Réglable dans Réglages > Liquid Glass. v1 */
(function(){
if(window.__LG)return;
if(document.getElementById("lg-js")||document.getElementById("lg-bg")||document.documentElement.classList.contains("lg"))return;
window.__LG=1;
var D={on:true,blur:26,alpha:58,hl:60,wall:true,tilt:true},K="lg_cfg_v1",C=D;
try{var raw=localStorage.getItem(K); if(raw)C=Object.assign({},D,JSON.parse(raw));}catch(e){}
var R=document.documentElement, reduce=false;
try{reduce=matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}
var hoverOK=false; try{hoverOK=matchMedia("(hover:hover) and (pointer:fine)").matches}catch(e){}

/* ---------- couleurs ---------- */
function rgb(s){var m=String(s||"").match(/rgba?\(([^)]+)\)/); if(!m)return null;
  var p=m[1].split(",").map(parseFloat); return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}}
function lum(c){return c?(0.2126*c.r+0.7152*c.g+0.0722*c.b)/255:0}
function sat(c){if(!c)return 0;var mx=Math.max(c.r,c.g,c.b),mn=Math.min(c.r,c.g,c.b);return mx?(mx-mn)/mx:0}
function css(c,a){return "rgba("+Math.round(c.r)+","+Math.round(c.g)+","+Math.round(c.b)+","+(a==null?1:a)+")"}
var pageBgStr="", pageBg=null, accent=null, light=false, scrollEl=null;
function findScroller(){
  var best=null,ba=0,all=document.body.querySelectorAll("*"),n=Math.min(all.length,3000);
  for(var i=0;i<n;i++){ var e=all[i]; if(e.closest("#lqgpanel,#lqgbg"))continue;
    if(e.scrollHeight>e.clientHeight+40){ var s=getComputedStyle(e);
      if(/auto|scroll/.test(s.overflowY)){ var a=e.clientWidth*e.clientHeight; if(a>ba){ba=a;best=e} } } }
  return best;
}
function opaqueBg(el){ while(el&&el!==R){ var c=rgb(getComputedStyle(el).backgroundColor); if(c&&c.a>.5)return c; el=el.parentElement } 
  return rgb(getComputedStyle(R).backgroundColor)||rgb(getComputedStyle(document.body).backgroundColor) }
function readPalette(){
  scrollEl=findScroller();
  var cb=opaqueBg(scrollEl||document.body)||{r:16,g:16,b:18,a:1}, b=css(cb);
  pageBgStr=b; pageBg=cb; light=lum(cb)>0.55;
  var vars=["--red","--accent","--primary","--brand","--acc"],v=null;
  for(var i=0;i<vars.length;i++){var x=getComputedStyle(R).getPropertyValue(vars[i]).trim();
    if(x){var el=document.createElement("span");el.style.color=x;document.body.appendChild(el);
      var cc=rgb(getComputedStyle(el).color);el.remove(); if(cc&&sat(cc)>.35){v=cc;break}}}
  if(!v){var best=null,bs=.35;
    document.querySelectorAll("button,.btn,a,[class*=pri],[class*=accent],[class*=fab]").forEach(function(e,i){
      if(i>160)return; var c=rgb(getComputedStyle(e).backgroundColor);
      if(c&&c.a>.5&&sat(c)>bs&&lum(c)>.08&&lum(c)<.85){bs=sat(c);best=c}});
    v=best;}
  accent=v||{r:227,g:18,b:11,a:1};
}

/* ---------- feuille de style ---------- */
function paint(){
  var hl=(C.hl/100), a=C.alpha+"%", blur=C.blur+"px";
  var line = light? "rgba(0,0,0,"+(0.10+hl*0.08).toFixed(3)+")" : "rgba(255,255,255,"+(hl*0.34).toFixed(3)+")";
  var top  = light? "rgba(255,255,255,"+(hl*0.85).toFixed(3)+")" : "rgba(255,255,255,"+(hl*0.52).toFixed(3)+")";
  var sh   = light? "0 10px 28px rgba(0,0,0,.12)" : "0 12px 32px rgba(0,0,0,.28)";
  R.style.setProperty("--lqg-a",a); R.style.setProperty("--lqg-blur",blur); R.style.setProperty("--lqg-hl",hl.toFixed(2));
  R.style.setProperty("--lqg-line",line); R.style.setProperty("--lqg-top",top); R.style.setProperty("--lqg-sh",sh);
  R.style.setProperty("--lqg-acc",css(accent)); R.style.setProperty("--lqg-acc2",css({r:(accent.r+40)%255,g:(accent.g+90)%255,b:255}));
  R.style.setProperty("--lqg-acc3",css({r:0,g:194,b:255}));
  if(pageBgStr)R.style.background=pageBgStr;
  R.classList.toggle("lqg-light",light);
}
var CSS = [
"html.lqgx{--sy:0;--lqg-r:20px}",
"html.lqgx body{background:transparent!important}",
"#lqgbg{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;display:none;contain:strict}",
"html.lqgx.lqg-wall #lqgbg{display:block}",
"#lqgbg b{position:absolute;display:block;border-radius:50%;filter:blur(66px);will-change:transform;backface-visibility:hidden}",
"#lqgbg b:nth-child(1){width:72vmax;height:72vmax;left:-26vmax;top:-28vmax;background:radial-gradient(circle at 38% 38%,var(--lqg-acc),transparent 66%);opacity:.60}",
"#lqgbg b:nth-child(2){width:58vmax;height:58vmax;right:-22vmax;top:8vh;background:radial-gradient(circle at 50% 50%,var(--lqg-acc2),transparent 68%);opacity:.42}",
"#lqgbg b:nth-child(3){width:64vmax;height:64vmax;left:8vw;bottom:-32vmax;background:radial-gradient(circle at 50% 50%,var(--lqg-acc3),transparent 66%);opacity:.34}",
"#lqgbg i{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 0%,transparent 42%,rgba(0,0,0,.36) 100%)}",
"html.lqgx.lqg-light #lqgbg b{opacity:.26}",
"html.lqgx.lqg-light #lqgbg i{background:radial-gradient(120% 90% at 50% 0%,transparent 45%,rgba(255,255,255,.55) 100%)}",
"html.lqgx .lqg-clear{background-color:transparent!important;background-image:none!important}",
"html.lqgx .lqg-s{background-color:color-mix(in srgb,var(--lqg-own,#1c1c20) var(--lqg-a),transparent)!important;",
"  border:1px solid var(--lqg-line)!important;box-shadow:inset 0 1px 0 var(--lqg-top),var(--lqg-sh)!important;",
"  border-radius:var(--lqg-r);position:relative;isolation:isolate;transition:transform .22s cubic-bezier(.2,.7,.2,1),box-shadow .22s}",
"html.lqgx .lqg-s.lqg-blur{-webkit-backdrop-filter:blur(calc(var(--lqg-blur)*.72)) saturate(165%);backdrop-filter:blur(calc(var(--lqg-blur)*.72)) saturate(165%)}",
"html.lqgx .lqg-s::before{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:-1;background:linear-gradient(158deg,rgba(255,255,255,calc(var(--lqg-hl)*.16)),transparent 46%)}",
"html.lqgx .lqg-bar{background-color:color-mix(in srgb,var(--lqg-own,#1c1c20) calc(var(--lqg-a) + 16%),transparent)!important;",
"  -webkit-backdrop-filter:blur(var(--lqg-blur)) saturate(185%);backdrop-filter:blur(var(--lqg-blur)) saturate(185%);",
"  box-shadow:inset 0 1px 0 var(--lqg-line),var(--lqg-sh)!important}",
"html.lqgx .lqg-pill{background-color:color-mix(in srgb,var(--lqg-own,#1c1c20) var(--lqg-a),transparent)!important;",
"  border:1px solid var(--lqg-line)!important;box-shadow:inset 0 1px 0 var(--lqg-top),0 4px 14px rgba(0,0,0,.16)!important;",
"  }",
"html.lqgx .lqg-acc{position:relative;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 8px 22px color-mix(in srgb,var(--lqg-own,#000) 45%,transparent)!important}",
"html.lqgx .lqg-acc::after{content:'';position:absolute;top:0;bottom:0;width:38%;left:-45%;pointer-events:none;background:linear-gradient(100deg,transparent,rgba(255,255,255,.3),transparent);transform:skewX(-18deg);animation:lqgSheen 7s cubic-bezier(.4,0,.2,1) infinite}",
"@keyframes lqgSheen{0%,72%{left:-45%}100%{left:125%}}",
"html.lqgx .lqg-head{will-change:transform}",
"html.lqgx.lqg-par .lqg-head{transform:translate3d(0,calc(var(--sy)*0.26px),0);opacity:max(0,calc(1 - var(--sy)/460))}",
"html.lqgx.lqg-tilt .lqg-s.lqg-on{transform:perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) translate3d(0,-2px,0);box-shadow:inset 0 1px 0 var(--lqg-top),0 20px 46px rgba(0,0,0,.34)!important}",
"html.lqgx.lqg-tilt .lqg-s.lqg-on::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(42% 42% at var(--mx,50%) var(--my,50%),rgba(255,255,255,calc(var(--lqg-hl)*.24)),transparent 70%)}",
"html.lqgx .lqg-s:active,html.lqgx .lqg-pill:active{transform:perspective(900px) scale(.976)}",
"html.lqgx .lqg-ovl{-webkit-backdrop-filter:blur(5px) saturate(.9);backdrop-filter:blur(5px) saturate(.9);background-color:rgba(0,0,0,.44)!important;transition:backdrop-filter .3s}",
"html.lqgx .lqg-modal{background-color:color-mix(in srgb,var(--lqg-own,#1c1c20) calc(var(--lqg-a) + 24%),transparent)!important;",
"  -webkit-backdrop-filter:blur(calc(var(--lqg-blur) + 8px)) saturate(180%);backdrop-filter:blur(calc(var(--lqg-blur) + 8px)) saturate(180%);",
"  border:1px solid var(--lqg-line)!important;box-shadow:inset 0 1px 0 var(--lqg-top),0 -20px 60px rgba(0,0,0,.44)!important;animation:lqgUp .3s cubic-bezier(.32,.72,0,1) both}",
"@keyframes lqgUp{from{opacity:.4;transform:translate3d(0,14px,0) scale(.985)}to{opacity:1;transform:none}}",
"html.lqgx.lqg-modalopen .lqg-shell{transform:scale(.965) translate3d(0,8px,0);filter:brightness(.75) saturate(.92)}",
"html.lqgx .lqg-shell{transition:transform .34s cubic-bezier(.32,.72,0,1),filter .34s ease;transform-origin:50% 0}",
"@supports not (background:color-mix(in srgb,red 50%,transparent)){html.lqgx :is(.lqg-s,.lqg-bar,.lqg-pill,.lqg-modal){background-color:rgba(128,128,128,.3)!important}}",
"@media (prefers-reduced-motion:reduce){html.lqgx *{animation:none!important}html.lqgx .lqg-head{transform:none;opacity:1}}",
/* panneau de réglages */
".lqg-card{margin:14px 0;padding:16px;border-radius:18px;background:color-mix(in srgb,var(--lqg-own2,#1c1c20) 70%,transparent);border:1px solid var(--lqg-line);box-shadow:inset 0 1px 0 var(--lqg-top);color:inherit;font-size:14px}",
".lqg-card h3{margin:0 0 4px;font-size:16px}.lqg-card .lqg-note{opacity:.65;font-size:12.5px;line-height:1.5;margin:0 0 10px}",
".lqg-row{display:grid;grid-template-columns:120px 1fr 56px;align-items:center;gap:10px;margin:9px 0;font-weight:700}",
".lqg-row input[type=range]{width:100%;accent-color:var(--lqg-acc)}.lqg-row b{text-align:right;font-variant-numeric:tabular-nums;opacity:.8}",
".lqg-sw{display:flex;gap:8px;margin:10px 0 0;flex-wrap:wrap}",
".lqg-sw button{flex:1 1 auto;min-height:44px;border-radius:12px;border:1px solid var(--lqg-line);background:color-mix(in srgb,var(--lqg-own2,#1c1c20) 60%,transparent);color:inherit;font-weight:800;font-size:13.5px;cursor:pointer;padding:0 12px}",
".lqg-sw button[aria-pressed=true]{background:var(--lqg-acc);color:#fff;border-color:transparent}",
"#lqgpanel{position:fixed;inset:0;z-index:2147483000;display:none;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.45);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}",
"#lqgpanel.open{display:flex}#lqgpanel .lqg-card{width:min(560px,100%);margin:0;max-height:88vh;overflow:auto;border-radius:22px 22px 0 0;padding:18px 18px calc(22px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--lqg-own2,#1c1c20) 86%,transparent);-webkit-backdrop-filter:blur(30px) saturate(180%);backdrop-filter:blur(30px) saturate(180%)}",
"#lqgpanel .lqg-x{float:right;background:none;border:0;color:inherit;font-size:26px;line-height:1;cursor:pointer;opacity:.6}"
].join("\n");

/* ---------- init DOM ---------- */
var st=document.createElement("style"); st.id="lqgcss"; st.textContent=CSS; document.head.appendChild(st);
var bg=document.createElement("div"); bg.id="lqgbg"; bg.setAttribute("aria-hidden","true"); bg.innerHTML="<b></b><b></b><b></b><i></i>";
document.body.insertBefore(bg,document.body.firstChild);

/* ---------- détection des surfaces ---------- */
var blurCount=0;
var seen=new WeakSet(), SKIP=/^(HTML|BODY|SCRIPT|STYLE|IMG|CANVAS|SVG|VIDEO|PATH|G|USE|BR|HR|OPTION|IFRAME|LINK|META|NOSCRIPT)$/;
function vw(){return innerWidth} function vh(){return innerHeight}
function tag(el){
  if(!el||el.nodeType!==1||seen.has(el))return;
  if(SKIP.test(el.tagName)||el.closest("#lqgpanel,#lqgbg"))return;
  seen.add(el);
  var s=getComputedStyle(el); if(s.display==="none"||s.visibility==="hidden")return;
  var bi=s.backgroundImage||"none"; if(bi!=="none"&&bi.indexOf("gradient")<0)return;   // photos : on ne touche pas
  var c=rgb(s.backgroundColor); if(!c||c.a<0.25)return;
  var w=el.offsetWidth,h=el.offsetHeight; if(w<40||h<18)return;
  var same=pageBg&&Math.abs(lum(c)-lum(pageBg))<0.016&&Math.abs(c.r-pageBg.r)<12&&Math.abs(c.g-pageBg.g)<12&&Math.abs(c.b-pageBg.b)<12;
  var full=w>=vw()*.985&&h>=vh()*.985;
  var fixed=s.position==="fixed"||s.position==="sticky";
  var satc=sat(c), isAcc=satc>.45&&c.a>.8&&lum(c)>.1&&lum(c)<.9;
  var own=css(c,1); el.style.setProperty("--lqg-own",own);
  // barres fixes ou collantes : verre renforcé
  if(fixed&&!isAcc&&(w>=vw()*.55||h>=vh()*.55)){ el.classList.add("lqg-bar"); return; }
  if(el===scrollEl){ el.classList.add("lqg-clear"); return; }
  if(full||(same&&w>vw()*.5&&!fixed)){ el.classList.add("lqg-clear"); return; }
  if(same&&parseFloat(s.borderTopWidth)<1&&!fixed){ el.classList.add("lqg-clear"); return; }
  // reflet réservé aux boutons principaux ; les pastilles colorées gardent leur couleur
  if(isAcc){
    var btn=/^(BUTTON|A)$/.test(el.tagName)||el.getAttribute("role")==="button"||/btn|button|fab|cta/i.test(el.className||"");
    if(btn&&h>=34&&h<=86&&w>=100)el.classList.add("lqg-acc");
    return;
  }
  var radius=parseFloat(s.borderRadius)||0;
  var small=h<=56&&w<=340;
  var nestedIn=el.parentElement&&el.parentElement.closest(".lqg-s,.lqg-bar,.lqg-modal");
  if(small){ el.classList.add("lqg-pill"); if(radius<8)el.style.borderRadius="14px"; return; }
  el.classList.add("lqg-s"); if(!nestedIn&&blurCount<40){el.classList.add("lqg-blur");blurCount++}
  if(radius<8)el.style.borderRadius="var(--lqg-r)";
}
function sweep(root){
  var list=(root||document.body).querySelectorAll("*"); var n=Math.min(list.length,4000);
  for(var i=0;i<n;i++)tag(list[i]);
  if(root&&root.nodeType===1)tag(root);
}

/* ---------- en-tête, coquille, modales ---------- */
var head=null, shell=null;
function findHead(){
  var cands=document.querySelectorAll("header,.bandeau,[class*=hero],[class*=banner],[class*=topbar],[class*=entete]");
  for(var i=0;i<cands.length;i++){var e=cands[i],s=getComputedStyle(e);
    if(s.position==="fixed"||s.position==="sticky")continue;
    if(e.offsetHeight<60||e.offsetHeight>vh()*.7)continue;
    if(e.closest("#lqgpanel"))continue;
    if(head&&head!==e)head.classList.remove("lqg-head");
    head=e; e.classList.add("lqg-head"); return}
}
function findShell(){
  var best=null,ba=0;
  Array.prototype.forEach.call(document.body.children,function(e){
    if(e.id==="lqgbg"||e.id==="lqgpanel"||SKIP.test(e.tagName))return;
    var s=getComputedStyle(e); if(s.position==="fixed")return;
    var a=e.offsetWidth*e.offsetHeight; if(a>ba){ba=a;best=e}});
  if(best){ if(shell&&shell!==best)shell.classList.remove("lqg-shell"); shell=best; best.classList.add("lqg-shell") }
}
function modals(){
  var open=false;
  document.querySelectorAll("div,section,aside,dialog").forEach(function(e){
    if(e.closest("#lqgpanel,#lqgbg"))return;
    var s=getComputedStyle(e); if(s.position!=="fixed")return;
    if(s.display==="none"||s.visibility==="hidden"||+s.opacity<.05)return;
    if(e.offsetWidth<vw()*.9||e.offsetHeight<vh()*.9)return;
    var c=rgb(s.backgroundColor); if(!c||c.a<.12||c.a>.96)return;
    if(lum(c)>.35)return;
    e.classList.add("lqg-ovl"); open=true;
    var pane=null,ba=0;
    Array.prototype.forEach.call(e.children,function(k){var a=k.offsetWidth*k.offsetHeight; if(a>ba){ba=a;pane=k}});
    if(pane&&ba>vw()*vh()*.12){ var pc=rgb(getComputedStyle(pane).backgroundColor);
      if(pc&&pc.a>.3){ pane.style.setProperty("--lqg-own",css(pc,1)); pane.classList.add("lqg-modal"); pane.classList.remove("lqg-s","lqg-blur") } }
  });
  var inShell=shell&&shell.querySelector(".lqg-ovl");
  R.classList.toggle("lqg-modalopen",open&&!inShell);
}

/* ---------- parallaxe ---------- */
var tick=false;
function onScroll(e){
  if(!C.wall&&!C.on)return; if(tick)return; tick=true;
  requestAnimationFrame(function(){ tick=false;
    var t=e&&e.target, y=0;
    if(t&&t.scrollTop!=null&&t!==document)y=t.scrollTop; else y=window.scrollY||0;
    if(y<0)y=0; R.style.setProperty("--sy",String(Math.round(y)));
    var o=bg.children;
    o[0].style.transform="translate3d(0,"+(-y*0.10).toFixed(1)+"px,0)";
    o[1].style.transform="translate3d(0,"+(-y*0.055).toFixed(1)+"px,0)";
    o[2].style.transform="translate3d(0,"+(-y*0.028).toFixed(1)+"px,0)";
  });
}
if(!reduce)document.addEventListener("scroll",onScroll,true);

/* ---------- relief 3D ---------- */
if(hoverOK&&!reduce){
  var cur=null,pend=null,raf=false;
  document.addEventListener("pointermove",function(e){ pend=e; if(raf)return; raf=true;
    requestAnimationFrame(function(){ raf=false; var e2=pend; if(!e2||!R.classList.contains("lqg-tilt"))return;
      var t=(e2.target&&e2.target.closest)?e2.target.closest(".lqg-s"):null;
      if(cur&&cur!==t){cur.classList.remove("lqg-on");cur.style.removeProperty("--rx");cur.style.removeProperty("--ry")}
      if(!t||t.offsetHeight>vh()*.9){cur=null;return}
      var r=t.getBoundingClientRect(); if(!r.width||!r.height)return;
      var px=(e2.clientX-r.left)/r.width, py=(e2.clientY-r.top)/r.height;
      cur=t; t.classList.add("lqg-on");
      t.style.setProperty("--ry",((px-.5)*6.5).toFixed(2)+"deg");
      t.style.setProperty("--rx",((.5-py)*6.5).toFixed(2)+"deg");
      t.style.setProperty("--mx",(px*100).toFixed(1)+"%"); t.style.setProperty("--my",(py*100).toFixed(1)+"%");
    })},{passive:true});
  document.addEventListener("pointerdown",function(){if(cur){cur.classList.remove("lqg-on");cur=null}},{passive:true});
}

/* ---------- panneau de réglages ---------- */
var panel=null;
function card(inline){
  var g=C;
  var sl=function(k,l,mn,mx,u){return '<label class="lqg-row"><span>'+l+'</span><input type="range" min="'+mn+'" max="'+mx+'" value="'+g[k]+'" data-lg="'+k+'"><b id="lqgv-'+k+'">'+g[k]+u+'</b></label>'};
  var sw=function(k,l){return '<div class="lqg-sw" style="align-items:center"><span style="flex:1 1 140px;font-weight:700">'+l+'</span>'+
    '<button data-lgt="'+k+'" data-v="1" aria-pressed="'+(g[k]!==false)+'">Oui</button><button data-lgt="'+k+'" data-v="0" aria-pressed="'+(g[k]===false)+'">Non</button></div>'};
  return '<h3>Liquid Glass'+(inline?'':'')+'</h3><p class="lqg-note">Verre dépoli, fond vivant, parallaxe et relief 3D. Les couleurs restent celles de l\'application.</p>'+
    sw("on","Effet Liquid Glass")+
    (g.on!==false?('<div style="margin-top:12px">'+sl("blur","Flou",0,40," px")+sl("alpha","Opacité du verre",20,92," %")+sl("hl","Reflets",0,100," %")+'</div>'+
      sw("wall","Fond vivant et parallaxe")+sw("tilt","Relief 3D au survol")+
      '<div class="lqg-sw"><button data-lgr="1" style="flex:1">Réglages par défaut</button></div>'):'');
}
function panelHTML(){ return '<div class="lqg-card"><button class="lqg-x" data-lgclose="1" aria-label="Fermer">×</button>'+card()+'</div>' }
function openPanel(){
  if(!panel){ panel=document.createElement("div"); panel.id="lqgpanel"; document.body.appendChild(panel);
    panel.addEventListener("click",function(e){ if(e.target===panel)closePanel() }); }
  panel.innerHTML=panelHTML(); panel.classList.add("open"); syncOwn();
}
function closePanel(){ if(panel)panel.classList.remove("open"); if(location.hash==="#lg")history.replaceState(null,"",location.pathname+location.search) }
function syncOwn(){ var c=rgb(getComputedStyle(document.body).backgroundColor)||pageBg; if(c)R.style.setProperty("--lqg-own2",css(c,1)) }
function refreshUI(){ if(panel&&panel.classList.contains("open"))panel.innerHTML=panelHTML();
  var inl=document.querySelector(".lqg-settings"); if(inl)inl.innerHTML=card(true) }
function save(){ try{localStorage.setItem(K,JSON.stringify(C))}catch(e){} }
function apply(){
  R.classList.toggle("lqgx",C.on!==false);
  R.classList.toggle("lqg-wall",C.on!==false&&C.wall!==false&&!reduce);
  R.classList.toggle("lqg-par",C.on!==false&&C.wall!==false&&!reduce);
  R.classList.toggle("lqg-tilt",C.on!==false&&C.tilt!==false&&hoverOK&&!reduce);
  paint();
}
document.addEventListener("input",function(e){ var k=e.target&&e.target.dataset&&e.target.dataset.lg; if(!k)return;
  C[k]=+e.target.value; var v=document.getElementById("lqgv-"+k); if(v)v.textContent=C[k]+(k==="blur"?" px":" %"); paint(); save() });
document.addEventListener("click",function(e){
  var t=e.target&&e.target.closest?e.target.closest("[data-lgt],[data-lgr],[data-lgclose],[data-lgopen]"):null; if(!t)return;
  if(t.dataset.lgclose!==undefined){closePanel();return}
  if(t.dataset.lgopen!==undefined){e.preventDefault();openPanel();return}
  if(t.dataset.lgr!==undefined){C=Object.assign({},D);save();apply();refreshUI();return}
  var k=t.dataset.lgt; C[k]=t.dataset.v==="1"; save(); apply(); refreshUI();
  if(k==="on"&&C.on)setTimeout(function(){seen=new WeakSet();blurCount=0;sweep();findHead();findShell()},30);
});
addEventListener("hashchange",function(){ if(location.hash==="#lg")openPanel() });

/* insertion dans un écran "Réglages" si on en trouve un */
function inlineSettings(){
  if(C.on===false&&!document.querySelector(".lqg-settings")){}
  if(document.querySelector(".lqg-settings"))return;
  var hs=document.querySelectorAll("h1,h2,h3,.h1,.h2,.kicker,[class*=kicker],[class*=eyebrow],[class*=surtitre]");
  for(var i=0;i<hs.length;i++){ var h=hs[i];
    if(h.closest("#lqgpanel"))continue;
    var txt=(h.textContent||"").trim().toLowerCase().replace(/[^a-zàâéèêëîïôûùüç ]/g,"");
    if(!/^(réglages|reglages|paramètres|parametres|settings|préférences|preferences|interface)\b/.test(txt))continue;
    if(!h.offsetParent)continue;
    var host=h.closest("section,article,main>div"); 
    if(!host||host.offsetHeight<60||host.offsetWidth<240)continue;
    if(host.closest("nav")||host.closest("header"))continue;
    var d=document.createElement("div"); d.className="lqg-card lqg-settings"; d.innerHTML=card(true);
    host.appendChild(d); syncOwn(); return;
  }
}

/* ---------- observation ---------- */
var deb=null;
function refresh(added){
  if(C.on===false)return;
  if(added&&added.length){ for(var i=0;i<added.length;i++){ var n=added[i]; if(n.nodeType===1){ sweep(n) } } }
  else sweep();
  findHead(); findShell(); modals(); inlineSettings(); syncOwn();
}
var mo=new MutationObserver(function(recs){
  var added=[];
  for(var i=0;i<recs.length;i++){ var r=recs[i];
    if(r.type==="childList"){ for(var j=0;j<r.addedNodes.length;j++){ var n=r.addedNodes[j];
      if(n.nodeType===1&&!n.closest("#lqgpanel,#lqgbg"))added.push(n) } } }
  clearTimeout(deb); deb=setTimeout(function(){ refresh(added.length?added:null) },260);
});

function boot(){ readPalette(); apply(); sweep(); findHead(); findShell(); modals(); inlineSettings(); syncOwn();
  mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style"]});
  if(location.hash==="#lg")openPanel();
  setTimeout(function(){ readPalette(); apply(); refresh() },1200);
  setTimeout(function(){ refresh() },3000);
}
window.LG={open:openPanel,set:function(o){Object.assign(C,o);save();apply();refreshUI()},get:function(){return Object.assign({},C)},rescan:function(){seen=new WeakSet();blurCount=0;refresh()},
  /* Relit les couleurs après un changement de thème ou de style (menu Apparence). */
  repaint:function(){
    document.querySelectorAll(".lqg-s,.lqg-bar,.lqg-pill,.lqg-clear,.lqg-acc,.lqg-blur,.lqg-on").forEach(function(e){
      e.classList.remove("lqg-s","lqg-bar","lqg-pill","lqg-clear","lqg-acc","lqg-blur","lqg-on");e.style.removeProperty("--lqg-own")});
    R.style.background="";seen=new WeakSet();blurCount=0;readPalette();apply();refresh();
  }};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot); else boot();
})();
