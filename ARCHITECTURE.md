# StreetHazards — Architecture

A deep-dive companion to `README.md` (what it is, how to run/deploy) and
`INTERVIEW_PREP.md` (how to talk about it). This file answers *how the pieces
fit together*: the runtime topology, the data model, the code map, the
end-to-end flows, and the security model.

---

## 1. Big picture

StreetHazards is a **serverless single-page app**. There is no backend code,
no database server, and no build step — everything is static files on Firebase
Hosting, and all logic runs in the browser. The "backend" is Firebase services
(Firestore + Auth) called directly from the page over HTTPS.

Two experiences share one page:

1. **Community hazard map** — collaborative, live: anyone reports hazards,
   votes "it's gone", and the map/leaderboard update in real time for every
   open client from Firestore.
2. **HazardHunt game** — solo, timed, fully client-side: spot hazards in an
   illustrated city scene. Its state never leaves the browser.

```
┌──────────────────────── Browser ──────────────────────────┐
│  index.html  (one SPA, CSS in css/game.css, JS in js/game.js) │
│                                                             │
│   game engine (top-level)        map module (IIFE, private)  │
│   state · HAZARDS · timer        map · hazards[] · votes     │
│   sound · feedback cards         Firestore writes · auth     │
│                                                             │
│   CDN: Leaflet (OpenStreetMap tiles) · Firebase JS SDK 10.8 │
└──────────────┬──────────────────────────────────────────────┘
               │  HTTPS (REST/WebSocket)
               ▼
┌──────────────────────── Firebase ──────────────────────────┐
│  project: streethazards-2a                                   │
│  Hosting   — serves index.html, css/, js/, art/, sounds/     │
│  Firestore — /hazards (all reports) · /users/{uid} (profiles)│
│  Auth      — Google sign-in (popup → redirect fallback)      │
└─────────────────────────────────────────────────────────────┘
```

External services used by the page: **OpenStreetMap tiles** (Leaflet),
**Nominatim** (place search, no API key), and **Google Maps deep links**
("Open in Google Maps" in marker popups).

---

## 2. Where state lives

There are exactly two state domains, deliberately isolated:

| Domain | Owned by | Lives in | Example |
|---|---|---|---|
| Game | top-level `const state` (`js/game.js:215`) | browser memory | `score`, `timeLeft`, `foundIds` |
| Map | `mapModule` IIFE (`js/game.js:585`+) | browser memory **+ Firestore** | `map`, `hazards[]`, `votedHazards`, `authUser` |
| Account (signed in) | Firestore `/users/{uid}` | Firestore | `points`, `reports`, `badge` |
| Guest account | `localStorage` | browser | `guestId`, guest points, votes |

The single source of truth principle: game UI renders only from `state`
(score/timer/found all derive from it), and account UI renders only from
`currentStats()` (`js/game.js:648`), which returns the Firestore user doc when
signed in and localStorage otherwise. Two render paths can never disagree.

Why the map module is an **IIFE**: its internals (`hazards`, `userLocation`,
`votedHazards`, `renderNearby`, …) are function-scoped and cannot collide with
game globals — this is the fix for the "two scripts fought over the same
page" merge problem (see §6).

---

## 3. Data model (Firestore)

```
/hazards/{autoId}                      created by anyone (guest or signed-in)
  type            string   "Pothole" | "Crash" | "Road block" |
                           "Broken streetlight" | "Flood" | "Other"/custom
  details         string   optional free text
  lat, lng        number   report location
  activeVotes     number   "still there" agreements (marker size scales with it)
  notThereVotes   number   "gone" votes
  resolved        boolean  true → hidden from map/list/leaderboard for everyone
  demo            boolean  true for seeded demo data (removable via seed page)
  reporterId      string   Firebase UID if signed in, else device ID (guest)
  reporterName    string   display name or "Guest"/demo reporter
  createdAt       timestamp

/users/{uid}                          only the signed-in owner can read/write
  name, points, reports, badge, lastReportAt
```

