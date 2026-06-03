# Permis — Flashcards

Outil personnel de révision pour l'examen du permis de conduire (vérifications, sécurité routière, premiers secours, commandes de la voiture, points faibles perso). Direction visuelle « Minecraft ». HTML / CSS / JavaScript purs, aucune dépendance à installer.

## Fonctionnalités

- **215 cartes** en 5 thèmes : Voiture / Commandes, Vérifications extérieures, Sécurité routière, Premiers secours, Points faibles.
- **4 modes** :
  - *Lecture* : on retourne la carte pour voir la réponse.
  - *Écriture* : rappel actif, on tape sa réponse avant de vérifier.
  - *Chrono* : 2 minutes, un maximum de cartes, score à battre.
  - *Cœurs* : 3 vies, chaque « à revoir » coûte une vie.
- **Série (streak)** : compteur de bonnes réponses d'affilée, avec record sauvegardé.
- **Objectif du jour** : 20 cartes par jour, avec célébration quand c'est atteint.
- **Feedback** : la carte flashe en vert (su) ou rouge (à revoir), avec un petit son (désactivable).
- **Filtre « À revoir »** : ne montre que les cartes incertaines ou ratées.
- **Progression sauvegardée** dans le navigateur, avec export / import en fichier `.json`.
- **Raccourcis clavier** : Espace / F retourner, ← → naviguer, 1 / 2 / 3 noter.

## Lancer en local

Ouvrir `index.html` dans un navigateur. Les trois fichiers (`index.html`, `style.css`, `script.js`) doivent rester dans le même dossier.

## Mettre en ligne sur GitHub Pages (recommandé pour réviser sur téléphone)

1. Créer un dépôt GitHub et y déposer `index.html`, `style.css`, `script.js`, `README.md`.
2. Dans le dépôt : **Settings → Pages**.
3. *Build and deployment* → branche `main`, dossier `/ (root)` → **Save**.
4. Au bout d'une minute, l'appli est en ligne à `https://<ton-pseudo>.github.io/<nom-du-repo>/`.
5. Ouvrir cette adresse dans Safari sur l'iPhone (et l'ajouter à l'écran d'accueil pour un accès direct).

## Pousser depuis ton ordinateur (en ligne de commande)

```bash
git init
git add .
git commit -m "Première version"
git branch -M main
git remote add origin https://github.com/<ton-pseudo>/<nom-du-repo>.git
git push -u origin main
```

## Notes

- La police pixel (Press Start 2P) se charge depuis Google Fonts : connexion internet requise au premier affichage.
- Le son est généré par le navigateur (Web Audio), aucun fichier audio à fournir.
- Le contenu des cartes est dans `index.html` (bloc `<div id="data">`).
