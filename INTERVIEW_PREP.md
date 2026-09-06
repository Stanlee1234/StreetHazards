# StreetHazards — Interview Prep

Study guide for talking about the project with judges, teammates, or in a
technical interview. Covers the architecture, the features, and the kind of
on-the-spot coding questions you might get.

---

## 1. The 30-second pitch

> StreetHazards is a community public-safety platform. Two experiences in one
> app: (1) a **HazardHunt game** where you spot safety hazards in an illustrated
> city scene before a 3-minute timer runs out, and (2) a **live community map**
> where anyone can report real road hazards, vote "it's gone" on stale reports,
> and earn points/leaderboard standing. The map updates in real time for every
> user from Firestore, and the whole thing is one single-page app with no
> frameworks — vanilla HTML/CSS/JS.

---

## 2. Architecture (know this cold)

```
StreetHazards/
├── index.html        # The entire SPA: start screen, game, map, report form, portfolio
├── css/game.css      # The one stylesheet for the whole app
├── js/game.js        # The one script: game engine + map module + auth + Firestore
├── about.html        # FAQ / about page
├── seed.html         # Dev-only bulk-seed page (in-app seed button is the main path now)
├── art/unsafe-city.png   # The illustrated game board
├── sounds/*.mp3          # hazard-found, warning, complete, click
├── firestore.rules       # Security rules (guests can create hazards; users own their /users doc)
└── firebase.json         # Firebase hosting + Firestore config
```

**Key architectural decisions to defend:**

| Decision | Why |
|---|---|
| No frameworks — vanilla JS | Zero build step, deploys straight to Firebase Hosting, easy for a small team to reason about. Leaflet is the only real library (map tiles). |
| Single `game.js` with modules | One source of truth for score/timer/hazards; the map module is an IIFE so its state (`hazards`, `userLocation`, votes) stays private and doesn't collide with game state. |
| Firestore real-time listener | `onSnapshot` on the `hazards` collection means every open map updates instantly when anyone reports or votes — no polling, no refresh. |
| Map-first home | The community map is the landing view (`#map`); the game is a CTA ("Play HazardHunt") reachable from the toolbar. Views switch via hash routing (`#map`, `#start`, `#game`, `#results`) with `history.pushState`, so browser Back/Forward works. |
| Firestore rules over Firebase Auth-only | Guests can report (needed for hackathon demo), but each user's `/users/{uid}` portfolio doc is private to them. Points merge from guest localStorage into the account on sign-in. |

---

## 3. Feature-by-feature (how it works + likely follow-up questions)

### The map
- Leaflet + OpenStreetMap tiles. Default view: Washington state (47.45, -121.9, zoom 8).
- `map.locate({ watch: true })` on load → a pulsing GPS marker + accuracy circle; also auto-centers the first time. Press **L** or the **◎** button to re-center anytime.
- Markers come from Firestore docs: `{type, details, lat, lng, activeVotes, notThereVotes, resolved, reporterId, createdAt}`.
- Marker **size scales with activeVotes** (agreement), capped at 24. Popup has details + "Open in Google Maps".

### Reporting
- "Report a hazard" opens a panel; clicking the map picks the location.
- Type dropdown + optional details; "Other" reveals a free-text custom type.
- **Guests can report** (rules allow unauthenticated creates). Reports carry `reporterId` = Firebase UID if signed in, else a persistent device ID from localStorage.

### Voting ("is it gone?")
- Every hazard's sidebar entry has **Vote: gone (x/y)**.
- Threshold is dynamic: `3 + activeVotes`. A hazard that many people confirmed exists needs more "it's gone" votes to be removed — prevents one person deleting a real hazard.
- Vote runs a **Firestore transaction** (read → increment → check threshold → optionally set `resolved`), so two people voting at once can't double-count.
- When `resolved`, the hazard disappears from the map, nearby list, and leaderboard for everyone, instantly.
- Votes are remembered per identity (account or guest ID) so you can't vote twice; button shows "You voted (x/y)" and disables.

### Nearby hazards sidebar
- Sorts hazards by **haversine distance** from your GPS position; top 12 shown with vote buttons.
- Collapsible (`‹` toggle), preference persisted in localStorage.

### Accounts / points
- Google sign-in (popup with redirect fallback).
- Signed in: points/reports/badges live in `/users/{uid}` (Firestore), portfolio shows your reports.
- Guest: points in localStorage; on sign-in they **merge into the account** and localStorage clears.
- Leaderboard aggregates reports per identity.

### The game (HazardHunt)
- 15 hazards positioned by **percentage coordinates** on `art/unsafe-city.png`, so markers stay glued to the art at any screen size.
- 3-minute countdown; found hazards can't be scored twice; wrong clicks only note "No hazard detected."
- Sound effects guarded by try/catch so blocked autoplay never crashes.
- Exiting to the map **pauses** the hunt (timer freezes); the CTA shows "▶ Resume Hunt" and resumes at the exact second.