Vote threshold: a hazard is marked `resolved` when
`notThereVotes >= 3 + activeVotes` — computed in one place,
`votesRequiredFor()` (`js/game.js:732`). More confirmed agreements means more
"gone" votes are required, so a lone user cannot delete a real hazard.

---

## 4. Code map of `js/game.js` (~1,530 lines, one file)

| Lines | Symbol | Responsibility |
|---|---|---|
| 14–205 | `HAZARDS` | 19 game hazards: `{id, name, x, y, severity, points, problem, why}`; x/y are **% of the artwork** so markers scale |
| 207 | `GAME_DURATION_SECONDS` | 180 |
| 215 | `state` | single game source of truth (`totalHazards: HAZARDS.length`) |
| 222–260 | `el` | cached DOM handles (views, HUD, buttons) |
| 276–310 | `initSounds`/`playSound` | guarded audio (`sounds/*.mp3`); blocked autoplay never crashes |
| 311–365 | `showView`/`activateView`/`viewFromHash`/`handleRouteChange` | hash router (`#map #start #game #results`) + Back/Forward; resume-paused-game logic |
| 384–418 | `renderHud` + helpers | HUD, progress bar, accuracy |
| 420–460 | `buildMarkers`/`showFeedbackCard` | spawns game markers at `x%`/`y%`, feedback cards |
| 506–537 | `startTimer`/`endGame` | countdown → time-up/complete flow |
| 538–554 | `resetGame` | zeroes `state`, rebuilds markers, restarts timer |
| 585+ | `mapModule` IIFE | everything below is private to it |
| 603 | `guestId` | persistent device ID (`localStorage`) for guests |
| 612 | `VOTES_REQUIRED_BASE` | 3 — the "+3" in the vote threshold |
| 648 | `currentStats` | points source of truth (Firestore vs localStorage) |
| 660 | `renderRewards` | badge/points panel |
| 692 | `renderLeaderboard` | aggregates reports per identity |
| 723 | `applyFilter` | toggles marker visibility from the dropdown (map only) |
| 732 | `votesRequiredFor` | `3 + activeVotes` — the one threshold function |
| 749–756 | `votedStorageKey`/`loadVotedHazards` | per-identity vote memory |
| 762 | `addHazardMarker` | red circleMarker, size ∝ activeVotes, Google Maps popup |
| 786 | `FIREBASE_CONFIG` | project `streethazards-2a` web config |
| 799–851 | `initFirebase`/`initAuth` | lazy Firebase SDK import + Google auth (popup/redirect) |
| 929–968 | `ensureMap` | Leaflet map creation, WA default view, GPS locate/watch |
| 1009 | `submitReport` | guest or signed-in report → `addDoc` (+ user-doc points tx if signed in) |
| 1121 | `seedDemoData` | ~50 demo hazards per click, clustered + WA-wide scatter |
| 1173 | `voteHazardGone` | Firestore **transaction**: increment, threshold check, resolve |
| 1203 | `renderNearby` | top-12 closest hazards with vote buttons (haversine) |
| 1274 | `watchHazards` | `onSnapshot` on `/hazards` → re-renders markers/list/leaderboard |
| 1516 | `init` | boot: sounds → events → markers → route → `mapModule.activate()` |

---

## 5. End-to-end flows

### 5.1 Page load
`init()` (line 1516) → `initSounds()`, `wireEvents()`, `renderHud()`,
`buildMarkers()` → `activateView(viewFromHash())` (map-first; honors deep links
like `#game`) → `mapModule.activate()`: `ensureMap()` creates the Leaflet map,
then `watchHazards()` opens the Firestore `onSnapshot`. Every hazard doc is
turned into a marker, a sidebar entry, and a leaderboard row — in one callback,
so any later change re-renders all three.

