/* ---- KOLABTOOLS : identification unique + charte Refraction ----
   Même fichier pour l'appli fusionnée (« suite ») et pour chaque outil vendu seul (« solo »).
   - Connexion par e-mail + mot de passe (aucune connexion Google), comptes créés sur invitation (code envoyé par e-mail).
   - Équipe : tous les outils. Clients : seulement les outils ouverts pour eux (DAM Studio, Droit à l'image).
   - Le nom de l'agence et l'adresse de l'appli sont réglés à la première connexion (vendable à d'autres agences).
   - Charte Refraction posée par défaut sur tous les outils (désactivable par appareil). */
(function () {
  "use strict";
  if (window.JP_AUTH) return;
  var me = document.currentScript;
  var MOD = (me && me.getAttribute("data-mod")) || (window.CORE_API && window.CORE_API.mod) || "hub";
  var SUITE = window.KOLAB_MODE !== "solo";
  var R = document.documentElement;
  var SESS_K = "jp-auth-sess", CHARTE_K = "jp-charte";
  var ALL = { hub: "Accueil", plan: "Planning", inv: "Inventaire", droit: "Droit à l'image", ia: "IA Studio", dam: "DAM Studio" };
  var FILES = { hub: "index.html", plan: "planning.html", inv: "inventaire.html", droit: "droit.html", ia: "studio.html", dam: "dam.html" };
  var MODS = {}; if (SUITE) MODS = ALL; else MODS[MOD] = ALL[MOD] || "Outil";
  var CLIENT_MODS = ["dam", "droit"].filter(function (m) { return m in MODS; });
  var CFG = { org: "", url: window.KOLAB_URL || "" };

  /* =========================================================
     1. Charte Refraction (base commune)
     ========================================================= */
  var fonts = document.createElement("link");
  fonts.rel = "stylesheet";
  fonts.href = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap";
  document.head.appendChild(fonts);

  var G = "rgba(255,255,255,.075)", ST = "rgba(255,255,255,.14)";
  var css = document.createElement("style");
  css.id = "jp-agence-css";
  css.textContent = [
    'html:root[data-da="dam"][data-da-sombre]{--da-titre:"Instrument Serif",Georgia,serif;--da-titre2:"Manrope",system-ui,sans-serif;--da-corps:"Manrope",system-ui,sans-serif;',
    '--da-card:' + G + ';--da-bd:' + ST + ';--da-band:rgba(255,255,255,.06);--da-band-t:#eef1f7;--da-on:#0b0d14;--da-rayon:20px;--da-rayon-btn:13px;',
    '--da-ombre:0 20px 60px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.16);',
    '--da-decor:radial-gradient(circle at 12% 12%,rgba(43,92,255,.42),transparent 38%),radial-gradient(circle at 92% 30%,rgba(164,60,255,.38),transparent 36%),radial-gradient(circle at 45% 105%,rgba(0,194,184,.34),transparent 40%),#07090f}',
    'html:root[data-da="dam"] :is(.card,.pcard,.stat,.tile,.item,.proj,dialog,.rail,.sheet,.box,.adm-sec,.sb-panel,.modal,.panel){-webkit-backdrop-filter:blur(22px) saturate(160%);backdrop-filter:blur(22px) saturate(160%)}',
    'html:root[data-da="dam"] :is(h1,.h1){font-style:italic;font-weight:400!important;text-transform:none!important;letter-spacing:-.01em}',
    'html:root[data-da="dam"] :is(input,select,textarea){border-radius:13px}',
    'html:root[data-da="dam"] ::selection{background:rgba(124,196,255,.35)}',
    /* verrou + écrans */
    'html.jp-lock body>*:not(#jp-auth){visibility:hidden!important}',
    'html.jp-lock,html.jp-lock body{overflow:hidden!important}',
    '#jp-auth,#jp-acc{font:14px/1.45 Manrope,system-ui,-apple-system,sans-serif;letter-spacing:.005em;color:#eef1f7}',
    '#jp-auth{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:20px;overflow-y:auto;background:#07090f;',
    'padding-top:max(20px,env(safe-area-inset-top));padding-bottom:max(20px,env(safe-area-inset-bottom))}',
    '#jp-auth *,#jp-acc *{box-sizing:border-box}',
    '#jp-auth .jb{position:fixed;inset:-10%;pointer-events:none;z-index:0}',
    '#jp-auth .jb i{position:absolute;border-radius:50%;filter:blur(70px);opacity:.55;animation:jpf 22s ease-in-out infinite alternate}',
    '#jp-auth .jb i:nth-child(1){width:46vw;height:46vw;left:5%;top:5%;background:#2b5cff}',
    '#jp-auth .jb i:nth-child(2){width:38vw;height:38vw;right:0;top:25%;background:#a43cff;animation-duration:28s}',
    '#jp-auth .jb i:nth-child(3){width:34vw;height:34vw;left:30%;bottom:-5%;background:#00c2b8;animation-duration:32s}',
    '@keyframes jpf{50%{transform:translate(6vw,-4vh) scale(1.1)}100%{transform:translate(-4vw,5vh) scale(.95)}}',
    '@media (prefers-reduced-motion:reduce){#jp-auth .jb i{animation:none}}',
    '.jp-box{position:relative;z-index:1;width:min(440px,100%);padding:30px;border-radius:24px;background:' + G + ';border:1px solid ' + ST + ';',
    '-webkit-backdrop-filter:blur(22px) saturate(160%);backdrop-filter:blur(22px) saturate(160%);box-shadow:0 20px 60px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.18)}',
    '.jp-brand{display:flex;align-items:center;gap:10px;margin-bottom:22px}',
    '.jp-logo{width:36px;height:36px;border-radius:11px;background:linear-gradient(135deg,#7cc4ff,#b28cff);display:grid;place-items:center;font-weight:800;color:#0b0d14;box-shadow:0 6px 20px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.6)}',
    '.jp-brand b{display:block;font-size:15px}.jp-brand small{color:rgba(238,241,247,.5);font-size:11.5px}',
    '#jp-auth h1,#jp-acc h2{font:400 40px/1.02 "Instrument Serif",Georgia,serif;margin:0 0 8px;letter-spacing:-.01em}#jp-auth h1 i,#jp-acc h2 i{color:#b9dcff}',
    '#jp-acc h2{font-size:32px}',
    '.jp-sub{color:rgba(238,241,247,.66);margin:0 0 18px}',
    '.jp-f{display:block;font-size:12px;font-weight:700;color:rgba(238,241,247,.66);margin:12px 0 6px}',
    '.jp-in{width:100%;padding:12px 14px;border-radius:13px;background:' + G + ';border:1px solid ' + ST + ';color:#eef1f7;font:inherit;outline:none}',
    'select.jp-in{background:#141824}',
    '.jp-in:focus{border-color:#7cc4ff;box-shadow:0 0 0 3px rgba(124,196,255,.2)}',
    '.jp-btn{display:flex;width:100%;justify-content:center;align-items:center;gap:8px;margin-top:12px;padding:13px 16px;border-radius:13px;border:1px solid ' + ST + ';background:rgba(255,255,255,.12);color:#eef1f7;font:700 13.5px Manrope,system-ui,sans-serif;cursor:pointer;text-decoration:none}',
    '.jp-btn.pri{background:linear-gradient(135deg,#7cc4ff,#b28cff);color:#0b0d14;border:0;box-shadow:0 8px 24px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.5);margin-top:18px}',
    '.jp-btn.ghost{background:transparent}.jp-btn.sm{display:inline-flex;width:auto;margin:0;padding:7px 11px;font-size:12px;border-radius:10px}',
    '.jp-btn:disabled{opacity:.55;cursor:wait}',
    '#jp-auth :focus-visible,#jp-acc :focus-visible,#jp-pill:focus-visible{outline:3px solid #7cc4ff;outline-offset:2px}',
    '.jp-err{margin-top:12px;padding:10px 12px;border-radius:12px;background:rgba(255,107,122,.14);border:1px solid rgba(255,107,122,.4);color:#ffd0d5;font-size:13px}',
    '.jp-ok{margin-top:12px;padding:10px 12px;border-radius:12px;background:rgba(79,220,155,.12);border:1px solid rgba(79,220,155,.4);color:#c9f7e0;font-size:13px}',
    '.jp-hint{font-size:12px;color:rgba(238,241,247,.5);margin:6px 0 0}',
    '.jp-row{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:13px;color:rgba(238,241,247,.66)}',
    '.jp-bar{height:5px;border-radius:5px;background:rgba(255,255,255,.1);margin-top:8px;overflow:hidden}.jp-bar i{display:block;height:100%;width:0;transition:width .2s}',
    '.jp-foot{margin-top:18px;font-size:12px;color:rgba(238,241,247,.42);text-align:center}',
    '#jp-auth a:not(.jp-btn),#jp-acc a:not(.jp-btn){color:#7cc4ff}',
    /* gestion des comptes */
    '#jp-acc{position:fixed;inset:0;z-index:2147483500;display:grid;place-items:center;padding:16px;background:rgba(4,6,12,.6);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}',
    '#jp-acc[hidden]{display:none}',
    '#jp-acc .jp-box{width:min(760px,100%);max-height:92dvh;overflow:auto;background:rgba(14,17,26,.92)}',
    '.jp-acc{padding:11px 2px;border-top:1px solid ' + ST + ';display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}',
    '.jp-acc b{font-size:14px}.jp-meta{color:rgba(238,241,247,.55);font-size:12px}',
    '.jp-tag{font-size:11px;font-weight:700;padding:3px 8px;border-radius:99px;border:1px solid ' + ST + ';margin-left:4px}',
    '.jp-tag.team{color:#7cc4ff}.jp-tag.client{color:#b28cff}.jp-tag.inv{color:#ffc35a}.jp-tag.rev{color:#ff6b7a}',
    '.jp-acts{display:flex;gap:6px;flex-wrap:wrap}',
    '.jp-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}@media (max-width:560px){.jp-grid{grid-template-columns:1fr}}',
    '.jp-mods{display:flex;gap:14px;flex-wrap:wrap;font-size:13px;margin-top:6px}.jp-mods label{display:flex;gap:6px;align-items:center}',
    'pre.jp-inv{white-space:pre-wrap;font:12.5px/1.5 Manrope,system-ui,sans-serif;background:rgba(0,0,0,.3);border:1px solid ' + ST + ';border-radius:12px;padding:12px;max-height:260px;overflow:auto}',
    '.jp-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}',
    /* pastille compte (outil vendu seul) */
    '#jp-pill{position:fixed;right:14px;bottom:max(84px,calc(env(safe-area-inset-bottom) + 70px));z-index:2147483000;display:flex;align-items:center;gap:8px;padding:6px 12px 6px 6px;border-radius:999px;cursor:pointer;',
    'border:1px solid ' + ST + ';background:rgba(14,17,26,.72);color:#eef1f7;font:700 12.5px Manrope,system-ui,sans-serif;-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);box-shadow:0 8px 24px rgba(0,0,0,.3)}',
    '#jp-pill i{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-style:normal;background:linear-gradient(135deg,#7cc4ff,#b28cff);color:#0b0d14;font-size:11px}',
    '#jp-menu{position:fixed;right:14px;bottom:calc(max(84px,calc(env(safe-area-inset-bottom) + 70px)) + 46px);z-index:2147483000;min-width:230px;padding:6px;border-radius:16px;border:1px solid ' + ST + ';background:rgba(14,17,26,.92);color:#eef1f7;font:500 13px Manrope,system-ui,sans-serif;-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);box-shadow:0 18px 48px rgba(0,0,0,.4)}',
    '#jp-menu[hidden]{display:none}#jp-menu .jp-meta{padding:8px 10px}',
    '#jp-menu button{display:block;width:100%;text-align:left;padding:10px;border-radius:10px;border:0;background:none;color:inherit;font:inherit;cursor:pointer}#jp-menu button:hover{background:rgba(255,255,255,.08)}',
    '@media print{#jp-pill,#jp-menu{display:none}}',
    /* menu « Outils » de la suite */
    '#core-nav .jp-me{border-top:1px solid rgba(128,128,128,.25);margin-top:4px;padding:10px 12px 6px;font:500 12px/1.35 Manrope,system-ui,sans-serif;writing-mode:horizontal-tb}',
    '#core-nav .jp-me button{display:block;width:100%;text-align:left;cursor:pointer;border:0;background:none;font:inherit;color:inherit;padding:6px 0}'
  ].join("\n");
  document.head.appendChild(css);

  var charteOn = true;
  try { charteOn = localStorage.getItem(CHARTE_K) !== "off"; } catch (e) {}
  function baseDam() {
    if (!charteOn || MOD === "hub" || MOD === "dam") return;
    if (R.hasAttribute("data-da")) return;
    R.setAttribute("data-da", "dam");
    R.setAttribute("data-da-sombre", "");
    R.setAttribute("data-da-rond", "");
    R.style.setProperty("--da-fond", "#07090f");
    R.style.setProperty("--da-texte", "#eef1f7");
    R.style.setProperty("--da-accent", "#7cc4ff");
    R.style.setProperty("--da-on", "#0b0d14");
  }
  baseDam();
  new MutationObserver(baseDam).observe(R, { attributes: true, attributeFilter: ["data-da"] });

  /* =========================================================
     2. Outils
     ========================================================= */
  var enc = new TextEncoder();
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }
  function rand(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return hex(a); }
  async function pbkdf2(pw, salt, iter) {
    var k = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
    return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: iter }, k, 256));
  }
  async function sha(s) { return hex(await crypto.subtle.digest("SHA-256", enc.encode(s))); }
  function code8() {
    var A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", a = new Uint8Array(8), s = ""; crypto.getRandomValues(a);
    for (var i = 0; i < 8; i++) { s += A[a[i] % A.length]; if (i === 3) s += "-"; }
    return s;
  }
  function pwScore(p) { var s = 0; if (p.length >= 8) s++; if (p.length >= 12) s++; if (/[A-Z]/.test(p) && /[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++; return Math.min(4, s); }
  var normMail = function (e) { return String(e || "").trim().toLowerCase(); };
  var keyOf = function (e) { return normMail(e).replace(/[^a-z0-9]/g, "_"); };
  var domainOf = function (e) { return normMail(e).split("@")[1] || ""; };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var org = function () { return CFG.org || "Kolab Tools"; };
  var appUrl = function () { return CFG.url || window.KOLAB_URL || String(location.href).split("#")[0]; };
  var nowIso = function () { return new Date().toISOString(); };

  /* =========================================================
     3. Données (m/auth/... dans la base de l'appli)
     ========================================================= */
  var dbP = null;
  function db() { if (!dbP) dbP = (window.claude && window.claude.use) ? window.claude.use("db").catch(function () { return null; }) : Promise.resolve(null); return dbP; }
  var U = "m/auth/users/", SS = "m/auth/sess/", CF = "m/auth/cfg/main";
  async function getUser(email) { var d = await db(); if (!d) return null; var s = await d.doc(U + keyOf(email)).get(); return s.exists ? s.data() : null; }
  async function putUser(u) { var d = await db(); await d.doc(U + keyOf(u.email)).set(u); }
  async function listUsers() { var d = await db(); if (!d) return []; var q = await d.collection("m/auth/users").get(); return q.docs.map(function (x) { return x.data(); }).filter(function (u) { return u && u.email; }); }
  async function loadCfg() { try { var d = await db(); var s = d && await d.doc(CF).get(); if (s && s.exists) Object.assign(CFG, s.data() || {}); } catch (e) {} }
  function pub(u) { return u ? { email: u.email, name: u.name || u.email.split("@")[0], kind: u.kind, role: u.role, projects: u.projects || [], mods: u.mods || [], status: u.status } : null; }

  async function openSession(u, long) {
    var d = await db(), tok = rand(24);
    var exp = new Date(Date.now() + (long ? 30 : 1) * 864e5).toISOString();
    await d.doc(SS + tok).set({ key: keyOf(u.email), exp: exp, created: nowIso() });
    var v = JSON.stringify({ tok: tok, exp: exp });
    try { localStorage.setItem(SESS_K, v); } catch (e) { try { sessionStorage.setItem(SESS_K, v); } catch (er) {} }
  }
  function readTok() {
    var raw = null;
    try { raw = localStorage.getItem(SESS_K) || sessionStorage.getItem(SESS_K); } catch (e) {}
    try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  async function resume() {
    var t = readTok(); if (!t || !t.tok) return null;
    var d = await db(); if (!d) return null;
    var s = await d.doc(SS + t.tok).get(); if (!s.exists) return null;
    var x = s.data() || {}; if (!x.exp || x.exp < nowIso()) return null;
    var u = await d.doc(U + x.key).get(); if (!u.exists) return null;
    u = u.data(); return u && u.status === "actif" ? u : null;
  }
  async function logout() {
    var t = readTok();
    try { localStorage.removeItem(SESS_K); sessionStorage.removeItem(SESS_K); } catch (e) {}
    try { if (t && t.tok) { var d = await db(); if (d) await d.doc(SS + t.tok).delete(); } } catch (e) {}
    location.href = SUITE ? "index.html" : String(location.href).split("#")[0];
  }

  /* =========================================================
     4. API publique
     ========================================================= */
  var current = null, readyFns = [], isReady = false;
  function needAdmin() { if (!API.isAdmin()) throw new Error("Réservé aux administrateurs."); }
  var API = {
    get user() { return pub(current); },
    get org() { return org(); },
    suite: SUITE, mod: MOD, modNames: MODS, clientMods: CLIENT_MODS,
    isAdmin: function () { return !!(current && current.kind === "team" && current.role === "admin"); },
    isTeam: function () { return !!(current && current.kind === "team"); },
    onReady: function (fn) { if (isReady) { try { fn(pub(current)); } catch (e) {} } else readyFns.push(fn); },
    logout: logout,
    list: async function () {
      if (!API.isAdmin()) return [];
      return (await listUsers()).map(function (u) { var p = pub(u); p.codeExp = u.codeExp || ""; p.hasPw = !!u.hash; p.last = u.last || ""; return p; });
    },
    /* Crée ou réinvite un compte. Renvoie le code d'invitation en clair (montré une seule fois). */
    invite: async function (o) {
      needAdmin();
      var email = normMail(o.email); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Adresse e-mail invalide.");
      var old = await getUser(email) || {};
      var team = (o.kind || old.kind) === "team", code = code8(), salt = rand(8);
      var u = Object.assign({}, old, {
        email: email, name: String(o.name || old.name || "").trim() || email.split("@")[0],
        kind: team ? "team" : "client", role: team ? (o.role === "admin" ? "admin" : "membre") : "client",
        projects: team ? [] : (o.projects || old.projects || []),
        mods: team ? Object.keys(ALL) : ((o.mods && o.mods.length) ? o.mods : (old.mods || CLIENT_MODS.slice(0, 1))),
        status: old.status === "actif" && !o.reset ? "actif" : "invité",
        codeSalt: salt, codeHash: await sha(salt + code.replace("-", "")), codeExp: new Date(Date.now() + 14 * 864e5).toISOString(),
        invited: nowIso(), invitedBy: current.email
      });
      if (o.reset) { delete u.hash; delete u.salt; u.status = "invité"; }
      await putUser(u);
      return { code: code, user: pub(u), message: inviteText(u, code) };
    },
    update: async function (email, patch) {
      needAdmin();
      var u = await getUser(email); if (!u) throw new Error("Compte introuvable.");
      if (normMail(email) === current.email && (patch.role && patch.role !== "admin" || patch.status === "révoqué")) throw new Error("Vous ne pouvez pas retirer vos propres droits.");
      ["name", "role", "projects", "mods", "status"].forEach(function (k) { if (k in patch) u[k] = patch[k]; });
      if (u.kind === "client") u.role = "client";
      await putUser(u); return pub(u);
    },
    remove: async function (email) {
      needAdmin();
      if (normMail(email) === current.email) throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
      var d = await db(); await d.doc(U + keyOf(email)).delete();
    },
    setOrg: async function (o) { needAdmin(); var d = await db(); Object.assign(CFG, o); await d.doc(CF).set({ org: CFG.org || "", url: CFG.url || "", domain: CFG.domain || "" }); },
    sendMail: async function (to, subject, body) {
      var m = window.claude && window.claude.use ? await window.claude.use("mcp").catch(function () { return null; }) : null;
      if (!m) throw new Error("Envoi par e-mail indisponible ici.");
      await m.callTool("Gmail", "send_message", { to: [to], subject: subject, body: body }, { cache: false });
    },
    manage: function () { openManager(); }
  };
  function inviteText(u, code) {
    var who = u.kind === "team" ? "l'équipe " + org() : "l'espace client " + org();
    var proj = u.projects && u.projects.length ? "\nProjet(s) : " + u.projects.join(", ") : "";
    var tools = u.kind === "team" ? "" : "\nOutil(s) : " + (u.mods || []).filter(function (m) { return m in MODS; }).map(function (m) { return ALL[m]; }).join(", ");
    return "Bonjour " + (u.name || "") + ",\n\nVous êtes invité(e) à rejoindre " + who + "." + proj + tools +
      "\n\n1. Ouvrez : " + appUrl() + "\n2. Choisissez « J'ai reçu une invitation »\n3. Saisissez votre e-mail (" + u.email + ") et ce code : " + code +
      "\n4. Créez votre mot de passe.\n\nLe code est valable 14 jours et ne sert qu'une fois.\n\n" + org();
  }
  window.JP_AUTH = API;

  /* =========================================================
     5. Écran de connexion
     ========================================================= */
  R.classList.add("jp-lock");
  var V = { step: "loading", email: "", msg: "", ok: "" };
  var box = null;
  function mount() { if (!box) { box = document.createElement("div"); box.id = "jp-auth"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Connexion"); document.body.appendChild(box); } return box; }
  function brand(sub) { var o = org(); return '<div class="jp-brand"><div class="jp-logo">' + esc(o.charAt(0).toUpperCase()) + '</div><div><b>' + esc(o) + "</b><small>" + esc(sub) + "</small></div></div>"; }
  function msgs() { return (V.msg ? '<div class="jp-err" role="alert">' + esc(V.msg) + "</div>" : "") + (V.ok ? '<div class="jp-ok" role="status">' + esc(V.ok) + "</div>" : ""); }
  function pwField(id, label, ph) { return '<label class="jp-f" for="' + id + '">' + label + '</label><input class="jp-in" id="' + id + '" type="password" autocomplete="new-password" placeholder="' + ph + '" required>'; }
  var strength = '<div class="jp-bar"><i id="jbar"></i></div><p class="jp-hint" id="jhint">12 caractères, une majuscule, un chiffre, un symbole.</p>';
  var title = SUITE ? "Outils de l'agence" : (MODS[MOD] || "Outil");
  function draw() {
    var b = mount(), h = "";
    if (V.step === "loading") h = brand(title) + '<h1>Un <i>instant…</i></h1><p class="jp-sub">Vérification de votre accès.</p>';
    else if (V.step === "noclaude") h = brand(title) + '<h1>Accès <i>indisponible</i></h1><p class="jp-sub">Ouvrez cette page depuis Claude pour vous connecter.</p>';
    else if (V.step === "setup") h = brand("Première connexion") + '<h1>Créez le compte <i>administrateur.</i></h1><p class="jp-sub">Aucun compte n\'existe encore. Ce premier compte gère ensuite les invitations de l\'équipe et des clients.</p>' +
      '<form data-f="setup"><label class="jp-f" for="jo">Nom de l\'agence</label><input class="jp-in" id="jo" autocomplete="organization" placeholder="M la créative" required>' +
      '<label class="jp-f" for="jn">Votre nom</label><input class="jp-in" id="jn" autocomplete="name" placeholder="Prénom Nom" required>' +
      '<label class="jp-f" for="je">E-mail</label><input class="jp-in" id="je" type="email" autocomplete="email" placeholder="vous@agence.fr" required>' +
      pwField("jp", "Mot de passe", "12 caractères minimum") + strength + pwField("jp2", "Confirmer", "••••••••") +
      '<button class="jp-btn pri">Créer le compte</button></form>' + msgs();
    else if (V.step === "nosetup") h = brand(title) + '<h1>Pas encore <i>ouvert.</i></h1><p class="jp-sub">Aucun compte n\'a été créé. Le propriétaire de l\'appli doit d\'abord créer le compte administrateur.</p>';
    else if (V.step === "login") h = brand(title) + '<h1>Vos outils,<br><i>en un regard.</i></h1><p class="jp-sub">Équipe et clients : connectez-vous avec votre e-mail.</p>' +
      '<form data-f="login"><label class="jp-f" for="je">E-mail</label><input class="jp-in" id="je" type="email" autocomplete="username" value="' + esc(V.email) + '" placeholder="vous@entreprise.com" required>' +
      '<label class="jp-f" for="jp">Mot de passe</label><input class="jp-in" id="jp" type="password" autocomplete="current-password" placeholder="••••••••" required>' +
      '<label class="jp-row"><input type="checkbox" id="jlong" checked> Rester connecté 30 jours sur cet appareil</label>' +
      '<button class="jp-btn pri">Se connecter</button></form>' +
      '<button class="jp-btn ghost" type="button" data-a="invite">J\'ai reçu une invitation</button>' +
      '<button class="jp-btn ghost" type="button" data-a="forgot">Mot de passe oublié</button>' + msgs() +
      '<p class="jp-foot">Accès sur invitation uniquement. Aucune connexion Google.</p>';
    else if (V.step === "invite") h = brand("Invitation") + '<h1>Bienvenue,<br><i>créez votre accès.</i></h1><p class="jp-sub">Saisissez l\'e-mail invité et le code reçu, puis choisissez votre mot de passe.</p>' +
      '<form data-f="invite"><label class="jp-f" for="je">E-mail</label><input class="jp-in" id="je" type="email" autocomplete="username" value="' + esc(V.email) + '" required>' +
      '<label class="jp-f" for="jc">Code d\'invitation</label><input class="jp-in" id="jc" autocomplete="one-time-code" placeholder="ABCD-1234" required style="letter-spacing:.15em;text-transform:uppercase">' +
      pwField("jp", "Nouveau mot de passe", "12 caractères minimum") + strength + pwField("jp2", "Confirmer", "••••••••") +
      '<button class="jp-btn pri">Créer mon accès</button></form><button class="jp-btn ghost" type="button" data-a="back">Retour</button>' + msgs();
    else if (V.step === "forgot") h = brand("Mot de passe oublié") + '<h1>Nouveau <i>code.</i></h1><p class="jp-sub">Demandez à ' + esc(org()) + ' de vous renvoyer une invitation : vous recevrez un nouveau code par e-mail pour choisir un autre mot de passe.</p>' +
      '<button class="jp-btn" type="button" data-a="invite">J\'ai reçu un nouveau code</button><button class="jp-btn ghost" type="button" data-a="back">Retour</button>';
    else if (V.step === "denied") h = brand(MODS[MOD] || "Outils") + '<h1>Réservé à <i>l\'équipe.</i></h1><p class="jp-sub">« ' + esc(ALL[MOD] || "Cet outil") + ' » n\'est pas ouvert à votre compte (' + esc(current && current.email) + ').</p>' +
      (SUITE ? allowed().map(function (m) { return '<a class="jp-btn" href="' + FILES[m] + '">Ouvrir ' + esc(ALL[m]) + "</a>"; }).join("") : "") + '<button class="jp-btn ghost" type="button" data-a="logout">Se déconnecter</button>';
    b.innerHTML = '<div class="jb" aria-hidden="true"><i></i><i></i><i></i></div><div class="jp-box">' + h + "</div>";
    var f = b.querySelector("input:not([value]),input[value='']") || b.querySelector("input");
    if (f && V.step !== "loading") setTimeout(function () { try { f.focus(); } catch (e) {} }, 30);
    meter(b);
  }
  function meter(b) {
    var p = b.querySelector("#jp"), bar = b.querySelector("#jbar"); if (!p || !bar) return;
    p.addEventListener("input", function () {
      var s = pwScore(p.value);
      bar.style.cssText = "width:" + (s * 25) + "%;background:" + ["#ff6b7a", "#ff6b7a", "#ffc35a", "#7cc4ff", "#4fdc9b"][s];
      b.querySelector("#jhint").textContent = ["Trop court", "Faible", "Moyen", "Bon", "Excellent"][s] + " — 12 caractères, une majuscule, un chiffre, un symbole.";
    });
  }
  function allowed() {
    if (!current) return [];
    if (current.kind === "team") return Object.keys(MODS);
    return (current.mods || []).filter(function (m) { return CLIENT_MODS.indexOf(m) >= 0; });
  }
  function go(step, extra) { V.step = step; V.msg = ""; V.ok = ""; if (extra) Object.assign(V, extra); draw(); }
  function fail(t) { V.msg = t; V.ok = ""; draw(); }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("#jp-auth [data-a]"); if (!a) return;
    var k = a.getAttribute("data-a"), em = box && box.querySelector("#je") ? box.querySelector("#je").value : V.email;
    if (k === "invite") go("invite", { email: em }); else if (k === "forgot") go("forgot", { email: em }); else if (k === "back") go("login", { email: em }); else if (k === "logout") logout();
  });
  document.addEventListener("submit", async function (e) {
    var f = e.target.closest && e.target.closest("#jp-auth form"); if (!f) return;
    e.preventDefault();
    var vals = {}; ["#je", "#jp", "#jp2", "#jn", "#jc", "#jo"].forEach(function (id) { var x = box.querySelector(id); vals[id] = x ? x.value : ""; });
    var longS = !!(box.querySelector("#jlong") || {}).checked;
    var val = function (id) { return vals[id] || ""; };
    var email = normMail(val("#je")), pw = val("#jp"), kind = f.getAttribute("data-f");
    var sb = f.querySelector(".jp-btn.pri"); if (sb) { if (sb.disabled) return; sb.disabled = true; sb.textContent = "Un instant…"; }
    V.email = email; V.msg = "";
    try {
      if (kind === "login") {
        var u = await getUser(email);
        if (!u || !u.hash) return fail(u && u.status === "invité" ? "Votre accès n'est pas encore activé : utilisez « J'ai reçu une invitation »." : "E-mail ou mot de passe incorrect.");
        if (u.status === "révoqué") return fail("Cet accès a été suspendu. Contactez " + org() + ".");
        if (u.lockUntil && u.lockUntil > nowIso()) return fail("Trop d'essais. Réessayez dans quelques minutes.");
        if ((await pbkdf2(pw, u.salt, u.iter || 150000)) !== u.hash) {
          u.fails = (u.fails || 0) + 1; if (u.fails >= 5) { u.lockUntil = new Date(Date.now() + 10 * 6e4).toISOString(); u.fails = 0; }
          try { await putUser(u); } catch (er) {}
          return fail("E-mail ou mot de passe incorrect.");
        }
        u.fails = 0; delete u.lockUntil; u.last = nowIso(); try { await putUser(u); } catch (er) {}
        await openSession(u, longS);
        return enter(u);
      }
      if (pwScore(pw) < 3) return fail("Mot de passe trop faible : 12 caractères avec majuscule, chiffre et symbole.");
      if (pw !== val("#jp2")) return fail("Les deux mots de passe ne correspondent pas.");
      if (kind === "setup") {
        if ((await listUsers()).length) return go("login");
        var salt = rand(16), nu = { email: email, name: val("#jn").trim() || email.split("@")[0], kind: "team", role: "admin", mods: Object.keys(ALL), projects: [], status: "actif",
          salt: salt, iter: 150000, hash: await pbkdf2(pw, salt, 150000), created: nowIso(), last: nowIso() };
        await putUser(nu);
        CFG.org = val("#jo").trim(); CFG.domain = domainOf(email);
        var d = await db(); await d.doc(CF).set({ org: CFG.org, url: CFG.url || "", domain: CFG.domain });
        await openSession(nu, true); return enter(nu);
      }
      if (kind === "invite") {
        var iu = await getUser(email), code = val("#jc").toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (!iu || !iu.codeHash) return fail("Aucune invitation en attente pour cette adresse.");
        if (iu.status === "révoqué") return fail("Cet accès a été suspendu. Contactez " + org() + ".");
        if (!iu.codeExp || iu.codeExp < nowIso()) return fail("Ce code a expiré : demandez une nouvelle invitation.");
        if ((await sha(iu.codeSalt + code)) !== iu.codeHash) return fail("Code d'invitation incorrect.");
        var s2 = rand(16);
        iu.salt = s2; iu.iter = 150000; iu.hash = await pbkdf2(pw, s2, 150000); iu.status = "actif"; iu.last = nowIso(); iu.fails = 0;
        delete iu.codeHash; delete iu.codeSalt; delete iu.codeExp;
        await putUser(iu); await openSession(iu, true); return enter(iu);
      }
    } catch (er) { fail("Connexion impossible pour le moment. Vérifiez votre réseau et réessayez."); }
  });

  function enter(u) {
    current = u;
    if (current.kind !== "team" && allowed().indexOf(MOD) < 0) {
      if (SUITE && MOD === "hub" && allowed().length) { location.href = FILES[allowed()[0]]; return; }
      go("denied"); return;
    }
    R.classList.remove("jp-lock");
    if (box) { box.remove(); box = null; }
    isReady = true;
    readyFns.splice(0).forEach(function (fn) { try { fn(pub(current)); } catch (e) {} });
    if (SUITE) navUser(); else pill();
    try { window.dispatchEvent(new CustomEvent("jp-auth", { detail: pub(current) })); } catch (e) {}
  }
  function navUser() {
    var put = function () {
      var m = document.querySelector("#core-nav .cn-m"); if (!m || m.querySelector(".jp-me")) return !!m;
      if (current.kind !== "team") m.querySelectorAll("a").forEach(function (a) { var mod = Object.keys(FILES).filter(function (k) { return FILES[k] === a.getAttribute("href"); })[0]; if (mod && allowed().indexOf(mod) < 0) a.remove(); });
      var d = document.createElement("div"); d.className = "jp-me";
      d.innerHTML = "<div><b>" + esc(current.name || current.email) + "</b></div><div style='opacity:.7'>" + esc(current.email) + "</div>" +
        (API.isAdmin() ? "<button type='button' data-j='acc'>👥 Comptes et accès</button>" : "") + "<button type='button' data-j='out'>↩ Se déconnecter</button>";
      d.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; if (b.dataset.j === "out") logout(); else openManager(); });
      m.appendChild(d); return true;
    };
    if (!put()) { var n = 0, t = setInterval(function () { if (put() || ++n > 40) clearInterval(t); }, 250); }
  }
  /* pastille compte pour un outil vendu seul */
  function pill() {
    var p = document.createElement("button"); p.id = "jp-pill"; p.type = "button"; p.setAttribute("aria-haspopup", "true");
    p.innerHTML = "<i>" + esc((current.name || current.email).slice(0, 2).toUpperCase()) + "</i>" + esc((current.name || "").split(" ")[0] || "Compte");
    var m = document.createElement("div"); m.id = "jp-menu"; m.hidden = true;
    m.innerHTML = '<div class="jp-meta"><b style="color:#eef1f7">' + esc(current.name) + "</b><br>" + esc(current.email) + "<br>" + esc(org()) + "</div>" +
      (API.isAdmin() ? '<button type="button" data-j="acc">👥 Comptes et accès</button>' : "") +
      '<button type="button" data-j="charte">◐ Charte Refraction : ' + (charteOn ? "activée" : "désactivée") + '</button><button type="button" data-j="out">↩ Se déconnecter</button>';
    p.addEventListener("click", function (e) { e.stopPropagation(); m.hidden = !m.hidden; });
    m.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return; m.hidden = true;
      if (b.dataset.j === "out") logout(); else if (b.dataset.j === "acc") openManager();
      else { try { localStorage.setItem(CHARTE_K, charteOn ? "off" : "on"); } catch (er) {} location.reload(); }
    });
    document.addEventListener("click", function (e) { if (!m.contains(e.target)) m.hidden = true; });
    document.body.append(p, m);
  }

  /* =========================================================
     6. Gestion des comptes (même écran dans la suite et dans chaque outil)
     ========================================================= */
  var mgr = null, ACC = [], editing = null, lastInv = null, mview = "list";
  function openManager() {
    if (!API.isAdmin()) return;
    if (!mgr) {
      mgr = document.createElement("div"); mgr.id = "jp-acc"; mgr.setAttribute("role", "dialog"); mgr.setAttribute("aria-modal", "true"); mgr.setAttribute("aria-label", "Comptes et accès");
      document.body.appendChild(mgr);
      mgr.addEventListener("click", onMgrClick);
      mgr.addEventListener("submit", onMgrSubmit);
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && mgr && !mgr.hidden) mgr.hidden = true; });
    }
    mgr.hidden = false; mview = "list"; refresh();
  }
  async function refresh() { mgrDraw('<p class="jp-sub">Chargement…</p>'); try { ACC = await API.list(); } catch (e) { ACC = []; } mview = "list"; mgrDraw(); }
  var KIND = { team: "Équipe", client: "Client" };
  function mgrDraw(inner, note) {
    var h = '<div class="jp-box"><div class="jp-head"><div><h2>Comptes <i>et accès</i></h2><p class="jp-sub">' + esc(org()) + " · une seule connexion pour " + (SUITE ? "tous les outils" : "« " + esc(ALL[MOD]) + " »") + '.</p></div><button class="jp-btn sm" type="button" data-m="close" aria-label="Fermer">✕</button></div>';
    if (inner) h += inner;
    else if (mview === "list") {
      var now = nowIso();
      h += '<div class="jp-acts" style="margin-bottom:12px"><button class="jp-btn sm pri" style="margin:0" type="button" data-m="new" data-k="team">+ Membre de l\'équipe</button>' +
        (CLIENT_MODS.length ? '<button class="jp-btn sm" type="button" data-m="new" data-k="client">+ Client</button>' : "") +
        '<button class="jp-btn sm" type="button" data-m="org">Nom de l\'agence et adresse</button></div>';
      h += ACC.slice().sort(function (a, b) { return a.kind === b.kind ? a.email.localeCompare(b.email) : a.kind === "team" ? -1 : 1; }).map(function (a) {
        var st = a.status === "actif" ? "" : a.status === "révoqué" ? '<span class="jp-tag rev">Suspendu</span>' : '<span class="jp-tag inv">' + (a.codeExp && a.codeExp < now ? "Invitation expirée" : "Invité") + "</span>";
        var what = a.kind === "team" ? (a.role === "admin" ? "Administrateur" : "Membre") : [(a.mods || []).filter(function (m) { return m in MODS; }).map(function (m) { return ALL[m]; }).join(", "), (a.projects || []).join(", ")].filter(Boolean).join(" · ");
        var self = a.email === current.email, e = esc(a.email);
        return '<div class="jp-acc"><div><b>' + esc(a.name) + '</b><span class="jp-tag ' + a.kind + '">' + (KIND[a.kind] || "") + "</span>" + st + '<div class="jp-meta">' + e + (what ? " · " + esc(what) : "") + "</div></div>" +
          '<div class="jp-acts">' + (self ? '<span class="jp-meta">Vous</span>' :
          '<button class="jp-btn sm" type="button" data-m="edit" data-e="' + e + '">Modifier</button>' +
          '<button class="jp-btn sm" type="button" data-m="code" data-e="' + e + '">' + (a.status === "actif" ? "Nouveau mot de passe" : "Renvoyer un code") + "</button>" +
          '<button class="jp-btn sm" type="button" data-m="' + (a.status === "révoqué" ? "on" : "off") + '" data-e="' + e + '">' + (a.status === "révoqué" ? "Réactiver" : "Suspendre") + "</button>" +
          '<button class="jp-btn sm" type="button" data-m="del" data-e="' + e + '">Supprimer</button>') + "</div></div>";
      }).join("") || '<p class="jp-sub">Aucun compte.</p>';
      if (note) h += '<div class="jp-err" role="alert">' + esc(note) + "</div>";
    } else if (mview === "form") {
      var a = editing.acc, k = editing.kind, dr = editing.draft || {};
      var fv = function (key, def) { return esc(key in dr ? dr[key] : def); };
      h += '<form data-m="form"><h3 style="margin:0 0 6px">' + (a ? "Modifier l'accès" : k === "team" ? "Inviter un membre de l'équipe" : "Inviter un client") + "</h3>" +
        '<div class="jp-grid"><div><label class="jp-f" for="ae">E-mail</label><input class="jp-in" id="ae" type="email" required ' + (a ? "readonly" : "") + ' value="' + fv("email", a ? a.email : "") + '" placeholder="' + (k === "team" ? "prenom@" + esc(CFG.domain || "agence.fr") : "contact@client.com") + '"></div>' +
        '<div><label class="jp-f" for="an">Nom</label><input class="jp-in" id="an" value="' + fv("name", a ? a.name : "") + '" placeholder="Prénom Nom"></div></div>' +
        (k === "team" ? '<label class="jp-f" for="ar">Rôle</label><select class="jp-in" id="ar"><option value="membre">Membre</option><option value="admin"' + (a && a.role === "admin" ? " selected" : "") + ">Administrateur</option></select>"
          : '<label class="jp-f" for="ap">Projets (séparés par des virgules)</label><input class="jp-in" id="ap" list="jp-pj" value="' + fv("projects", a ? (a.projects || []).join(", ") : "") + '" placeholder="Opération Solaire, Séminaire Marbella"><datalist id="jp-pj"></datalist>' +
            (CLIENT_MODS.length > 1 ? '<div class="jp-f">Outils ouverts au client</div><div class="jp-mods">' + CLIENT_MODS.map(function (m) { return '<label><input type="checkbox" data-mod="' + m + '"' + (!a ? (m === CLIENT_MODS[0] ? " checked" : "") : ((a.mods || []).indexOf(m) >= 0 ? " checked" : "")) + "> " + esc(ALL[m]) + "</label>"; }).join("") + "</div>" : "")) +
        (note ? '<div class="jp-err" role="alert">' + esc(note) + "</div>" : "") +
        '<div class="jp-acts" style="justify-content:flex-end;margin-top:16px"><button class="jp-btn sm" type="button" data-m="back">Annuler</button><button class="jp-btn sm pri" style="margin:0">' + (a ? "Enregistrer" : "Créer l'invitation") + "</button></div></form>";
    } else if (mview === "org") {
      h += '<form data-m="orgf"><label class="jp-f" for="oo">Nom de l\'agence (affiché sur l\'écran de connexion et dans les invitations)</label><input class="jp-in" id="oo" value="' + esc(CFG.org) + '" required>' +
        '<label class="jp-f" for="ou">Adresse de l\'appli (lien envoyé dans les invitations)</label><input class="jp-in" id="ou" value="' + esc(CFG.url || appUrl()) + '" placeholder="https://…">' +
        (note ? '<div class="jp-err" role="alert">' + esc(note) + "</div>" : "") +
        '<div class="jp-acts" style="justify-content:flex-end;margin-top:16px"><button class="jp-btn sm" type="button" data-m="back">Annuler</button><button class="jp-btn sm pri" style="margin:0">Enregistrer</button></div></form>';
    } else if (mview === "sent") {
      h += '<h3 style="margin:0 0 6px">Invitation prête</h3><p class="jp-sub">Le code ne s\'affiche qu\'une fois. Envoyez ce message à ' + esc(lastInv.user.email) + ".</p>" +
        '<pre class="jp-inv">' + esc(lastInv.message) + '</pre><p class="jp-meta" id="jp-sm" role="status" style="margin:8px 0"></p>' +
        '<div class="jp-acts" style="justify-content:flex-end"><button class="jp-btn sm" type="button" data-m="copy">Copier le message</button><button class="jp-btn sm" type="button" data-m="mail">Envoyer par e-mail</button><button class="jp-btn sm pri" style="margin:0" type="button" data-m="back">Terminé</button></div>';
    }
    mgr.innerHTML = h + "</div>";
    if (mview === "form" && editing.kind === "client" && window.CORE_API && CORE_API.projectNames) CORE_API.projectNames().then(function (l) { var dl = mgr.querySelector("#jp-pj"); if (dl) dl.innerHTML = l.map(function (n) { return '<option value="' + esc(n) + '">'; }).join(""); }).catch(function () {});
    var first = mgr.querySelector("input:not([readonly]),button"); if (first) setTimeout(function () { try { first.focus(); } catch (e) {} }, 20);
  }
  async function onMgrClick(e) {
    if (e.target === mgr) { mgr.hidden = true; return; }
    var b = e.target.closest("[data-m]"); if (!b || b.tagName === "FORM") return;
    var k = b.dataset.m, acc = ACC.filter(function (a) { return a.email === b.dataset.e; })[0];
    try {
      if (k === "close") { mgr.hidden = true; return; }
      if (k === "back") { mview = "list"; ACC = await API.list(); return mgrDraw(); }
      if (k === "new") { editing = { kind: b.dataset.k, acc: null, draft: {} }; mview = "form"; return mgrDraw(); }
      if (k === "edit") { editing = { kind: acc.kind, acc: acc, draft: {} }; mview = "form"; return mgrDraw(); }
      if (k === "org") { mview = "org"; return mgrDraw(); }
      if (k === "code") { lastInv = await API.invite({ email: acc.email, kind: acc.kind, name: acc.name, role: acc.role, projects: acc.projects, mods: acc.mods, reset: acc.status === "actif" }); mview = "sent"; return mgrDraw(); }
      if (k === "off") await API.update(acc.email, { status: "révoqué" });
      if (k === "on") await API.update(acc.email, { status: acc.hasPw ? "actif" : "invité" });
      if (k === "del") { if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "Confirmer ?"; setTimeout(function () { b.dataset.sure = ""; b.textContent = "Supprimer"; }, 4000); return; } await API.remove(acc.email); }
      if (k === "copy") { try { await navigator.clipboard.writeText(lastInv.message); mgr.querySelector("#jp-sm").textContent = "Message copié."; } catch (er) { mgr.querySelector("#jp-sm").textContent = "Sélectionnez le texte ci-dessus pour le copier."; } return; }
      if (k === "mail") {
        var sm = mgr.querySelector("#jp-sm"); sm.textContent = "Envoi…";
        try { await API.sendMail(lastInv.user.email, "Votre accès aux outils " + org(), lastInv.message); sm.textContent = "E-mail envoyé à " + lastInv.user.email + " depuis votre messagerie."; }
        catch (er) { sm.textContent = "Envoi impossible ici : copiez le message et envoyez-le vous-même."; }
        return;
      }
      if (["off", "on", "del"].indexOf(k) >= 0) { ACC = await API.list(); mgrDraw(); }
    } catch (er) { mgrDraw(null, er.message || "Action impossible."); }
  }
  async function onMgrSubmit(e) {
    e.preventDefault(); var f = e.target, q = function (s) { var x = mgr.querySelector(s); return x ? x.value : ""; };
    try {
      if (f.dataset.m === "orgf") { await API.setOrg({ org: q("#oo").trim(), url: q("#ou").trim() }); mview = "list"; return mgrDraw(); }
      var kind = editing.kind, email = normMail(q("#ae")), name = q("#an").trim();
      var mods = CLIENT_MODS.length > 1 ? [].map.call(mgr.querySelectorAll("[data-mod]:checked"), function (x) { return x.dataset.mod; }) : CLIENT_MODS.slice();
      if (kind === "client" && !mods.length) return mgrDraw(null, "Ouvrez au moins un outil au client.");
      editing.draft = { email: q("#ae"), name: q("#an"), projects: q("#ap") };
      var projects = q("#ap").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      if (editing.acc) { await API.update(email, kind === "team" ? { name: name, role: q("#ar") } : { name: name, projects: projects, mods: mods }); mview = "list"; ACC = await API.list(); return mgrDraw(); }
      if ((await getUser(email))) { var ex = await getUser(email); if (ex.kind !== kind) return mgrDraw(null, "Cette adresse a déjà un compte " + (KIND[ex.kind] || "").toLowerCase() + "."); }
      lastInv = await API.invite({ email: email, kind: kind, name: name, role: q("#ar"), projects: projects, mods: mods });
      mview = "sent"; mgrDraw();
    } catch (er) { mgrDraw(null, er.message || "Enregistrement impossible."); }
  }

  /* =========================================================
     7. Démarrage
     ========================================================= */
  async function boot() {
    draw();
    if (!(window.claude && typeof window.claude.use === "function")) { setTimeout(function () { if (!(window.claude && window.claude.use)) go("noclaude"); else boot(); }, 1500); return; }
    var d = await db(); if (!d) { go("noclaude"); return; }
    await loadCfg();
    var u = null; try { u = await resume(); } catch (e) {}
    if (u) { enter(u); return; }
    var any = []; try { any = await listUsers(); } catch (e) {}
    if (!any.length) {
      var can = false;
      try { var usr = await window.claude.use("user"); can = !!(usr && ((await usr.isOwner()) || (await usr.canEdit()))); } catch (e) {}
      go(can ? "setup" : "nosetup"); return;
    }
    go("login");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
