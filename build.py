#!/usr/bin/env python3
"""KOLABTOOLS — construit, à partir d'une seule source :
  dist/suite/          l'appli fusionnée (accueil + tous les outils, base partagée, menu « Outils »)
  dist/<outil>/        chaque outil vendu seul (index.html + ses fichiers, base propre, sans menu)

Source :
  shared/              socle commun : core.js (deux modes), agence.js (connexion + charte), lg.js, bkx.js
  tools/<outil>/       index.html de l'outil + ses fichiers propres (un fichier propre remplace le fichier commun de même nom)
  suite/index.html     accueil de l'appli fusionnée
  kolab.json           liste des outils, nom du fichier dans la suite, artefact et adresse de publication

Usage : python3 build.py            (tout)
        python3 build.py planning   (la suite + cet outil seul)
"""
import json, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CFG = json.loads((ROOT / "kolab.json").read_text(encoding="utf-8"))
DIST = ROOT / "dist"
CORE_TAG = re.compile(r'<script src="core\.js" data-mod="([a-z]+)"></script>')
LOCAL_SRC = re.compile(r'<script src="([A-Za-z0-9_.-]+\.js)"')
ASSETS = re.compile(r'<!-- kolab-assets: ([^>]*?) -->')  # fichiers chargés à la demande (ex. OCR local)


def tool_files(t):
    d = ROOT / "tools" / t["dir"]
    return d, sorted(p for p in d.iterdir() if p.is_file() and p.name != "index.html" and not p.name.startswith("."))


def needed(html, own):
    """Fichiers .js locaux chargés par la page (+ agence.js, chargé par core.js)."""
    names = set(LOCAL_SRC.findall(html))
    for grp in ASSETS.findall(html):
        names.update(grp.split())
    if "core.js" in names:
        names.add("agence.js")
    out = {}
    for n in sorted(names):
        src = own.get(n) or ROOT / "shared" / n
        if not src.exists():
            sys.exit(f"Fichier introuvable : {n}")
        out[n] = src
    return out


def inject(html, mode, url, mod_expected, title=None):
    m = CORE_TAG.search(html)
    if not m:
        sys.exit("core.js absent d'une page : chaque outil doit charger core.js en premier.")
    if mod_expected and m.group(1) != mod_expected:
        sys.exit(f"data-mod={m.group(1)} au lieu de {mod_expected}")
    boot = "<script>" + ("window.KOLAB_MODE=\"solo\";" if mode == "solo" else "") + f"window.KOLAB_URL={json.dumps(url)};</script>"
    html = html[:m.start()] + boot + "\n" + html[m.start():]
    if title:
        html = re.sub(r"<title>.*?</title>", "<title>" + title.replace("&", "&amp;").replace("<", "&lt;") + "</title>", html, count=1, flags=re.S)
    return html


def write(dst, text):
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(text, encoding="utf-8")


def build_suite():
    out = DIST / "suite"
    shutil.rmtree(out, ignore_errors=True)
    files = {}
    hub = (ROOT / "suite" / "index.html").read_text(encoding="utf-8")
    write(out / "index.html", inject(hub, "suite", CFG["suite"]["url"], "hub"))
    files.update(needed(hub, {}))
    for t in CFG["tools"]:
        d, extra = tool_files(t)
        own = {p.name: p for p in extra}
        html = (d / "index.html").read_text(encoding="utf-8")
        write(out / t["suite_file"], inject(html, "suite", CFG["suite"]["url"], t["id"]))
        for n, src in needed(html, own).items():
            if n in files and files[n].read_bytes() != src.read_bytes():
                sys.exit(f"Conflit de nom dans la suite : {n} existe en deux versions ({files[n]} / {src}). Renommez le fichier propre à l'outil.")
            files[n] = src
    for n, src in files.items():
        shutil.copyfile(src, out / n)
    return out


def build_tool(t):
    out = DIST / t["dir"]
    shutil.rmtree(out, ignore_errors=True)
    d, extra = tool_files(t)
    own = {p.name: p for p in extra}
    html = (d / "index.html").read_text(encoding="utf-8")
    write(out / "index.html", inject(html, "solo", t["url"], t["id"], t.get("name")))
    for n, src in needed(html, own).items():
        shutil.copyfile(src, out / n)
    return out


if __name__ == "__main__":
    only = set(sys.argv[1:])
    unknown = only - {t["dir"] for t in CFG["tools"]}
    if unknown:
        sys.exit("Outil inconnu : " + ", ".join(sorted(unknown)))
    built = [build_suite()]
    for t in CFG["tools"]:
        if not only or t["dir"] in only:
            built.append(build_tool(t))
    for b in built:
        n = sorted(p.name for p in b.iterdir())
        print(f"{b.relative_to(ROOT)}/  ({len(n)} fichiers) : {', '.join(n)}")
