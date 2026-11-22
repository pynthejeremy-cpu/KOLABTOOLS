/* ---- IA Studio · Réglages : deux sous-onglets « Sauvegarde » et « Outils extérieurs » ----
   Avant, les blocs Sauvegarde et Génération voix s'accrochaient à tout écran dont le titre
   ressemblait à « Réglages » : ils apparaissaient en double (Réglages ET Back office).
   Ils n'ont désormais qu'un seul point d'ancrage, ici. */
(function () {
if (window.__EXT) return; window.__EXT = 1;

var MY = [
  ['backup', 'Sauvegarde', 'cloud_sync'],
  ['tools', 'Outils extérieurs', 'extension']
];
var KEY = 'ia_ext_tab';
var active = '';
try { active = localStorage.getItem(KEY) || ''; } catch (e) {}

function css() {
  if (document.getElementById('ext-css')) return;
  var s = document.createElement('style'); s.id = 'ext-css';
  s.textContent =
    '.ext-pane{margin-top:4px}' +
    '.ext-pane[hidden]{display:none!important}' +
    '.ext-tool{display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-top:1px solid var(--line,rgba(128,128,128,.3))}' +
    '.ext-tool:first-of-type{border-top:0}' +
    '.ext-tool .ms{font-size:22px;opacity:.75;flex:none;margin-top:1px}' +
    '.ext-tool .g{flex:1;min-width:0}' +
    '.ext-tool b{display:block;font-size:14px;font-weight:800}' +
    '.ext-tool span{display:block;font-size:12.5px;opacity:.72;line-height:1.45;margin-top:3px}' +
    '.ext-st{flex:none;font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;' +
      'border:1px solid var(--line,rgba(128,128,128,.4));white-space:nowrap}' +
    '.ext-st.on{color:#0a8f68;border-color:rgba(10,143,104,.5)}' +
    '.ext-st.off{color:#c33;border-color:rgba(204,51,51,.5)}' +
    '.ext-h{margin:0 0 2px;font-size:16px;font-weight:800}' +
    '.ext-d{margin:0 0 14px;font-size:13px;opacity:.72;line-height:1.5}';
  document.head.appendChild(s);
}

function row(icon, name, desc, id) {
  return '<div class="ext-tool"><span class="ms" aria-hidden="true">' + icon + '</span>' +
    '<div class="g"><b>' + name + '</b><span>' + desc + '</span></div>' +
    '<span class="ext-st" id="' + id + '">…</span></div>';
}
function toolsIntro() {
  var d = document.createElement('div');
  d.innerHTML =
    '<h3 class="ext-h">Outils connectés</h3>' +
    '<p class="ext-d">Tout ce que le studio pilote en dehors de lui-même : les services qui tournent sur ta machine et ceux appelés par API.</p>' +
    row('graphic_eq', 'Voice Studio', 'Voix off et clonage de voix, en local sur ton Mac. Ports 8765 à 8767.', 'ext-st-vs') +
    row('movie_filter', 'ComfyUI', 'Génération vidéo en local, Wan 2.1 FLF2V. Port 8188.', 'ext-st-cf') +
    row('auto_awesome', 'Higgsfield', 'Images et vidéos par API. Compte et crédits réglés dans « Paramètres de mon compte ».', 'ext-st-hf') +
    row('cloud', 'Google Drive', 'Dépôt de la sauvegarde quotidienne.', 'ext-st-gd');
  return d;
}

function probe(url, ms) {
  return new Promise(function (res) {
    var c = new AbortController(), t = setTimeout(function () { c.abort(); }, ms || 1500);
    fetch(url, { signal: c.signal, mode: 'cors' })
      .then(function (r) { clearTimeout(t); res(!!r); })
      .catch(function () { clearTimeout(t); res(false); });
  });
}
function set(id, on, label) {
  var e = document.getElementById(id);
  if (!e) return;
  e.textContent = label;
  e.className = 'ext-st' + (on === true ? ' on' : on === false ? ' off' : '');
}
var probing = false;
async function refreshTools() {
  if (probing || !document.getElementById('ext-st-vs')) return;
  probing = true;
  try {
    var ports = [8765, 8766, 8767], vs = false;
    for (var i = 0; i < ports.length && !vs; i++) vs = await probe('http://127.0.0.1:' + ports[i] + '/health');
    set('ext-st-vs', vs, vs ? 'connecté' : 'non détecté');
    var cf = await probe('http://127.0.0.1:8188/system_stats');
    set('ext-st-cf', cf, cf ? 'connecté' : 'non détecté');
    var hf = false;
    try { hf = !!(window.S && S.acct && S.acct.higgs && S.acct.higgs.linked); } catch (e) {}
    set('ext-st-hf', hf || null, hf ? 'relié' : 'par API');
    var gd = null;
    try {
      var db = window.CORE && CORE.use ? await CORE.use('db') : null;
      var d = db ? await db.doc('cfg/_backup').get() : null;
      var f = d && d.exists ? d.data() : null;
      gd = !!(f && f.folderId);
    } catch (e) {}
    set('ext-st-gd', gd === null ? null : gd, gd ? 'dossier réglé' : 'à régler');
  } finally { probing = false; }
}

/* ---------- greffe sur les onglets natifs de Réglages ---------- */
function paint() {
  var page = document.getElementById('setPage');
  if (!page) return;
  var bar = page.querySelector('.adm-tabs');
  if (!bar) return;
  css();

  var natives = [].slice.call(bar.querySelectorAll('button')).filter(function (b) { return !b.dataset.ext; });
  if (!natives.length) return;

  // nos deux onglets, ajoutés une seule fois après chaque rendu de Réglages
  MY.forEach(function (t) {
    if (bar.querySelector('button[data-ext="' + t[0] + '"]')) return;
    var b = natives[0].cloneNode(false);
    b.dataset.ext = t[0];
    b.removeAttribute('id');
    b.innerHTML = '<span class="ms" aria-hidden="true">' + t[2] + '</span>' + t[1];
    b.onclick = function () {
      active = t[0];
      try { localStorage.setItem(KEY, active); } catch (e) {}
      paint();
    };
    bar.appendChild(b);
  });
  natives.forEach(function (b) {
    if (b.dataset.extBound) return;
    b.dataset.extBound = '1';
    b.addEventListener('click', function () {
      active = '';
      try { localStorage.setItem(KEY, ''); } catch (e) {}
      setTimeout(paint, 0);
    }, true);
  });

  // le conteneur natif des réglages = le premier .adm-box qui n'est pas à nous
  var box = null;
  [].slice.call(page.children).forEach(function (n) {
    if (!box && n.classList && n.classList.contains('adm-box') && !n.classList.contains('ext-pane')) box = n;
  });

  MY.forEach(function (t) {
    var pane = page.querySelector('#ext-pane-' + t[0]);
    if (!pane) {
      pane = document.createElement('div');
      pane.className = 'adm-box ext-pane';
      pane.id = 'ext-pane-' + t[0];
      var host = document.createElement('div');
      host.id = t[0] === 'backup' ? 'ext-host-bkx' : 'ext-host-vsx';
      if (t[0] === 'tools') pane.appendChild(toolsIntro());
      pane.appendChild(host);
      page.appendChild(pane);
    }
    pane.hidden = active !== t[0];
    var b = bar.querySelector('button[data-ext="' + t[0] + '"]');
    if (b) {
      b.setAttribute('aria-selected', String(active === t[0]));
      b.setAttribute('aria-pressed', String(active === t[0]));
    }
  });

  if (active) {
    if (box) box.hidden = true;
    natives.forEach(function (b) { b.setAttribute('aria-selected', 'false'); b.setAttribute('aria-pressed', 'false'); });
    refreshTools();
  } else if (box) box.hidden = false;
}

function start() {
  css(); paint();
  var host = document.getElementById('view-settings');
  if (host) {
    var q = 0;
    new MutationObserver(function () {
      if (q) return;
      q = requestAnimationFrame(function () { q = 0; paint(); });
    }).observe(host, { childList: true, subtree: true });
  }
  setInterval(paint, 1200);
  setInterval(function () { if (active === 'tools') refreshTools(); }, 20000);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