---

## 4. Likely interview questions (with answers)

**Q: What does the Firestore data model look like?**
A: One `hazards` collection: `{type, details, lat, lng, activeVotes, notThereVotes, resolved, reporterId, reporterName, createdAt}`. One `users` collection keyed by UID: `{name, points, reports, badge, lastReportAt}`. Guests never touch `users`; their state is localStorage.

**Q: How does the real-time update work?**
A: `onSnapshot` subscribes to the `hazards` collection. Firestore pushes document changes over a persistent WebSocket channel; the callback re-renders markers, nearby list, and leaderboard. That's why a vote by one user updates every viewer.

**Q: Why a transaction for voting instead of a simple increment?**
A: `update({ notThereVotes: increment(1) })` alone can't check the threshold atomically. The transaction reads the doc, computes the new count, and sets `resolved` in the same atomic step — two concurrent voters can't both read "2/3" and both resolve.

**Q: What's the single source of truth for points?**
A: `currentStats()`: if `authUser && userDoc` → the Firestore doc; else guest localStorage. Rendering always calls this one function, so the reward panel, portfolio, and leaderboard can't disagree.

**Q: How is the game different from the map?**
A: The game is a self-contained timed interaction on static artwork (client-only state). The map is a live collaborative database. They share one page/stylesheet/script but have independent state — the map module is an IIFE precisely so its state can't leak into the game.

**Q: How do you prevent double-scoring in the game?**
A: Each hazard has a `found` flag in the single game state object; the click handler checks `if (h.found) return` before scoring, and found markers are re-rendered to a disabled checkmark state.

**Q: Security — anyone can write to your DB?**
A: Rules are deliberately open for *creating hazards* (so the hackathon demo works for guests) but time-bound (valid until Oct 5, 2026) and rate-limited per device. Users can only read/write their **own** `/users/{uid}` doc. We trade strict auth for demo usability and document the tradeoff in `firestore.rules`.

**Q: What would you add next?**
A: (Pick honestly — e.g.) Per-account portfolios are done; next I'd add: hazard photos, admin moderation for resolved-vote abuse, a "my reports" edit/delete, and unit tests. A Firebase Functions moderation queue would close the guest-write loophole in production.

---

## 5. On-the-spot coding questions (practice these)

These are the shape of "change some code live" tasks. Know where each lives.

1. **"Make the hazard filter also affect the nearby list."**
   → `js/game.js`, `renderNearby()` — it reads the module-private `hazards` array. Read `filter` value (`nodes.filter.value`) and filter `sorted` the same way `applyFilter` does for markers.

2. **"Add a new hazard type to the game."**
   → The `HAZARDS` array at the top of `js/game.js` (each entry: `{id, name, problem, why, severity, points, x, y}`). Add one, position `x`/`y` as percentages of the artwork, update the total count constant (`TOTAL_HAZARDS` or wherever it's derived) if it's hardcoded.

3. **"Change the vote threshold from 3+activeVotes to something else."**
   → `votesRequiredFor(h)` in the map module — it's the single place computing the threshold; change the formula and both the sidebar and resolution logic follow.

4. **"Reset the game completely when Play Again is hit."**
   → `resetGame()` — resets the single `state` object (score, timer, found set, wrong clicks) and re-renders HUD. Don't create a second state object; that's the trap.

5. **"Make the map default to the user's city."**
   → `ensureMap()`: `map = L.map('map').setView([47.45, -121.9], 8)` — change the initial coordinates, or call `map.locate({ setView: true })` earlier.

6. **"Prevent a guest from voting twice by refreshing."**
   → Already handled: `votedHazards` Set + `localStorage` keyed by identity (`votedStorageKey()`). Point at it; add a test by clearing localStorage.

7. **"Show a toast when a report is submitted."**
   → `submitReport()` success path — after "Report submitted. Thank you." status text, add a transient banner. There's already a `seed-status` element pattern to imitate.

---

## 6. Gotchas to mention confidently

- **Bug we fixed that you can reference:** `fsServerTimestamp()` was async but never awaited in `submitReport`, so `createdAt` was a Promise and **every report submission was broken** after the team merge. We found it by submitting as a guest and reading the console.
- **Merge story:** Stanley's original map app (`script.js`/`styles.css`) and Jaydon's game-first SPA were merged into one `game.js` map module — voting, place search, nearby sidebar, custom types all ported, dead files deleted. Be ready to explain *why* one merged file beats two (no duplicate state/logic).
- **Deploy:** `firebase deploy --only hosting,firestore`. The repo is always ahead of the live site until someone deploys — a common "why don't I see it" answer.
- **Location in the preview/sandbox** fails (Google geolocation 403) — harmless; real browsers get GPS.