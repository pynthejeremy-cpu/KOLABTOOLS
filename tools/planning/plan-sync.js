/* ---- Planning : base partagée + synchronisation avec l'Inventaire et l'IA Studio ----
   Chargé après le script principal du planning (accès à D, S, save, render…). */
(function () {
  "use strict";
  if (typeof GAS !== "undefined" && GAS) return;
  var C = window.CORE_API;
  if (C && C.suite === false) return; /* outil vendu seul : pas de synchronisation avec les autres outils */
  if (!C || !window.CORE) return;

  var INV = "inv-", VC = "__inv";
  var db = null, raw = null, loaded = false, applying = false;
  var last = { main: null, pj: {}, bk: {} };      // dernier état connu en base (JSON)
  var got = { main: false, pj: false, bk: false };
  var items = [];                                  // matériel sorti (inventaire)
  var base = {};                                   // état injecté par article : {min,max,proj}
  var iaIdx = [], iaSubs = {}, iaBoard = {};
  var J = function (o) { return JSON.stringify(o === undefined ? null : o); };
  var clone = function (o) { return o == null ? o : JSON.parse(JSON.stringify(o)); };
  var todayIso = function () { return iso(new Date()); };
  function busy() { return !!document.querySelector("dialog[open]"); }
  function rerender() { try { if (!busy()) { renderNav(); render(); } } catch (e) {} }

  /* ---------- état réel (sans le matériel injecté) ---------- */
  function realMain() {
    return {
      res: (D.res || []).filter(function (r) { return !r._v; }),
      clients: (D.clients || []).filter(function (c) { return c.id !== VC; }),
      ext: D.ext || [], leaves: D.leaves || [], show: D.show, days: D.days
    };
  }
  function realBookings() { return (D.bookings || []).filter(function (b) { return String(b.rid).indexOf(INV) !== 0; }); }
  function byMonth(list) {
    var o = {};
    list.forEach(function (b) { var k = String(b.date || "").slice(0, 7) || "sans-date"; (o[k] = o[k] || []).push(b); });
    return o;
  }

  /* ---------- enregistrement en base ---------- */
  var chain = Promise.resolve(), saveT = null;
  function queue(fn) { chain = chain.then(fn).catch(function (e) { report(e); }); return chain; }
  function report(e) {
    var c = e && e.code;
    if (c === "invalid_argument") snack("Enregistrement refusé : vos droits ne permettent pas de modifier le planning (ou un brief PDF est trop lourd, mettez plutôt un lien Drive).");
    else if (c === "quota_exceeded") snack("Espace de stockage plein : supprimez d'anciennes données.");
    else if (c) snack("Planning non enregistré (" + c + ").");
  }
  function persist() {
    if (!loaded || applying) return;
    writeBack();
    syncIa();
    var main = realMain(), bks = byMonth(realBookings()), pj = D.proj || {};
    var jm = J(main);
    if (jm !== last.main) { last.main = jm; queue(function () { return db.doc("st/main").set(Object.assign(clone(main), { at: new Date().toISOString() })); }); }
    Object.keys(pj).forEach(function (pid) {
      var jp = J(pj[pid]);
      if (jp !== last.pj[pid]) { last.pj[pid] = jp; queue(function () { return db.doc("pj/" + pid).set(clone(pj[pid])); }); }
    });
    var months = {}; Object.keys(bks).forEach(function (k) { months[k] = 1; }); Object.keys(last.bk).forEach(function (k) { months[k] = 1; });
    Object.keys(months).forEach(function (k) {
      var list = bks[k] || [], jb = J(list);
      if (jb === (last.bk[k] || J([]))) return;
      last.bk[k] = jb;
      if (!list.length) { delete last.bk[k]; queue(function () { return db.doc("bk/" + k).delete(); }); }
      else queue(function () { return db.doc("bk/" + k).set({ list: clone(list) }); });
    });
  }
  var localSave = save;
  save = function () { try { localSave(); } catch (e) {} clearTimeout(saveT); saveT = setTimeout(persist, 500); };

  /* ---------- lecture de la base ---------- */
  function maybeReady() {
    if (loaded || !(got.main && got.pj && got.bk)) return;
    loaded = true;
    if (last.main === null) {
      // base vide : on part d'un planning vide (les données d'exemple ne sont pas envoyées)
      applying = true;
      Object.assign(D, { res: [], clients: [], ext: [], bookings: [], leaves: [], proj: {} });
      applying = false;
      inject(); refreshIa(); rerender();
      snack("Planning partagé prêt : ajoutez vos ressources et vos clients.");
      return;
    }
    inject(); refreshIa(); rerender();
  }
  function applyMain(d) {
    var o = d.exists ? d.data() : null;
    if (o) { var x = clone(o); delete x.at; var j = J({ res: x.res || [], clients: x.clients || [], ext: x.ext || [], leaves: x.leaves || [], show: x.show, days: x.days }); if (j === last.main && loaded) return; last.main = j; applying = true; Object.assign(D, JSON.parse(j)); if (!D.show) D.show = "client"; if (!D.days) D.days = 21; applying = false; }
    got.main = true;
    if (loaded) { inject(); rerender(); } else maybeReady();
  }
  function applyPj(qs) {
    var changed = false; D.proj = D.proj || {};
    qs.docs.forEach(function (d) { var j = J(d.data()); if (last.pj[d.id] !== j) { last.pj[d.id] = j; D.proj[d.id] = clone(d.data()); changed = true; } });
    got.pj = true;
    if (loaded && changed) { refreshIa(); rerender(); } else maybeReady();
  }
  function applyBk(qs) {
    var all = [], changed = false, seen = {};
    qs.docs.forEach(function (d) { var l = (d.data() || {}).list || []; seen[d.id] = 1; var j = J(l); if (last.bk[d.id] !== j) changed = true; last.bk[d.id] = j; all = all.concat(l); });
    Object.keys(last.bk).forEach(function (k) { if (!seen[k]) { delete last.bk[k]; changed = true; } });
    if (!loaded || changed) { applying = true; D.bookings = all.concat((D.bookings || []).filter(function (b) { return String(b.rid).indexOf(INV) === 0; })); applying = false; }
    got.bk = true;
    if (loaded && changed) { inject(); rerender(); } else maybeReady();
  }

  /* ---------- Inventaire → planning : matériel sorti injecté ---------- */
  function findProject(name) {
    var n = C.norm(name); if (!n) return null;
    for (var i = 0; i < (D.clients || []).length; i++) {
      var c = D.clients[i]; if (c.id === VC) continue;
      for (var j = 0; j < (c.projects || []).length; j++) if (C.norm(c.projects[j].name) === n) return { client: c.id, project: c.projects[j].id };
    }
    return null;
  }
  function projName(cid, pid) {
    var c = (D.clients || []).filter(function (x) { return x.id === cid; })[0];
    var p = c && (c.projects || []).filter(function (x) { return x.id === pid; })[0];
    return p ? p.name : "";
  }
  function days(a, b) {
    var out = [], d = new Date(a + "T12:00:00"), e = new Date(b + "T12:00:00"), n = 0;
    while (d <= e && n < 120) { out.push(iso(d)); d.setDate(d.getDate() + 1); n++; }
    return out;
  }
  function inject() {
    applying = true;
    D.res = (D.res || []).filter(function (r) { return !r._v; });
    D.clients = (D.clients || []).filter(function (c) { return c.id !== VC; });
    D.bookings = (D.bookings || []).filter(function (b) { return String(b.rid).indexOf(INV) !== 0; });
    base = {};
    var vc = { id: VC, name: "Matériel (inventaire)", color: "#7A7A7A", projects: [], _v: true };
    items.forEach(function (it) {
      if (!it.startDate) return;
      var rid = INV + it.id, end = it.dueDate || iso(addDays(new Date(), 30));
      if (end < it.startDate) end = it.startDate;
      D.res.push({ id: rid, group: "materiel", name: it.label, sub: it.cat || "Inventaire", fn: (it.status === "tournage" ? "En tournage" : "Emprunté") + (it.holder ? " · " + it.holder : ""), _v: true });
      var m = findProject(it.project);
      if (!m) {
        var pid = "__inv:" + (C.norm(it.project) || "sans").replace(/ /g, "-");
        if (!vc.projects.some(function (p) { return p.id === pid; })) vc.projects.push({ id: pid, name: it.project || "Sans projet" });
        m = { client: VC, project: pid };
      }
      var link = "inv" + it.id;
      days(it.startDate, end).forEach(function (dt) {
        [0, 1].forEach(function (h) { D.bookings.push({ id: "inv" + it.id + dt + h, rid: rid, date: dt, half: h, client: m.client, project: m.project, status: "conf", place: "", link: link }); });
      });
      base[it.id] = J({ min: it.startDate, max: end, proj: C.norm(it.project) });
    });
    if (vc.projects.length) D.clients.push(vc);
    applying = false;
  }
  /* Planning → inventaire : on renvoie dates et projet modifiés */
  function writeBack() {
    if (!raw) return;
    var per = {};
    (D.bookings || []).forEach(function (b) {
      if (String(b.rid).indexOf(INV) !== 0) return;
      var id = String(b.rid).slice(INV.length), p = per[id] = per[id] || { min: b.date, max: b.date, c: b.client, p: b.project };
      if (b.date < p.min) { p.min = b.date; p.c = b.client; p.p = b.project; }
      if (b.date > p.max) p.max = b.date;
    });
    Object.keys(base).forEach(function (id) {
      var it = items.filter(function (x) { return x.id === id; })[0]; if (!it) return;
      var now = per[id], ref = raw.doc("m/inv/items/" + id);
      if (!now) {
        if (it.startDate > todayIso()) {
          ref.update({ status: "stock", project: "", startDate: "", dueDate: "", updatedAt: new Date().toISOString() }).catch(report);
          snack("Sortie de « " + it.label + " » annulée dans l'inventaire.");
        } else snack("« " + it.label + " » est déjà sorti : enregistrez son retour dans l'Inventaire.");
        delete base[id]; return;
      }
      var name = now.c === VC ? (it.project || "") : projName(now.c, now.p);
      var cur = J({ min: now.min, max: now.max, proj: C.norm(name) });
      if (cur === base[id]) return;
      base[id] = cur;
      ref.update({ startDate: now.min, dueDate: now.max, project: name, updatedAt: new Date().toISOString() }).catch(report);
    });
  }

  /* ---------- IA Studio ↔ rétroplanning du projet ---------- */
  function planOf(p) { p = p || {}; return { tasks: p.tasks || [], versions: p.versions || [], deadline: p.deadline || "" }; }
  function hash(p) { return JSON.stringify(planOf(p), function (k, v) { return k === "_lane" ? undefined : v; }); }
  function links() {
    var out = [];
    (D.clients || []).forEach(function (c) {
      if (c.id === VC) return;
      (c.projects || []).forEach(function (p) {
        var d = (D.proj || {})[p.id] || {}, ia = null, s = String(d.iaStudio || "");
        if (s) ia = iaIdx.filter(function (x) { return s.indexOf(x.id) >= 0; })[0] || null;
        if (!ia) { var m = iaIdx.filter(function (x) { return C.norm(x.name) === C.norm(p.name) || (x.project && C.norm(x.project) === C.norm(p.name)); }); if (m.length === 1) ia = m[0]; }
        if (ia) out.push({ pid: p.id, ia: ia.id });
      });
    });
    return out.slice(0, 40);
  }
  function refreshIa() {
    if (!raw) return;
    var want = {};
    links().forEach(function (l) {
      want[l.ia] = l.pid;
      if (iaSubs[l.ia]) return;
      iaSubs[l.ia] = raw.doc("m/ia/p/" + l.ia + "/meta/board").onSnapshot(function (d) {
        if (d.metadata && d.metadata.hasPendingWrites) return;
        iaBoard[l.ia] = d.exists ? { planning: (d.data() || {}).planning || null } : null;
        fromIa(l.ia);
      }, function () {});
    });
    Object.keys(iaSubs).forEach(function (k) { if (!want[k]) { try { iaSubs[k](); } catch (e) {} delete iaSubs[k]; delete iaBoard[k]; } });
  }
  function fromIa(iaId) {
    if (!loaded) return;
    var l = links().filter(function (x) { return x.ia === iaId; })[0], b = iaBoard[iaId];
    if (!l || !b) return;
    var d = projData(l.pid), sync = d._ia || {}, hi = hash(b.planning), hp = hash(d.plan);
    if (!b.planning) { if (hp !== sync.h) push(l, d); return; }
    if (hi === hp) { if (sync.h !== hi || sync.id !== iaId) { d._ia = { id: iaId, h: hi }; save(); } return; }
    if (hi !== sync.h || sync.id !== iaId) {
      // l'IA Studio a changé depuis la dernière synchro : on reprend sa version
      d.plan = Object.assign({}, d.plan, clone(planOf(b.planning)));
      d._ia = { id: iaId, h: hi };
      save();
      if (S.view === "project" && S.pj && S.pj.pid === l.pid && !busy()) render();
    } else push(l, d);
  }
  function push(l, d) {
    var hp = hash(d.plan), b = iaBoard[l.ia];
    if (!b) return;
    d._ia = { id: l.ia, h: hp };
    iaBoard[l.ia] = { planning: clone(planOf(d.plan)) };
    raw.doc("m/ia/p/" + l.ia + "/meta/board").update({ planning: clone(planOf(d.plan)) }).catch(function () {});
  }
  function syncIa() {
    links().forEach(function (l) {
      var d = (D.proj || {})[l.pid]; if (!d || !d.plan) return;
      var sync = d._ia || {};
      if (sync.id === l.ia && hash(d.plan) !== sync.h && iaBoard[l.ia]) push(l, d);
    });
  }

  /* ---------- démarrage ---------- */
  (async function () {
    db = await C.use("db"); raw = await C.raw("db");
    if (!db || !raw) return;
    var t = setTimeout(function () { if (!loaded) snack("La base partagée ne répond pas encore : le planning affiché n'est peut-être pas à jour."); }, 10000);
    var fail = function () { clearTimeout(t); snack("Impossible de lire le planning partagé : vérifiez votre accès à l'appli."); };
    var fin = function (fn) { return function (x) { clearTimeout(t); fn(x); }; };
    db.doc("st/main").onSnapshot(function (d) { if (d.metadata.fromCache && !d.exists) return; if (d.metadata.hasPendingWrites) return; fin(applyMain)(d); }, fail);
    db.collection("pj").onSnapshot(function (q) { if (q.metadata.hasPendingWrites) return; if (q.metadata.fromCache && !got.pj) return; fin(applyPj)(q); }, fail);
    db.collection("bk").onSnapshot(function (q) { if (q.metadata.hasPendingWrites) return; if (q.metadata.fromCache && !got.bk) return; fin(applyBk)(q); }, fail);
    raw.collection("m/inv/items").onSnapshot(function (q) {
      if (q.metadata.hasPendingWrites) return;
      items = q.docs.map(function (d) { var o = d.data() || {}; return { id: d.id, status: o.status, project: o.project || "", startDate: o.startDate || "", dueDate: o.dueDate || "", holder: o.holder || "", cat: o.category || "", label: [o.name || o.model || "", o.brand && !(o.name || "").includes(o.brand) ? o.brand : ""].filter(Boolean).join(" · ") || ("Article " + d.id) }; })
        .filter(function (i) { return (i.status === "tournage" || i.status === "pret") && i.startDate; });
      if (loaded) { inject(); rerender(); }
    }, function () {});
    raw.collection("m/ia/projects").onSnapshot(function (q) {
      iaIdx = q.docs.map(function (d) { var o = d.data() || {}; return { id: d.id, name: o.name || "", project: o.project || "" }; });
      if (loaded) refreshIa();
    }, function () {});
  })();
})();
