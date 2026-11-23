/* ---- KOLABTOOLS : noyau commun à tous les outils ----
   Deux modes, même code :
   - « suite » (appli fusionnée) : base partagée rangée par module (m/<module>/...), administrateurs partagés,
     barre de navigation entre les outils ;
   - « solo » (outil vendu seul, window.KOLAB_MODE = "solo" posé par build.py) : base propre à l'outil, sans préfixe,
     pas de barre de navigation.
   La connexion unique et la charte Refraction (agence.js) sont chargées dans les deux modes. */
(function () {
  "use strict";
  if (window.CORE_READY) return;
  window.CORE_READY = 1;
  var me = document.currentScript;
  var MOD = (me && me.getAttribute("data-mod")) || "hub";
  var SUITE = window.KOLAB_MODE !== "solo";
  var PRE = SUITE ? "m/" + MOD + "/" : "";
  /* identification unique + charte Refraction (agence.js) */
  if (document.readyState === "loading") document.write('<script src="agence.js" data-mod="' + MOD + '"><\/script>');
  else { var ag = document.createElement("script"); ag.src = "agence.js"; ag.setAttribute("data-mod", MOD); document.head.appendChild(ag); }
  /* mode hors ligne en un clic (offl.js) : journal local des écritures et validation avant / après au retour en ligne */
  if (document.readyState === "loading") document.write('<script src="offl.js"><\/script>');
  else { var of = document.createElement("script"); of.src = "offl.js"; document.head.appendChild(of); }
  var MODS = [
    ["hub", "Accueil", "index.html", "◆"],
    ["plan", "Planning", "planning.html", "▦"],
    ["inv", "Inventaire", "inventaire.html", "▣"],
    ["droit", "Droit à l'image", "droit.html", "✎"],
    ["ia", "IA Studio", "studio.html", "✦"],
    ["dam", "DAM Studio", "dam.html", "◧"]
  ];

  function mapPath(p) {
    p = String(p);
    if (!SUITE || MOD === "hub" || p.indexOf("data/") === 0 || p.indexOf("m/") === 0) return p;
    return PRE + p;
  }
  function strip(p) { p = String(p || ""); return PRE && p.indexOf(PRE) === 0 ? p.slice(PRE.length) : p; }

  /* ---------- crochets de synchronisation (posés par les modules) ---------- */
  var hooks = [];
  function fire(op, rawPath, data) {
    for (var i = 0; i < hooks.length; i++) { try { hooks[i](op, strip(rawPath), data, rawPath); } catch (e) {} }
  }

  /* ---------- base enveloppée ---------- */
  function wDoc(r) {
    return {
      id: r.id,
      get path() { return strip(r.path); },
      get: function () { return r.get(); },
      set: function (d) { return r.set(d).then(function (x) { fire("set", r.path, d); return x; }); },
      update: function (d) { return r.update(d).then(function (x) { fire("update", r.path, d); return x; }); },
      delete: function () { return r.delete().then(function (x) { fire("delete", r.path, null); return x; }); },
      acquire: function (o) { return r.acquire(o); },
      onSnapshot: function (a, b) { return r.onSnapshot(a, b); },
      collection: function (p) { return wCol(r.collection(p)); }
    };
  }
  function wCol(c) {
    return {
      get path() { return strip(c.path); },
      doc: function () { return wDoc(arguments.length && arguments[0] !== undefined ? c.doc(arguments[0]) : c.doc()); },
      add: function (d) { var r = c.doc(); return r.set(d).then(function () { fire("set", r.path, d); return wDoc(r); }); },
      where: function (a, b, v) { return c.where(a, b, v); },
      orderBy: function (a, b) { return c.orderBy(a, b); },
      limit: function (n) { return c.limit(n); },
      get: function () { return c.get(); },
      onSnapshot: function (a, b) { return c.onSnapshot(a, b); }
    };
  }
  function wDb(raw) {
    return {
      doc: function (p) { return wDoc(raw.doc(mapPath(p))); },
      collection: function (p) { return wCol(raw.collection(mapPath(p))); }
    };
  }

  /* ---------- administrateurs partagés ---------- */
  var adminP = null;
  function sharedAdmin(user) {
    if (adminP) return adminP;
    adminP = (async function () {
      var real = { owner: false, edit: false };
      try { real.owner = !!(await user.isOwner()); } catch (e) {}
      try { real.edit = !!(await user.canEdit()); } catch (e) {}
      if (real.owner || real.edit) return { admin: true, real: real };
      var roleAdmin = false;
      try {
        var db = await window.claude.use("db"), id = await user.id();
        if (db && id) {
          var t = new Promise(function (ok) { setTimeout(function () { ok([]); }, 5000); });
          var paths = SUITE ? ["m/inv/roles/" + id, "m/plan/roles/" + id] : ["roles/" + id];
          var r = await Promise.race([Promise.all(paths.map(function (p) { return db.doc(p).get().catch(function () { return null; }); })), t]);
          roleAdmin = r.some(function (d) { return d && d.exists && (d.data() || {}).role === "admin"; });
        }
      } catch (e) {}
      return { admin: roleAdmin, real: real };
    })();
    return adminP;
  }
  function wUser(raw) {
    var w = {};
    for (var k in raw) { if (typeof raw[k] === "function") w[k] = raw[k].bind(raw); else w[k] = raw[k]; }
    var client = function () { var A = window.JP_AUTH; return !!(A && A.user && A.user.kind !== "team"); };
    w.isOwner = function () { return client() ? Promise.resolve(false) : sharedAdmin(raw).then(function (s) { return s.admin; }); };
    w.canEdit = function () { return client() ? Promise.resolve(false) : sharedAdmin(raw).then(function (s) { return s.admin; }); };
    if (typeof raw.me === "function") w.me = function () {
      return Promise.resolve(raw.me.apply(raw, arguments)).then(function (m) {
        var A = window.JP_AUTH, u = A && A.user; if (!u) return m;
        return Object.assign({}, m || {}, { name: u.name, email: u.email, agenceRole: u.role, agenceKind: u.kind });
      });
    };
    w.isRealOwner = function () { return sharedAdmin(raw).then(function (s) { return s.real.owner; }); };
    return w;
  }

  /* ---------- point d'entrée remplaçant window.claude ---------- */
  var memo = {};
  var CORE = {
    mod: MOD,
    suite: SUITE,
    use: function (n) {
      if (!window.claude || typeof window.claude.use !== "function") return Promise.resolve(null);
      if (memo[n]) return memo[n];
      memo[n] = window.claude.use(n).then(function (ns) {
        if (!ns) return ns;
        if (n === "db") { var w = wDb(ns); return window.OFFL ? window.OFFL.wrap(w) : w; }
        if (n === "user") return wUser(ns);
        return ns;
      });
      return memo[n];
    },
    raw: function (n) { return (window.claude && window.claude.use) ? window.claude.use(n) : Promise.resolve(null); },
    onWrite: function (fn) { hooks.push(fn); },
    isAdmin: function () { return CORE.raw("user").then(function (u) { return u ? sharedAdmin(u).then(function (s) { return s.admin; }) : false; }); },
    norm: function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); },
    go: function (m) { var x = MODS.filter(function (z) { return z[0] === m; })[0]; if (x) location.href = x[2]; }
  };
  Object.defineProperty(window, "CORE", {
    configurable: true,
    get: function () { return (window.claude && typeof window.claude.use === "function") ? CORE : undefined; }
  });
  window.CORE_API = CORE;

  /* ---------- barre de navigation (Liquid Glass) ---------- */
  if (MOD === "hub" || !SUITE) { if (!SUITE) CORE.projectNames = function () { return Promise.resolve([]); }; return; }
  function nav() {
    if (document.getElementById("core-nav")) return;
    var st = document.createElement("style");
    st.textContent =
      "#core-nav{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:2147483000;font:600 13px/1.2 system-ui,-apple-system,'Segoe UI',sans-serif}" +
      "#core-nav .cn-b{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 7px 12px 9px;border-radius:16px 0 0 16px;border-right:0!important;writing-mode:vertical-rl;border:1px solid rgba(255,255,255,.45);" +
      "background:linear-gradient(135deg,rgba(255,255,255,.55),rgba(255,255,255,.22));color:#111;-webkit-backdrop-filter:blur(18px) saturate(1.6);backdrop-filter:blur(18px) saturate(1.6);" +
      "box-shadow:0 8px 28px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.7);cursor:pointer;font:inherit}" +
      "#core-nav .cn-m{position:absolute;right:calc(100% + 8px);top:50%;transform:translateY(-50%);min-width:210px;padding:6px;border-radius:18px;border:1px solid rgba(255,255,255,.45);" +
      "background:linear-gradient(160deg,rgba(255,255,255,.78),rgba(255,255,255,.5));-webkit-backdrop-filter:blur(22px) saturate(1.7);backdrop-filter:blur(22px) saturate(1.7);box-shadow:0 18px 48px rgba(0,0,0,.25)}" +
      "#core-nav .cn-m[hidden]{display:none}" +
      "#core-nav a{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;color:#111;text-decoration:none}" +
      "#core-nav a:hover,#core-nav a.on{background:rgba(0,0,0,.07)}#core-nav a.on{font-weight:800}" +
      "#core-nav a span{width:18px;text-align:center}" +
      "@media (prefers-color-scheme:dark){#core-nav .cn-b,#core-nav a{color:#f3f3f3}#core-nav .cn-b{background:linear-gradient(135deg,rgba(60,60,70,.6),rgba(30,30,36,.35));border-color:rgba(255,255,255,.18)}" +
      "#core-nav .cn-m{background:linear-gradient(160deg,rgba(40,40,48,.85),rgba(25,25,30,.7));border-color:rgba(255,255,255,.15)}#core-nav a:hover,#core-nav a.on{background:rgba(255,255,255,.1)}}" +
      "@media print{#core-nav{display:none}}";
    document.head.appendChild(st);
    var box = document.createElement("div");
    box.id = "core-nav";
    var cur = MODS.filter(function (z) { return z[0] === MOD; })[0];
    box.innerHTML = '<div class="cn-m" hidden>' + MODS.map(function (z) {
      return '<a href="' + z[2] + '"' + (z[0] === MOD ? ' class="on" aria-current="page"' : "") + '><span>' + z[3] + "</span>" + z[1] + "</a>";
    }).join("") + '</div><button type="button" class="cn-b" aria-haspopup="true" aria-label="Changer d\'outil"><span style=\'writing-mode:horizontal-tb\'>◆</span>' + "Outils</button>";
    document.body.appendChild(box);
    var m = box.querySelector(".cn-m");
    box.querySelector(".cn-b").addEventListener("click", function (e) { e.stopPropagation(); m.hidden = !m.hidden; });
    document.addEventListener("click", function (e) { if (!box.contains(e.target)) m.hidden = true; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") m.hidden = true; });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", nav); else nav();

  /* ---------- noms de projets communs (suggestions dans les champs « Projet ») ---------- */
  CORE.projectNames = async function () {
    var db = await CORE.raw("db"); if (!db) return [];
    var names = {}, add = function (n) { n = String(n || "").trim(); if (n) names[CORE.norm(n)] = n; };
    try { var m = await db.doc("m/plan/st/main").get(); if (m.exists) ((m.data() || {}).clients || []).forEach(function (c) { (c.projects || []).forEach(function (p) { add(p.name); }); }); } catch (e) {}
    try { (await db.collection("m/inv/projects").get()).docs.forEach(function (d) { add((d.data() || {}).name); }); } catch (e) {}
    try { (await db.collection("m/ia/projects").get()).docs.forEach(function (d) { var o = d.data() || {}; add(o.project || o.name); }); } catch (e) {}
    try { (await db.collection("m/dam/projects").get()).docs.forEach(function (d) { add((d.data() || {}).name); }); } catch (e) {}
    return Object.keys(names).map(function (k) { return names[k]; }).sort(function (a, b) { return a.localeCompare(b, "fr"); });
  };
  /* ---------- clients et projets KOLABTOOLS (Planning) : [{client, projects:[noms]}] ---------- */
  CORE.kolabClients = async function () {
    var db = await CORE.raw("db"); if (!db) return [];
    try { var m = await db.doc("m/plan/st/main").get(); if (!m.exists) return [];
      return ((m.data() || {}).clients || []).filter(function (c) { return c && c.name; }).map(function (c) {
        return { client: String(c.name).trim(), projects: (c.projects || []).map(function (p) { return String((p && p.name) || "").trim(); }).filter(Boolean) };
      });
    } catch (e) { return []; }
  };
  if (MOD === "droit" || MOD === "inv") {
    var dl = null;
    var fill = function () {
      CORE.projectNames().then(function (list) {
        if (!dl) { dl = document.createElement("datalist"); dl.id = "core-projects"; document.body.appendChild(dl); }
        dl.innerHTML = list.map(function (n) { return '<option value="' + n.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;") + '">'; }).join("");
      });
    };
    var tag = function () {
      document.querySelectorAll('input[name="project"]:not([list]),input#asgproj:not([list]),input[data-core-project]:not([list])').forEach(function (i) { i.setAttribute("list", "core-projects"); });
    };
    var go = function () { fill(); setInterval(fill, 60000); new MutationObserver(tag).observe(document.body, { childList: true, subtree: true }); tag(); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(go, 1500); }); else setTimeout(go, 1500);
  }
})();
