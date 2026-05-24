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
│   │   ├── guard/auth.guard.ts                Routes protégées (création, édition, « mine »)
│   │   ├── interceptors/auth.interceptor.ts    JWT + déconnexion sur 401 / 403 `/mine`
│   │   └── services/jwt-token-bridge.ts        Sync token navigateur / inject()
│   ├── layout/
│   │   └── header/ , footer/                  Navigation shell
│   └── podcast/
│       ├── auth/                              Landing, login, signup, reset
│       ├── components/
│       │   ├── audio-recorder/               Enregistrement micro (épisodes)
│       │   ├── player/                        Lecteur sticky
│       │   ├── podcast-card/ , podcast-list/
│       │   └── waveform/
│       ├── pages/
│       │   ├── home/ , search/ , detail/
│       │   ├── create/ , publish/            Création podcast + premier épisode
│       │   ├── podcast-edit/               Métadonnées + liste / ajout / publication d’épisodes
│       │   ├── writing/ , storytelling/    Textes & témoignages (listes, détail, création, édition)
│       │   ├── dashboard/                  Vue d’ensemble authentifiée
│       │   ├── my-podcasts/                Podcasts du créateur
│       │   └── ...
│       ├── services/
│       │   ├── auth.service.ts , podcast.service.ts
│       │   ├── writing.service.ts , storytelling.service.ts
│       │   └── audio.ts , theme.service.ts
│       ├── store/
│       │   ├── podcast.store.ts , writing.store.ts , storytelling.store.ts
│       └── podcast.routes.ts
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
  status?: string;      // DRAFT | PUBLISHED
}
```

### Stores (NgRx Signals)

- `PodcastStore` : catalogue (`loadAll`, `loadMine`), détail (`loadOne`), création multipart, patching méta‑données, épisodes (`addEpisode`, `patchEpisode`, `deleteEpisode`), lecture (`play`, `pause`)
- `WritingStore` : textes publiés (`loadPublished`), « les miens », CRUD écritures
- `StorytellingStore` : témoignages / histoires, même philosophie que les écritures

L’**authentification** est gérée par `AuthService` (JWT persisté dans `localStorage`, chargement profil utilisateur). Un `JwtTokenBridge` + `APP_INITIALIZER` hydratent le token avant les premières requêtes HTTP.

---

## Fonctionnalités

- **Podcasts** : flux public (`/podcasts`), détail avec épisodes, création wizard (infos, couverture, premier épisode), page **modifier** (`/podcasts/:id/edit`) : titre / description / statut **et** gestion complète des épisodes (upload, enregistrement micro, publication brouillon / public, suppression), flux « Mes podcasts » protégé
- **Écritures & storytelling** (`/writing`, `/storytelling`) : découverte publique ; création / édition / « mes contenus » derrière connexion
- Lecteur audio persistant avec waveform (`Web Audio` + `AnalyserNode`)
- **JWT** contre l’API Spring Boot (`/auth/login`, intercepteur `Authorization`)
- **Thème** clair / sombre persistant (`ThemeService`)

---

## Routes

Principales entrées :
|--------|------|-------|
| `/` | Landing | Public |
| `/login`, `/signup`, `/resetpassword` | Auth | Public |
| `/dashboard` | Tableau de bord créateur | Authentifié |
| `/podcasts` | Accueil podcasts | Public |
| `/podcasts/:id` | Détail podcast | Public |
| `/podcasts/create` | Créer un podcast (+ 1ᵉ épisode possible) | Authentifié |
| `/podcasts/:id/edit` | Modifier infos **et épisodes audio** | Authentifié |
| `/podcasts/:id/publish` | Assistant publication épisode | Authentifié |
| `/podcasts/mine` | Mes podcasts | Authentifié |
| `/writing`, `/storytelling` (+ sous‑routes liste / détail / create / mine / `:id/edit`) | Textes & histoires | Mixte (voir `writing.routes.ts`, `storytelling.routes.ts`) |
| `/search`, `/profil`, `/settings` | Recherche, profil, paramètres | Selon guard |

Voir `src/app/app.routes.ts` et `features/podcast/podcast.routes.ts` pour la liste exhaustive.

Les routes réservées aux comptes connectés utilisent **`authGuard`** (`features/core/guard/auth.guard.ts`).

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

### Dépendance avec l’API

Le fichier `src/environments/environment*.ts` fixe **`apiUrl`** (ex. `http://127.0.0.1:8080` en développement). L’intercepteur JWT (`JwtAuthInterceptor`) ajoute `Authorization: Bearer …` depuis le stockage après hydratation par `JwtTokenBridge`.

Le backend prévu (`sdk-podcast/mon-api`) expose : podcasts multipart, épisodes, écritures, storytelling et auth JWT. À lancer avant `ng serve` si tu veux un flux bout‑à‑bout.

---

## Conventions de code

- **Composants standalone** uniquement (pas de NgModule).
- **Signals d'abord** : utiliser `signal`, `computed`, `effect` pour l'état
  local. Préférer `inject()` à l'injection par constructeur.
- **NgRx Signals** pour le catalogue podcasts, lectures, témoignages et écritures (stores dédiées).
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

- Rafraîchissement de JWT (refresh token) et gestion centralisée des erreurs 403 métier (`Accès refusé` hors auth)
- Pré‑écoute / édition de métadonnées d’épisode (sans supprimer/ré‑uploader)

---

## Licence

Projet privé. Tous droits réservés.