### 5.2 Report a hazard (guest path)
"Report a hazard" → panel opens → click the map to pick lat/lng →
`submitReport()` → `addDoc('/hazards', {…, createdAt: await serverTimestamp()})`
→ guest points incremented in localStorage → `closeReportPanel()`.
Firestore's `onSnapshot` fires on every other open map: the new marker,
sidebar entry, and leaderboard row appear for everyone without a refresh.
Signed-in reporters instead run a transaction that bumps their `/users/{uid}`
doc (`points +100`, `reports +1`).

### 5.3 Vote "not there anymore"
`voteHazardGone()` runs a `runTransaction`: read the doc → if already
`resolved`, no-op → `notThereVotes + 1` → `resolved = next >= votesRequiredFor(doc)`
→ commit. The voter's id is added to the localStorage `votedHazards` set so the
button disables ("You voted (x/y)"). When `resolved` flips true, the
`onSnapshot` callback drops the hazard from map, sidebar, and leaderboard for
everyone simultaneously.

### 5.4 Guest → account merge
Sign-in listener (`initAuth`) → the guest's localStorage points are written
into `/users/{uid}` (Firestore) → the guest keys clear → `renderAuthState()`
swaps the UI to account mode. `currentStats()` then returns the Firestore doc,
so points survive across devices.

### 5.5 Gameplay
CTA → `showView('start')` → Start Hunt → `resetGame()` + `startTimer()`.
A click on the artwork hits `handleMarkerClick`/`handleMissClick`: found ids go
into `state.foundIds` (no double scoring), score/accuracy/HUD re-render, sound
plays. **Exit to Map** pauses (`state.running = false`, interval cleared);
returning via the CTA shows "▶ Resume Hunt" and resumes at the exact second.
Timer zero → `endGame('time-up')`; all found → `endGame('complete')` →
results screen → Play Again → `resetGame()`.

---

## 6. Security model

Repo rules (`firestore.rules`) — the intended policy:

| Path | Rule | Why |
|---|---|---|
| `/hazards/{id}` | `read: true` | anyone may view the map |
| `/hazards/{id}` | `create, update: request.time < 2026-10-05` | guests can report/vote (demo); time-boxed |
| `/hazards/{id}` | **no `delete`** | a resolved vote is an update, never a deletion |
| `/users/{userId}` | `read, write: auth != null && auth.uid == userId` (writes also time-boxed) | each account owns exactly its own portfolio |

> ⚠️ **Deployment gap (checked 2026-09-06):** the *live* Firestore still runs
> the original starter rule from the first commit — `allow read, write` for
> everyone, **including delete** — because `firestore deploy --only firestore`
> has not been run. An unauthenticated request can create or delete any hazard
> doc today. That is how all the demo seed data was wiped once. Until the repo
> rules are deployed, treat demo data as ephemeral.

Known trade-offs, stated honestly: no per-device rate limit in the rules; vote
memory is client-side (localStorage) so clearing it re-enables voting — the
server-side upgrade is recording voter uids on the doc inside the existing
transaction.

---

## 7. Deployment & local dev

- **Hosting:** `firebase.json` → `public: "."`, so the repo root is the site.
  `firebase deploy --only hosting` ships `index.html`, `css/`, `js/`, `art/`,
  `sounds/`, `about.html`, `404.html`, etc.
- **Rules/indexes:** `firebase deploy --only firestore`.
- **Everything:** `firebase login` then `firebase deploy --only hosting,firestore`
  (project default `streethazards-2a` per `.firebaserc`).
- **Local:** any static server from the repo root works (e.g. `python -m http.server`).
  No dependencies to install; Leaflet + Firebase load from CDN.
- Because there is no build step, **the repo and the live site can diverge**:
  code pushed to `main` only reaches `streethazards.web.app` when someone deploys.

---

## 8. Docs index

| File | Purpose | Read when |
|---|---|---|
| `README.md` | overview, features, quick start, deploy steps | first time in the repo |
| `ARCHITECTURE.md` (this file) | topology, data model, code map, flows, security | before changing code |
| `INTERVIEW_PREP.md` | judge Q&A + DevTools live-coding drills | before demoing/pitching |
| `firestore.rules` | the intended security policy (self-documenting comments) | before touching data access |
