/* ---- IA Studio · mode hors ligne en un clic ----
   Hors ligne (au clic, ou tout seul quand Internet tombe) : les écritures en base sont gardées dans un journal local
   au lieu d'être envoyées. En repassant en ligne, une page liste chaque changement sous forme de tâche, avec l'avant
   (version en ligne) et l'après (votre version), signale les conflits (quelqu'un a modifié entre-temps),
   et n'envoie que ce que vous validez. */
(function () {
"use strict";
if (window.__OFFL) return; window.__OFFL = 1;
var KEY = "ia-offjournal", MKEY = "ia-offmode";
var J = load(), OFF = J.length > 0 || ls(MKEY) === "1", seen = {}, real = null, auto = false;
function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
function load() { try { var a = JSON.parse(ls(KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function persist() { try { localStorage.setItem(KEY, JSON.stringify(J)); } catch (e) { toast("Stockage local plein : passez en ligne pour envoyer vos changements."); } }
function cp(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
function toast(m) { try { if (typeof window.snack === "function") return window.snack(m); } catch (e) {} var s = document.getElementById("snack"); if (s) { s.textContent = m; s.classList.add("show"); setTimeout(function () { s.classList.remove("show"); }, 4200); } }

/* ---------- enveloppe de la base ---------- */
function note(path, data) { if (!OFF) seen[path] = data === undefined ? null : cp(data); }
function rec(op, path, data) {
  var e = null; for (var i = 0; i < J.length; i++) if (J[i].path === path) { e = J[i]; break; }
  if (!e) { e = { path: path, base: seen.hasOwnProperty(path) ? seen[path] : undefined, after: seen.hasOwnProperty(path) ? cp(seen[path]) : null, at: new Date().toISOString(), ops: 0 }; J.push(e); }
  if (op === "set") e.after = cp(data); else if (op === "update") e.after = Object.assign({}, e.after || {}, cp(data)); else e.after = null;
  e.del = op === "delete"; e.ops++; e.last = new Date().toISOString(); persist(); paint();
  return Promise.resolve();
}
function wDoc(r, path) {
  path = path || r.path;
  return {
    id: r.id, get path() { return r.path; },
    get: function () { return r.get().then(function (d) { note(path, d && d.exists ? d.data() : null); return d; }); },
    set: function (d) { if (OFF) return rec("set", path, d); return r.set(d).then(function (x) { note(path, d); return x; }); },
    update: function (d) { if (OFF) return rec("update", path, d); return r.update(d).then(function (x) { if (seen.hasOwnProperty(path) && seen[path]) note(path, Object.assign({}, seen[path], cp(d))); return x; }); },
    delete: function () { if (OFF) return rec("delete", path); return r.delete().then(function (x) { note(path, null); return x; }); },
    onSnapshot: function (a, b) { return r.onSnapshot(function (d) { try { if (!(d.metadata && d.metadata.hasPendingWrites)) note(path, d.exists ? d.data() : null); } catch (e) {} a(d); }, b); },
    collection: function (p) { return wCol(r.collection(p), path + "/" + p); },
    acquire: r.acquire ? function (o) { return r.acquire(o); } : undefined
  };
}
function wCol(c, path) {
  path = path || c.path;
  var seeQ = function (q) { try { if (!(q.metadata && q.metadata.hasPendingWrites)) q.docs.forEach(function (d) { note(path + "/" + d.id, d.data()); }); } catch (e) {} return q; };
  return {
    get path() { return c.path; },
    doc: function (id) { var r = arguments.length && id !== undefined ? c.doc(id) : c.doc(); return wDoc(r, path + "/" + r.id); },
    add: function (d) { var r = c.doc(); return wDoc(r, path + "/" + r.id).set(d).then(function () { return wDoc(r, path + "/" + r.id); }); },
    where: function (a, b, v) { return c.where(a, b, v); }, orderBy: function (a, b) { return c.orderBy(a, b); }, limit: function (n) { return c.limit(n); },
    get: function () { return c.get().then(seeQ); },
    onSnapshot: function (a, b) { return c.onSnapshot(function (q) { seeQ(q); a(q); }, b); }
  };
}
window.OFFL = {
  wrap: function (db) { if (!db) return db; real = db; var w = { doc: function (p) { return wDoc(db.doc(p), p); }, collection: function (p) { return wCol(db.collection(p), p); } };
    for (var k in db) if (!(k in w) && typeof db[k] === "function") w[k] = db[k].bind(db); paint(); return w; },
  get off() { return OFF; }
};

/* ---------- interrupteur ---------- */
function setOff(v, why) {
  OFF = !!v; auto = why === "auto"; ls(MKEY, OFF ? "1" : null); paint();
  if (OFF) toast(why === "auto" ? "Connexion perdue : passage hors ligne. Vos changements sont gardés sur cet appareil." : "Hors ligne : vos changements sont gardés sur cet appareil jusqu'à votre retour en ligne.");
}
function paint() {
  var box = document.getElementById("railMode"); if (!box) return;
  if (!real) { box.textContent = box.textContent || "Hors ligne"; return; }
  var b = box.querySelector("button.offl-b");
  if (!b) { box.textContent = ""; b = document.createElement("button"); b.type = "button"; b.className = "offl-b"; b.addEventListener("click", click); box.appendChild(b); }
  var n = J.length;
  b.className = "offl-b" + (OFF ? " off" : "");
  b.innerHTML = '<i aria-hidden="true"></i><span>' + (OFF ? "Hors ligne" : "En ligne") + "</span>" + (n ? '<b>' + n + "</b>" : "");
  b.title = OFF ? (navigator.onLine ? "Cliquez pour repasser en ligne et valider vos changements" : "Pas de connexion Internet") : "Cliquez pour travailler hors ligne";
  b.setAttribute("aria-label", OFF ? "Hors ligne" + (n ? ", " + n + " changement(s) en attente" : "") + ". Repasser en ligne" : "En ligne. Passer hors ligne");
}
function click() {
  if (!OFF) return setOff(true, "user");
  if (!navigator.onLine) return toast("Toujours pas de connexion Internet : réessayez dès qu'elle revient.");
  if (!J.length) { setOff(false); return toast("De nouveau en ligne."); }
  review();
}
addEventListener("offline", function () { if (real && !OFF) setOff(true, "auto"); });
addEventListener("online", function () { if (OFF) toast(J.length ? "Connexion revenue : cliquez sur « Hors ligne » pour valider vos " + J.length + " changement(s)." : "Connexion revenue : cliquez sur « Hors ligne » pour repasser en ligne."); });

/* ---------- page de validation ---------- */
function label(path) {
  var m, P = function (pid) { try { var l = (window.IA_PROJECTS && window.IA_PROJECTS()) || []; var p = l.find(function (x) { return x.id === pid; }); return p ? (p.name || p.title || "Projet") : "Projet"; } catch (e) { return "Projet"; } };
  if ((m = path.match(/(?:^|\/)p\/([^/]+)\/meta\/board$/))) return [P(m[1]), "Projet : scénario, moodboard, planning, montage…"];
  if ((m = path.match(/(?:^|\/)p\/([^/]+)\/shots\/([^/]+)$/))) return [P(m[1]), "Plan " + m[2].slice(0, 8)];
  if ((m = path.match(/(?:^|\/)p\/([^/]+)\/chars\/([^/]+)$/))) return [P(m[1]), "Personnage"];
  if ((m = path.match(/(?:^|\/)p\/([^/]+)\/snaps\/([^/]+)$/))) return [P(m[1]), "Version enregistrée"];
  if ((m = path.match(/(?:^|\/)(?:projects|idx)\/([^/]+)$/))) return [P(m[1]), "Fiche du projet"];
  if (/(?:^|\/)profiles\//.test(path)) return ["Profil", "Votre profil"];
  return ["Base", path];
}
var NAMES = { title: "Titre", scenario: "Scénario", mood: "Moodboard", order: "Ordre des plans", planning: "Planning", places: "Lieux", products: "Produits", brief: "Introduction", gen: "Génération", mnt: "Montage", delivery: "Livraison", client: "Client", project: "Projet", name: "Nom", move: "Mouvement de caméra", light: "Lumière", notes: "Notes", hfPrompt: "Prompt Higgsfield", ovLib: "Incrustations", brand: "Intro / outro de marque", deadline: "Deadline", tasks: "Tâches", versions: "Versions" };
function short(v) {
  if (v === undefined) return "—"; if (v === null) return "(vide)";
  if (typeof v === "string") return v.length > 220 ? v.slice(0, 220) + "…" : (v || "(vide)");
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.length + " élément" + (v.length > 1 ? "s" : "");
  if (v.tasks) return (v.tasks.length || 0) + " tâche(s), " + ((v.versions || []).length) + " version(s)" + (v.deadline ? ", deadline " + new Date(v.deadline + "T12:00:00").toLocaleDateString("fr-FR") : "");
  var s = JSON.stringify(v); return s.length > 220 ? s.slice(0, 220) + "…" : s;
}
function diff(a, b) {
  var out = []; a = a || {}; b = b || {};
  if (typeof a !== "object" || typeof b !== "object") return [["valeur", a, b]];
  var keys = {}; Object.keys(a).concat(Object.keys(b)).forEach(function (k) { keys[k] = 1; });
  Object.keys(keys).forEach(function (k) { if (/^(updatedAt|at|_lane)$/.test(k)) return; if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) out.push([k, a[k], b[k]]); });
  return out;
}
function el(t, a, kids) { var e = document.createElement(t); for (var k in (a || {})) { if (k === "text") e.textContent = a[k]; else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), a[k]); else if (a[k] != null && a[k] !== false) e.setAttribute(k, a[k] === true ? "" : a[k]); } (kids || []).forEach(function (c) { if (c != null) e.append(c); }); return e; }
async function review() {
  var d = document.getElementById("offlDlg"); if (d) d.remove();
  d = el("dialog", { class: "dlg offl-dlg", id: "offlDlg", "aria-labelledby": "offlT" });
  var body = el("div", { class: "offl-body" }, [el("p", { class: "note", text: "Lecture de la version en ligne de chaque élément…" })]);
  d.append(el("div", { class: "dlg-head" }, [el("div", { class: "band" }, [el("h2", { id: "offlT", text: "Repasser en ligne · " + J.length + " changement" + (J.length > 1 ? "s" : "") })]),
    el("button", { class: "ib", "aria-label": "Fermer", onclick: function () { d.close(); } }, [el("span", { class: "ms", "aria-hidden": "true", text: "close" })])]), body);
  document.body.append(d); d.showModal();
  var items = [];
  for (var i = 0; i < J.length; i++) {
    var e = J[i], remote;
    try { var snap = await real.doc(e.path).get(); remote = snap.exists ? snap.data() : null; } catch (x) { remote = undefined; }
    var conflict = e.base !== undefined && remote !== undefined && JSON.stringify(remote) !== JSON.stringify(e.base);
    if (!e.del && !conflict && remote !== undefined && JSON.stringify(remote) === JSON.stringify(e.after)) continue; /* rien à envoyer */
    items.push({ e: e, remote: remote, conflict: conflict, pick: conflict ? null : "mine" });
  }
  if (!items.length) { J = []; persist(); setOff(false); d.close(); toast("De nouveau en ligne : rien à envoyer, tout était déjà à jour."); return; }
  var nc = items.filter(function (x) { return x.conflict; }).length;
  function draw() {
    body.replaceChildren(
      el("p", { class: "note", text: nc ? nc + " conflit(s) : quelqu'un a modifié le même élément pendant que vous étiez hors ligne. Choisissez la version à garder pour chacun. Les autres changements sont prêts à envoyer." : "Aucun conflit. Vérifiez vos changements puis validez : ils seront envoyés en ligne." }),
      el("div", { class: "offl-list" }, items.map(function (it, k) {
        var L = label(it.e.path), rows = diff(it.remote === undefined ? it.e.base : it.remote, it.e.after);
        var st = it.pick === "mine" ? "Validée · votre version" : it.pick === "theirs" ? "Validée · version en ligne gardée" : "À valider";
        return el("article", { class: "offl-task" + (it.conflict ? " conflict" : "") + (it.pick ? " done" : "") }, [
          el("header", {}, [el("span", { class: "ms", "aria-hidden": "true", text: it.pick ? "task_alt" : it.conflict ? "warning" : "radio_button_unchecked" }),
            el("div", {}, [el("b", { text: L[1] }), el("small", { text: L[0] + " · modifié hors ligne le " + new Date(it.e.last || it.e.at).toLocaleString("fr-FR") + (it.e.del ? " · suppression" : "") })]),
            el("span", { class: "offl-st", text: it.conflict && !it.pick ? "Conflit" : st })]),
          el("div", { class: "offl-ab" }, [
            el("div", { class: "offl-a" }, [el("h4", { text: it.conflict ? "Avant · version en ligne (modifiée par un autre)" : "Avant" })].concat(rows.length ? rows.map(function (r) { return el("p", {}, [el("em", { text: (NAMES[r[0]] || r[0]) + " : " }), document.createTextNode(short(r[1]))]); }) : [el("p", { class: "note", text: "Identique" })])),
            el("div", { class: "offl-b2" }, [el("h4", { text: "Après · votre version" })].concat(it.e.del ? [el("p", { text: "Élément supprimé" })] : rows.length ? rows.map(function (r) { return el("p", {}, [el("em", { text: (NAMES[r[0]] || r[0]) + " : " }), document.createTextNode(short(r[2]))]); }) : [el("p", { class: "note", text: "Aucune différence" })]))]),
          el("div", { class: "row2" }, [
            el("button", { class: "btn sm" + (it.pick === "mine" ? "" : " ghost"), onclick: function () { it.pick = "mine"; draw(); } }, [document.createTextNode("Valider ma version")]),
            el("button", { class: "btn sm" + (it.pick === "theirs" ? "" : " ghost"), onclick: function () { it.pick = "theirs"; draw(); } }, [document.createTextNode(it.conflict ? "Garder la version en ligne" : "Annuler ce changement")])])]);
      })),
      el("div", { class: "dlg-foot" }, [el("button", { class: "btn ghost", onclick: function () { items.forEach(function (x) { if (!x.pick) x.pick = "mine"; }); draw(); } }, [document.createTextNode("Tout valider (ma version)")]),
        el("span", { class: "grow" }), el("button", { class: "btn ghost", onclick: function () { d.close(); } }, [document.createTextNode("Rester hors ligne")]),
        el("button", { class: "btn", disabled: items.some(function (x) { return !x.pick; }) ? true : null, onclick: send }, [document.createTextNode("Envoyer et repasser en ligne")])]));
  }
  async function send() {
    var ok = 0, ko = 0, keep = [];
    for (var k = 0; k < items.length; k++) { var it = items[k];
      if (it.pick !== "mine") continue;
      try { var r = real.doc(it.e.path); if (it.e.del) await r.delete(); else await r.set(it.e.after); seen[it.e.path] = cp(it.e.after); ok++; } catch (x) { ko++; keep.push(it.e); } }
    J = keep; persist();
    if (!ko) { setOff(false); d.close(); toast("En ligne · " + ok + " changement(s) envoyé(s)." + (ok < items.length ? " Les versions en ligne choisies sont gardées." : "")); setTimeout(function () { location.reload(); }, 900); }
    else { paint(); toast(ko + " changement(s) n'ont pas pu être envoyés : réessayez."); }
  }
  draw();
}

/* ---------- styles ---------- */
var css = document.createElement("style");
css.textContent = ".offl-b{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:999px;font-size:10.5px;font-weight:800;color:inherit;opacity:1}" +
  ".offl-b i{width:8px;height:8px;border-radius:50%;background:#30d158;box-shadow:0 0 0 3px rgba(48,209,88,.25)}" +
  ".offl-b.off{background:#e3120b;color:#fff}.offl-b.off i{background:#fff;box-shadow:none}" +
  ".offl-b b{min-width:16px;padding:0 4px;border-radius:8px;background:#fff;color:#e3120b;text-align:center}" +
  ".offl-b:focus-visible{outline:2px solid currentColor;outline-offset:2px}" +
  ".rail-mode:has(.offl-b){opacity:1}" +
  ".offl-dlg{width:min(980px,calc(100% - 24px))}.offl-body{padding:14px 18px;display:grid;gap:14px;max-height:70vh;overflow:auto}" +
  ".offl-list{display:grid;gap:12px}.offl-task{border:2px solid var(--bd,#888);border-radius:12px;padding:12px;display:grid;gap:10px}" +
  ".offl-task.conflict{border-color:#e3120b}.offl-task.done{border-color:#30d158}" +
  ".offl-task header{display:flex;gap:10px;align-items:center}.offl-task header>div{flex:1;display:grid}.offl-task small{opacity:.7}" +
  ".offl-st{font-size:12px;font-weight:800;padding:3px 9px;border-radius:999px;background:rgba(128,128,128,.18)}.offl-task.conflict .offl-st{background:#e3120b;color:#fff}.offl-task.done .offl-st{background:#30d158;color:#062}" +
  ".offl-ab{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:700px){.offl-ab{grid-template-columns:1fr}}" +
  ".offl-a,.offl-b2{border-radius:10px;padding:10px;font-size:13px;overflow-wrap:anywhere}.offl-a{background:rgba(227,18,11,.08);border-left:4px solid #e3120b}.offl-b2{background:rgba(48,209,88,.1);border-left:4px solid #30d158}" +
  ".offl-a h4,.offl-b2 h4{margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.05em}.offl-a p,.offl-b2 p{margin:3px 0}.offl-a em,.offl-b2 em{font-style:normal;font-weight:800}";
document.head.appendChild(css);
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint); else paint();
})();
