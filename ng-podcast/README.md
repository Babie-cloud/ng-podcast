# ng-podcast

Plateforme web de podcasts construite avec **Angular 21** (standalone components),
**SSR** via `@angular/ssr` + Express, et **NgRx Signals** pour la gestion d'état.
L'application permet de découvrir, rechercher, publier et écouter des podcasts,
avec un lecteur audio intégré exploitant la Web Audio API et un visualiseur
waveform en temps réel.

---

## Sommaire

1. [Stack technique](#stack-technique)
2. [Architecture du projet](#architecture-du-projet)
3. [Fonctionnalités](#fonctionnalités)
4. [Routes](#routes)
5. [Prérequis](#prérequis)
6. [Installation](#installation)
7. [Scripts disponibles](#scripts-disponibles)
8. [Configuration](#configuration)
9. [Conventions de code](#conventions-de-code)
10. [Tests](#tests)
11. [Build et déploiement](#build-et-déploiement)
12. [Pistes d'évolution](#pistes-dévolution)

---

## Stack technique

| Domaine                  | Outil                                     |
| ------------------------ | ----------------------------------------- |
| Framework                | Angular 21.2 (standalone API)             |
| Rendu                    | SSR via `@angular/ssr` + Express 5        |
| State management         | `@ngrx/signals` (signal store)            |
| Formulaires              | Reactive Forms                            |
| Routing                  | Routes par feature, lazy-loading          |
| Styles                   | SCSS, design system custom, thèmes        |
| Audio                    | HTMLAudioElement + Web Audio API + Canvas |
| Tests                    | Vitest                                    |
| Langage                  | TypeScript 5.9, mode strict               |
| Outillage                | Angular CLI 21, Prettier 3                |

---

## Architecture du projet

Organisation feature-based. Chaque feature est autonome (composants, pages,
services, store, modèles).

```
src/app/
├── app.ts / app.html / app.config.ts          Bootstrap racine
├── app.routes.ts                              Routes top-level (lazy)
├── app.routes.server.ts                       Routes SSR
│
├── features/
│   ├── core/
│   │   ├── guard/auth.guard.ts               Protection des routes privées
│   │   └── interceptors/auth.interceptor.ts  Injection du token JWT
│   │
│   ├── layout/
│   │   ├── header/                            Navbar + theme toggle
│   │   └── footer/                            Footer + liens sociaux
│   │
│   └── podcast/
│       ├── auth/                              Landing, login, signup, reset
│       ├── components/
│       │   ├── player/                        Lecteur audio sticky
│       │   ├── podcast-card/                  Carte de podcast
│       │   ├── podcast-list/                  Liste de podcasts
│       │   └── waveform/                      Visualiseur (Canvas + Analyser)
│       ├── models/podcast.model.ts            Podcast, Episode, PlayerState
│       ├── pages/
│       │   ├── home/                          Accueil
│       │   ├── search/                        Recherche
│       │   ├── my-podcasts/                   Espace créateur
│       │   ├── create/                        Création d'un podcast
│       │   ├── detail/                        Détail + épisodes
│       │   └── publish/                       Publication d'un épisode
│       ├── services/
│       │   ├── audio.ts                       AudioService (Web Audio)
│       │   ├── auth.service.ts                Connexion API auth
│       │   ├── podcast.service.ts             Connexion API podcasts
│       │   └── theme.service.ts               Dark / light, persistant
│       ├── store/
│       │   ├── auth.store.ts                  Token, isLoggedIn
│       │   └── podcast.store.ts               Liste, courant, lecture
│       └── podcast.routes.ts                  Sous-routes du module
│
└── shared/
    └── pages/not-found/                       Page 404

public/
└── styles/
    ├── variables.scss                         Tokens design (couleurs, espacements)
    ├── theme.scss                             Variables CSS dark/light
    └── global.scss                            Classes utilitaires partagées
```

### Modèles de données

```ts
interface Podcast {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  authorId: string;
  authorName: string;
  episodes: Episode[];
  createdAt: Date;
}

interface Episode {
  id: string;
  title: string;
  audioUrl: string;
  duration: number;     // secondes
  podcastId: string;
  createdAt: Date;
}
```

### Stores (NgRx Signals)

- `PodcastStore` : catalogue, podcast et épisode courants, état de lecture,
  méthodes `loadAll`, `play`, `pause`, etc.
- `AuthStore` : token persistant en `localStorage` (avec garde
  `isPlatformBrowser` pour rester compatible SSR), `isLoggedIn` calculé.

---

## Fonctionnalités

- Découverte de podcasts (page d'accueil, topics, recherche)
- Page de détail d'un podcast avec liste d'épisodes
- Lecteur audio persistant (sticky) avec :
  - Lecture / pause / saut +-15s
  - Volume et mute
  - Vitesse de lecture
  - Visualiseur waveform via `AnalyserNode` + Canvas
- Authentification : connexion, inscription, mot de passe oublié
- Espace créateur protégé par `authGuard` :
  - Création d'un podcast
  - Mes podcasts
  - Publication d'un épisode
- Thème dark / light avec toggle dans le header, persistant via `localStorage`
- Design system maison (tokens SCSS, variables CSS, classes utilitaires)
- Server-Side Rendering pour le SEO et le first paint
- Lazy loading par feature pour réduire le bundle initial

---

## Routes

| Chemin                       | Composant       | Accès           |
| ---------------------------- | --------------- | --------------- |
| `/`                          | `Landingpage`   | Public          |
| `/login`                     | `Login`         | Public          |
| `/signup`                    | `Signin`        | Public          |
| `/resetpassword`             | `Resetpassword` | Public          |
| `/podcasts`                  | `Home`          | Public          |
| `/podcasts/search`           | `Search`        | Public          |
| `/podcasts/:id`              | `Detail`        | Public          |
| `/podcasts/mine`             | `MyPodcasts`    | Authentifié     |
| `/podcasts/create`           | `Create`        | Authentifié     |
| `/podcasts/:id/publish`      | `Publish`       | Authentifié     |
| `**`                         | `NotFound`      | Public          |

Les routes authentifiées sont protégées par `authGuard`
(`features/core/guard/auth.guard.ts`).

---

## Prérequis

- Node.js >= 20
- npm >= 10 (le projet déclare `"packageManager": "npm@10.9.7"`)

---

## Installation

```bash
git clone <url-du-repo>
cd ng-podcast/ng-podcast
npm install
```

---

## Scripts disponibles

| Commande                       | Description                                              |
| ------------------------------ | -------------------------------------------------------- |
| `npm start`                    | Lance le serveur de dev sur `http://localhost:4200`      |
| `npm run build`                | Build de production dans `dist/ng-podcast`               |
| `npm run watch`                | Build incrémental en mode développement                  |
| `npm test`                     | Lance les tests unitaires (Vitest)                       |
| `npm run serve:ssr:ng-podcast` | Sert le build SSR via `dist/ng-podcast/server/server.mjs`|

---

## Configuration

### SCSS

Les partials du design system sont dans `public/styles/`. L'import court
`@use 'styles/variables' as *;` est rendu possible par
`stylePreprocessorOptions.includePaths: ["public"]` dans `angular.json`.

### Thème

`ThemeService` lit/écrit la clé `theme` dans `localStorage` et applique
l'attribut `data-theme="dark" | "light"` sur `<html>`. Tous les accès aux APIs
navigateur sont gardés par `isPlatformBrowser` pour rester compatibles SSR.

### Authentification

`AuthStore` conserve le JWT dans `localStorage` (clé `token`). L'intercepteur
`auth.interceptor.ts` injecte le header `Authorization: Bearer <token>` sur les
requêtes sortantes. Les pages privées sont protégées par `authGuard`.

---

## Conventions de code

- **Composants standalone** uniquement (pas de NgModule).
- **Signals d'abord** : utiliser `signal`, `computed`, `effect` pour l'état
  local. Préférer `inject()` à l'injection par constructeur.
- **NgRx Signals** pour l'état partagé (auth, catalogue, lecture).
- **Lazy loading** systématique pour les pages.
- **Templates** : utiliser `@if` / `@for` (control flow Angular), éviter
  `*ngIf` / `*ngFor`.
- **SSR-safe** : tout accès à `window`, `document`, `localStorage`,
  `AudioContext`... doit être gardé par `isPlatformBrowser(PLATFORM_ID)`.
- **Pas de `console.log`** dans le code commité.
- **Prettier** pour le formatage (`.prettierrc` à la racine).

---

## Tests

Le projet utilise Vitest comme runner.

```bash
npm test
```

Les fichiers de tests suivent la convention `*.spec.ts` et vivent à côté du
code testé. Couverture actuelle : présence de specs sur les composants
principaux et les pages, à étoffer.

---

## Build et déploiement

### Build de production

```bash
npm run build
```

Génère `dist/ng-podcast/` avec deux dossiers :

- `browser/` : les bundles client.
- `server/` : le bundle SSR Express (`server.mjs`).

### Lancer le serveur SSR

```bash
npm run serve:ssr:ng-podcast
```

Le serveur écoute par défaut sur le port défini par la variable d'environnement
`PORT` (sinon `4000`). Il peut être placé derrière un reverse proxy (Nginx,
Caddy) ou containerisé.

### Déploiement statique (sans SSR)

Si le SSR n'est pas requis, il est possible de servir uniquement le contenu de
`dist/ng-podcast/browser/` derrière un serveur statique en activant le fallback
sur `index.html` pour le routing client.

---

## Pistes d'évolution

- Brancher les services `auth.service.ts` et `podcast.service.ts` sur une vraie
  API (les méthodes `onSubmit` des formulaires d'auth contiennent encore des
  `TODO`).
- Internationalisation (`@angular/localize`).
- Upload réel des fichiers audio et des covers (page `create` et `publish`).
- Système de favoris et historique d'écoute persistants.
- Module `writing` et module `storytelling` (placeholders déjà prévus dans
  `app.routes.ts`).
- Pipeline CI (lint + tests + build) et environnements `dev` / `staging` / `prod`.
- Couverture de tests étendue (services, store, guard, intercepteur).

---

## Licence

Projet privé. Tous droits réservés.
