# ng-podcast

Application web de podcasts développée avec Angular 21, SSR et NgRx Signals.
Elle permet de découvrir, publier et écouter des podcasts avec un lecteur audio intégré.

---

## Prerequis

- Node.js >= 20
- npm >= 10

## Installation

```bash
git clone https://github.com/Babie-cloud/ng-podcast/
cd ng-podcast/ng-podcast
npm install
```

## Scripts

| Commande                       | Description               |
| ------------------------------ | ------------------------- |
| `npm serve`                    | Lance le serveur Angular  |
| `npm run build`                | Build de production       |
| `npm run build:prod`           | Build production optimisé |
| `npm run watch`                | Build en mode watch       |
| `npm test`                     | Lance les tests           |



## Configuration

Le fichier `src/environments/environment*.ts` definit `apiUrl` (ex. `http://127.0.0.1:8080` en developpement).

Le backend est disponible ici : https://github.com/Babie-cloud/sdk-podcast.
Il doit etre lance avant le front-end.

## Licence

Projet privé. Tous droits réservés.