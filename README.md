# KOLABTOOLS

Une seule source pour l'appli fusionnée **Outils collaboratifs d'agence** et pour chaque outil vendu seul.
On modifie un outil **une fois**, dans `tools/<outil>/` ; `build.py` produit la suite et l'outil seul.

## Organisation

```
shared/            socle commun à tous les outils
  core.js          base de données, administrateurs, menu « Outils » — deux modes : suite / solo
  agence.js        connexion unique (e-mail + mot de passe, sur invitation), gestion des comptes, charte Refraction
  lg.js            couche Liquid Glass
  bkx.js           sauvegarde quotidienne (Planning, Droit à l'image)
tools/
  planning/        index.html + plan-sync.js (synchronisation Planning ↔ Inventaire ↔ IA Studio, suite seulement)
  inventaire/      index.html
  droit/           index.html
  ia-studio/       index.html + bkx-ia.js, ext.js, grp.js, vsx.js
  dam-studio/      index.html
suite/index.html   accueil de l'appli fusionnée
kolab.json         liste des outils, nom de fichier dans la suite, artefact et adresse de chaque version
build.py           construit dist/
dist/              résultat (non versionné) : dist/suite/ et dist/<outil>/
```

Un fichier placé dans `tools/<outil>/` remplace le fichier de même nom de `shared/` pour cet outil.
Deux outils ne peuvent pas avoir chacun leur propre version d'un même fichier dans la suite : `build.py` s'arrête et le signale (renommer, comme `bkx-ia.js`).

## Les deux modes

| | Suite (appli fusionnée) | Solo (outil vendu seul) |
|---|---|---|
| Données | une base partagée, rangée par outil (`m/<outil>/…`) | la base propre de l'outil, sans préfixe |
| Projets | reliés entre les outils (accueil, planning ↔ matériel…) | propres à l'outil |
| Navigation | menu « Outils » à droite | aucune |
| Connexion | une seule pour tous les outils | propre à l'outil, même écran |
| Comptes | Accueil › Comptes et accès, ou menu « Outils » | pastille compte en bas à droite |

Le mode est posé par `build.py` (`window.KOLAB_MODE = "solo"`), le code des outils est identique.

## Règles pour écrire un outil

1. Charger `core.js` en premier dans `<head>` : `<script src="core.js" data-mod="<id>"></script>`.
2. Passer par `CORE.use("db")`, `CORE.use("user")`, `CORE.use("mcp")` — jamais `window.claude` directement.
3. Les chemins de données sont relatifs (`items/…`) : le socle ajoute le préfixe en suite.
4. Ne rien écrire de propre à une agence en dur : le nom de l'agence et l'adresse de l'appli viennent de la configuration (`JP_AUTH.org`).

## Connexion unique

- Première ouverture : création du compte administrateur (nom de l'agence, nom, e-mail, mot de passe).
- Invitations : équipe (tous les outils) ou client (DAM Studio, Droit à l'image), code valable 14 jours, envoyé par copier-coller ou par e-mail.
- Mots de passe : PBKDF2-SHA256, 150 000 itérations, sel aléatoire ; 5 erreurs = blocage 10 minutes.
- Limite : sur Claude, la protection se fait dans la page. Une version serveur (Netlify) sera nécessaire pour des clients extérieurs et pour la double vérification par e-mail.

## Publier

```
python3 build.py              # tout
python3 build.py planning     # la suite + le Planning seul
```

Puis publier `dist/suite/` sur l'artefact de la suite et `dist/<outil>/` sur l'artefact de l'outil (voir `kolab.json`).
Chaque dossier de `dist/` est aussi un site statique prêt pour Netlify.
