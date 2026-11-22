/* ---- IA Studio · un seul onglet « Projet » qui regroupe les vues de création ----
   Le module ne touche pas à la logique de l'appli : il lit l'état dans le DOM et
   déclenche la navigation en cliquant les boutons d'origine, simplement masqués. */
(function () {
if (window.__GRP) return; window.__GRP = 1;

var CREA = [
  ['scenario','Scénario','edit_note'],
  ['mood','Moodboard','photo_library'],
  ['chars','Personnages','person'],
  ['products','Produits','inventory_2'],
  ['light','Lumière','wb_incandescent'],
  ['story','Storyboard','movie'],
  ['previz','Prévis 3D','view_in_ar'],
  ['edit','Montage','movie_edit']
];
var KEYS = CREA.map(function (c) { return c[0]; });
var LAST = 'ia_grp_last';
var btn = null, sub = null, lastPaint = '';

function css() {
  if (document.getElementById('grp-css')) return;
  var s = document.createElement('style'); s.id = 'grp-css';
  s.textContent =
    '.rail-sec[data-sec="crea"]{display:none!important}' +
    '#railProject{display:none!important}' +
    '.grp-sub{position:sticky;top:0;z-index:5;display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;' +
      'margin:0 0 18px;padding:8px 0;background:var(--paper,#fff);border-bottom:2px solid var(--bd,currentColor)}' +
    '.grp-sub[hidden]{display:none!important}' +
    '.grp-sub::-webkit-scrollbar{display:none}' +
    '.grp-sub button{display:inline-flex;align-items:center;gap:7px;flex:0 0 auto;padding:9px 14px;border:0;' +
      'background:none;color:var(--mid,#777);font:inherit;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap}' +
    '.grp-sub button:hover{color:var(--ink,#000)}' +
    '.grp-sub button[aria-current="page"]{color:var(--ink,#000);box-shadow:inset 0 -3px 0 var(--red,#E3120B)}' +
    '.grp-sub .ms{font-size:18px}' +
    '@media (max-width:760px){.grp-sub{margin-bottom:14px}.grp-sub button{padding:8px 11px;font-size:12.5px}' +
      '.grp-sub button .l{display:none}.grp-sub button[aria-current="page"] .l{display:inline}}';
  document.head.appendChild(s);
}

function railBtn(v) { return document.querySelector('.rail-btn[data-view="' + v + '"]'); }
function currentView() {
  var open = document.querySelector('main > section.view:not([hidden])');
  return open ? String(open.id || '').replace(/^view-/, '') : '';
}
function allowed() {
  return KEYS.filter(function (v) { var b = railBtn(v); return b && !b.hidden; });
}
function hasProject() {
  var b = railBtn('story') || railBtn('scenario');
  return b ? !b.disabled : false;
}
function go(v) { var b = railBtn(v); if (b) b.click(); }
function target() {
  var want = '';
  try { want = localStorage.getItem(LAST) || ''; } catch (e) {}
  var ok = allowed();
  return ok.indexOf(want) >= 0 ? want : (ok[0] || 'story');
}

function makeBtn() {
  if (btn && btn.isConnected) return;
  var rp = document.getElementById('railProject');
  var host = rp && rp.parentElement;
  if (!host) return;
  btn = document.createElement('button');
  btn.className = 'rail-btn'; btn.id = 'grpProjet'; btn.type = 'button';
  btn.innerHTML = '<span class="ms" aria-hidden="true">movie</span><span class="l">Projet</span>';
  btn.addEventListener('click', function () { if (!btn.disabled) go(target()); });
  host.insertBefore(btn, rp.nextSibling);
}
function makeSub() {
  if (sub && sub.isConnected) return;
  var main = document.querySelector('main');
  if (!main) return;
  sub = document.createElement('nav');
  sub.className = 'grp-sub'; sub.id = 'grpSub'; sub.hidden = true;
  sub.setAttribute('aria-label', 'Vues du projet');
  sub.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button[data-v]');
    if (!b) return;
    try { localStorage.setItem(LAST, b.dataset.v); } catch (err) {}
    go(b.dataset.v);
  });
  main.insertBefore(sub, main.firstChild);
}

function paint() {
  makeBtn(); makeSub();
  var v = currentView(), ok = allowed(), has = hasProject();
  var sig = v + '|' + ok.join(',') + '|' + has;
  if (sig === lastPaint) return;
  lastPaint = sig;

  var inCrea = KEYS.indexOf(v) >= 0;
  if (sub) {
    sub.hidden = !inCrea;
    if (inCrea) {
      try { localStorage.setItem(LAST, v); } catch (e) {}
      sub.innerHTML = CREA.filter(function (c) { return ok.indexOf(c[0]) >= 0; }).map(function (c) {
        return '<button type="button" data-v="' + c[0] + '"' + (c[0] === v ? ' aria-current="page"' : '') + '>' +
          '<span class="ms" aria-hidden="true">' + c[2] + '</span><span class="l">' + c[1] + '</span></button>';
      }).join('');
    }
  }
  if (btn) {
    if (inCrea) btn.setAttribute('aria-current', 'page'); else btn.removeAttribute('aria-current');
    btn.hidden = ok.length === 0;
    btn.disabled = !has;
    btn.title = has ? '' : 'Ouvrez d’abord un projet';
  }
}

function start() {
  css(); paint();
  var main = document.querySelector('main');
  if (main) {
    var q = 0;
    new MutationObserver(function () {
      if (q) return;
      q = requestAnimationFrame(function () { q = 0; paint(); });
    }).observe(main, { attributes: true, attributeFilter: ['hidden'], subtree: true });
  }
  document.addEventListener('click', function () { setTimeout(paint, 60); }, true);
  setInterval(paint, 1200);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
