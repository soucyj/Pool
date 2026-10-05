# Le Pool — Québec 2026

Page web statique pour suivre le pool de prédictions de sièges. Tout vient de [data.js](data.js) : le site ne contient aucune saisie, il affiche ce qui est dans ce fichier.

## Mettre à jour

1. Éditer `data.js` : ajouter un participant dans `predictions`, ou une nouvelle projection à la fin de `updates` (`source` : `qc125`, `radioCanada` ou `final`, avec l’heure `at` en `-04:00`).
2. Chaque ligne doit totaliser 127 sièges, sinon la page affiche une erreur au lieu des données.
3. `git commit` puis `git push` : GitHub Pages republie le site en une minute ou deux.

## Classement

- **L1** : somme des écarts absolus de sièges par parti entre la prédiction et la dernière mise à jour. Le plus petit mène.
- **L2** : racine de la somme des carrés des écarts; départage les égalités de L1, puis ordre alphabétique.
- Le graphique « Évolution de l’écart » trace le L1 de chaque participant à chaque mise à jour; le premier point est l’écart initial avec Qc125.

## Publier sur GitHub Pages

Créer un dépôt, y pousser ces fichiers, puis dans *Settings → Pages* choisir la branche `main` et le dossier `/ (root)`. Pour tester localement, ouvrir `index.html` directement.

Les projections sont saisies manuellement à partir de [Qc125](https://qc125.com/) et de [Radio-Canada](https://ici.radio-canada.ca/info/dossier/1013730/elections-quebec-2026).
