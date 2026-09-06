# StreetHazards

**Repository:** https://github.com/Stanlee1234/StreetHazards

StreetHazards is a public-safety web app with two parts sharing one page:

- A **community hazard map** where people can report road hazards, see reports clustered on a Leaflet map, sort them by distance, and vote when a hazard is no longer present.
- A **HazardHunt game** — an interactive "can you spot the hazards?" challenge built on an illustrated city scene.

Both live in the same `index.html` and are served from a single Firebase Hosting site at **https://streethazards.web.app/** (mirrored at https://streethazards.firebaseapp.com/).

## Feature split

The repo now contains two separate experiences that coexist on the same page:

### Community hazard map

- Reports hazards on an interactive **Leaflet** map using OpenStreetMap tiles.
- Stores reports in **Firestore** (`/hazards` collection) and reads them in real time with `onSnapshot`, so every connected client sees new and updated reports instantly.
- Sorts hazards by distance when browser geolocation is available, using a haversine calculation and a live GPS watch.
- Lets signed-in users **report hazards**: choose a preset type (Pothole, Crash, Road block, Other) or enter a custom hazard, optionally add details, and click the map to choose a location.
- Lets signed-in users **vote "not there anymore"**. Each vote increments `notThereVotes` in a Firestore transaction. A hazard is marked `resolved` and removed from the UI when it reaches the required threshold (`votesRequired + activeVotes`), so more active agreement means more votes are needed to remove it.
- Marker size grows with active agreement, capped at a maximum radius.
- Each marker popup links to **Google Maps** for the hazard location.
- Includes a **Nominatim place search** bar (OpenStreetMap, no API key) to jump to restaurants/landmarks.
- Has a **collapsible closest-hazards sidebar**, an auth-gated report form, and a mobile-friendly layout.

Backend: **Firebase** (Hosting + Firestore + Auth/Google). All logic runs in the browser via `js/game.js`; no custom server.

### HazardHunt game

- Illustrated city scene (`art/unsafe-city.png`) with 19 clickable hazard markers positioned by percentage so they stay glued to the artwork at any size.
- 3-minute countdown timer, live score/found/total/accuracy HUD, progress bar, and a results screen with Play Again.
- Each discovered hazard shows a feedback card explaining what's wrong and why it matters, with severity and points.
- Sound cues for finding a hazard, time's up, completion, and UI clicks (files in `sounds/`).
- Purely client-side — no Firebase, no network, no build step.

## Quick start (local)

1. Serve the repo from its root with any static server, for example:

   ```
   python -m http.server
   ```

   Then open `http://localhost:8000`.

2. The **HazardHunt game** works fully offline from that static server — open the page and click Start Hunt.

3. The **community map** loads Leaflet and the Firebase SDKs from CDN, so no install is required to view it. To report hazards or vote, you need to be signed in with Google and the Firebase project must be reachable. Geolocation, place search (Nominatim), and audio also behave best when the page is served over HTTPS or on localhost.

## Firebase project and config

This app uses the Firebase project **streethazards-2a**.

Relevant files:

- `firebase.json` — Hosting config (site name `streethazards`, public root `.`) plus Firestore config pointing at `firestore.rules` and `firestore.indexes.json`.
- `.firebaserc` — sets the default Firebase project to `streethazards-2a` for CLI commands.
- `firestore.rules` — Firestore security rules. Currently scoped to `match /hazards/{hazardId}` with `allow read: if true` and `allow create, update: if request.auth != null && request.time < timestamp.date(2026, 10, 5)`.
- `firestore.indexes.json` — Firestore index config (currently empty; add indexes here if queries need them).
- `js/game.js` — contains the Firebase app config (apiKey, authDomain, projectId, etc.) used to initialize Firebase, Auth, and Firestore in the browser.

If you want to run your own copy against a different Firebase project, you would:

1. Create your own Firebase project and enable Hosting, Firestore, and Google Auth.
2. Replace the `FIREBASE_CONFIG` object in `js/game.js` with your project's web app config.
3. Update `.firebaserc` to point at your project (or use `firebase use`).
4. Deploy with `firebase deploy --only hosting,firestore`.

## Deployment

The live site is deployed to **Firebase Hosting**.

To deploy (requires the Firebase CLI and access to the `streethazards-2a` project):

```
firebase login
firebase deploy --only hosting,firestore
```

What gets deployed:

- Hosting: everything in the repo root (`index.html`, `about.html`, `404.html`, `css/`, `js/`, `art/`, `sounds/`, `favicon.svg`, etc.) except files matching the `ignore` rules in `firebase.json` (`firebase.json` itself, dotfiles, `node_modules/`).
- Firestore: the rules from `firestore.rules` and indexes from `firestore.indexes.json`.

The default 404 page (`404.html`) is a standard Firebase-generated "Page Not Found" page and is served automatically for unknown URLs.

**Important:** the current Firestore rules include a time-bound window that expires on **2026-10-05**. After that date, create/update operations would be denied until the rules are updated. Make sure to refresh the rules before then.

## Repo structure

```
StreetHazards/
├── index.html                 # main page: start screen, game, results, community map, report form
├── about.html                 # simple project overview page
├── 404.html                   # custom Firebase Hosting 404 page
├── README.md                  # this file
├── favicon.svg                # site icon
├── css/
│   └── game.css               # styles for the whole HazardHunt experience + shared UI
├── js/
│   └── game.js                # HazardHunt game state + logic (score, timer, hazards, sounds, map integration)
├── art/
│   └── unsafe-city.png        # illustrated game artwork
├── sounds/
│   ├── hazard-found.mp3       # sound when a hazard is discovered
│   ├── warning.mp3            # sound when time runs out
│   ├── complete.mp3           # sound when all hazards are found
│   └── click.mp3              # UI interaction sound
├── firebase.json              # Firebase Hosting + Firestore config
├── .firebaserc                # default Firebase project (streethazards-2a)
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore index config
├── firebase.json              # (also under root, hosting/firestore config)
└── .gitignore                 # ignores logs, Firebase cache, node_modules, env files, etc.
```

## Development notes

- The page is a single-page app — views are shown/hidden with CSS rather than separate routes.
- The community map and the game both live in `js/game.js` (a single map module owns the Leaflet map, voting, reporting, place search, rewards, and portfolio) with styles in `css/game.css`. `index.html` pulls in that one script.
- The Firebase SDKs (app, auth, firestore, analytics) and Leaflet are loaded from CDN; no build step or bundler needed.
- Sound playback depends on browser autoplay policies; the game guards audio calls so a blocked playback doesn't crash the game.
