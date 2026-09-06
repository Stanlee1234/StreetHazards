# StreetHazards — Interview Prep

Study guide for talking about the project with judges, teammates, or in a
technical interview. Covers the architecture, the features, and the kind of
on-the-spot coding questions you might get.

Companion docs: `README.md` (start here — what the project is, how to run/deploy it)
and `ARCHITECTURE.md` (deep dive — diagrams, data flows, and a code map with line numbers).

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
├── firestore.rules       # Security rules (guests can create hazards; no client delete;
│                         #   each user owns their /users doc)
├── firebase.json         # Firebase hosting + Firestore config
├── ARCHITECTURE.md       # Deep-dive: diagrams, data flows, code map
└── README.md             # Project overview + deploy steps
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
- Marker **size scales with activeVotes** (agreement), capped at a max radius. Popup has details + "Open in Google Maps".
- A live **onSnapshot** drives the whole UI: markers, the nearby-hazards sidebar, and the leaderboard all re-render from one callback.

### Reporting
- "Report a hazard" opens a panel; clicking the map picks the location.
- Type dropdown + optional details; "Other" reveals a free-text custom type.
- **Guests can report** (rules allow unauthenticated creates until 2026-10-05). Reports carry `reporterId` = Firebase UID if signed in, else a persistent device ID from localStorage.

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
- **19 hazards** positioned by **percentage coordinates** on `art/unsafe-city.png`, so markers stay glued to the art at any screen size.
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
A: Rules are deliberately open for *creating/updating hazards* (so guests can report and vote for the hackathon demo) but time-bound (valid until Oct 5, 2026) and **client deletes are not allowed** in the repo rules. Users can only read/write their **own** `/users/{uid}` doc. Honest caveat: there is no per-device rate limit in the rules yet — the app only uses a device ID for point attribution. We trade strict auth for demo usability and document the tradeoff in `firestore.rules`.

**Q: What would you add next?**
A: (Pick honestly — e.g.) Per-account portfolios are done; next I'd add: hazard photos, admin moderation for resolved-vote abuse, a "my reports" edit/delete, and unit tests. A Firebase Functions moderation queue would close the guest-write loophole in production.

---

## 5. On-the-spot coding questions (drill these in DevTools)

A judge will usually say "open the page, open DevTools, and change X." These seven
drills cover the realistic ones. Each has the exact file:line, the edit, and a
verification loop. Do them against a local server so edits show up instantly.

### DevTools survival kit (know these cold)

1. **Serve the repo and hard-reload.** Open the app (any static server — `python -m http.server`, the Firebase preview, etc.) and reload with **Ctrl+Shift+R** (Cmd+Shift+R on Mac) so you're always running the current files.
2. **Open DevTools:** **F12** or **Ctrl+Shift+I** (Cmd+Opt+I on Mac), or **right-click → Inspect** on the element you care about.
3. **Inspect any UI piece:** right-click a vote button, a marker, or the map → Inspect. The Elements panel shows the live DOM. Note the `id`s you'll search for in the source: `hazard-list`, `nearby-count`, `hazard-filter`, `seed-demo-btn`, `hazard-type`, `report-status`. You can also hit **Ctrl+F** inside the Elements panel to find a node by id.
4. **Find code fast:** DevTools → **Sources** tab → pick `js/game.js` → **Ctrl+F** to jump to a function. For a repo-wide search use **Ctrl+Shift+F**. There is **no build step**: the file in Sources is byte-for-byte what runs, and the line numbers match your editor.
5. **Console reality check:** top-level game functions are callable from the console — `showView('game')`, `resetGame()`, and `state` / `HAZARDS` are readable. But the **map module is an IIFE** (`const mapModule = (() => { … })()`), so its internals (`renderNearby`, `votesRequiredFor`, `applyFilter`, …) are **private and NOT callable from the console**. You test map changes through the UI after a reload.
6. **Network tab** (filter on `firestore`): you'll see the real-time writes when you report or vote — the fastest proof that a change took effect.
7. **The edit → verify loop:** change the line → save → hard-reload → exercise the UI → check the Console has no red errors.
8. **Undo anything you broke:** `git checkout -- js/game.js` restores the committed version (only run it if you don't mind losing your edits).

### Drill 1 — "Make the hazard filter also affect the nearby list."

*What they're checking:* you know filtering happens in one place for markers and that the sidebar renders separately from the module-private `hazards` array.

1. Look at the two functions: `applyFilter()` at **`js/game.js` line 723** only toggles map *markers*. `renderNearby()` at **line 1203** rebuilds the sidebar and ignores the dropdown.
2. Edit `renderNearby()`. Replace:

   ```js
   const sorted = hazards
     .map((h) => ({ ...h, distance: userLocation ? distanceInMeters(userLocation, h) : null }))
   ```

   with:

   ```js
   const filter = nodes.filter.value; // the SAME dropdown applyFilter reads
   const sorted = hazards
     .filter((h) => filter === 'all' || (h.type || '') === filter)
     .map((h) => ({ ...h, distance: userLocation ? distanceInMeters(userLocation, h) : null }))
   ```

3. (Optional polish) update the count line to use `sorted.length` instead of `hazards.length` so "X hazards" reflects the filter too.
4. Save → hard-reload → pick **Potholes** in the dropdown → the Nearby panel now shows only pothole cards.
5. **Trap to mention:** the dropdown *labels* are plural ("Potholes") but the *option values* are singular (`value="Pothole"`, `index.html` line 223) — match on the value, which is also what `data.type` stores.

### Drill 2 — "Add a new hazard to the game (or remove one)."

*What they're checking:* you know where hazards are defined and that the total count is derived, not hardcoded.

1. Open the `HAZARDS` array — **`js/game.js` line 14**, ends at **line 205**. Each entry is:
   `{ id, name, x, y, severity: 'low'|'medium'|'high', points, problem, why }`
   where `x`/`y` are **percentages (0–100)** of the artwork.
2. Add one entry anywhere before the closing `];`:

   ```js
   {
     id: 'exposed-cable',
     name: 'Exposed Cable on the Walkway',
     x: 64,
     y: 58,
     severity: 'medium',
     points: 100,
     problem: 'A cable lies loose right across the walking path.',
     why: 'Someone can trip or snag on it. Cables belong secured and out of the path of travel.'
   },
   ```

3. Pick `x`/`y` that land on a real spot: open `art/unsafe-city.png` beside your editor and estimate the percentage position.
4. **No total to bump:** `state.totalHazards = HAZARDS.length` (**line 215**). Deleting an entry also just works.
5. Verify: save → reload → in the console type `state.totalHazards` (should now be 20), then `showView('game'); resetGame();` and check the HUD shows `0 / 20`. Click your new marker — points and feedback card appear.
6. **Why percentages?** `buildMarkers()` (**line 420**) sets `marker.style.left = hazard.x + '%'` / `top = ...` inside the artwork wrapper, so markers stay glued to the art as it scales. Duplicate `id`s would break clicks (`HAZARDS.find()` returns the first match) — keep ids unique.

### Drill 3 — "Change the vote threshold (e.g. from 3+agreements to 5+)."

*What they're checking:* the threshold is computed in exactly one place.

1. Open `votesRequiredFor(h)` at **`js/game.js` line 732**: `return VOTES_REQUIRED_BASE + (hazard.activeVotes || 0);`
2. The base constant is `VOTES_REQUIRED_BASE = 3` at **line 612**. Change it to 5:

   ```js
   const VOTES_REQUIRED_BASE = 5;
   ```

3. Save → reload. Both consumers use the same function, so nothing else to edit: the sidebar denominator `renderNearby()` (line 1203) and the resolve decision inside the voting transaction (`voteHazardGone`, ~line 1193 — `resolved: next >= votesRequiredFor(data)`).
4. Verify in the UI: a hazard with 2 active agreements now shows **"Vote: gone (x/7)"** instead of "(x/5)".
5. **Fast end-to-end test tip:** temporarily set `VOTES_REQUIRED_BASE = 0`. A hazard with 1 active agreement then needs only 1 "gone" vote to resolve (threshold 1) — you can watch a marker disappear for everyone. Restore to 3 afterward.

### Drill 4 — "Make Play Again reset the game completely."

*What they're checking:* there is one `state` object and Play Again must fully reset it — the trap is creating a second state object or half-resetting.

1. Find the Play Again handler in `wireEvents()` (~**line 1443**). It already does the right thing:

   ```js
   el.buttons.playAgain.addEventListener('click', () => {
     playSound('click');
     el.progressStatus.textContent = '';
     el.progressStatus.classList.remove('secured');
     showView('game');
     resetGame();
   });
   ```

2. `resetGame()` at **line 538** zeroes the single `state` object (`score`, `timeLeft`, `foundIds.clear()`, `wrongClicks`, flags), then calls `buildMarkers()` + `renderHud()` + `startTimer()`.
3. Verify from the console:
   ```js
   showView('game'); resetGame();
   state.score;            // 0
   state.timeLeft;         // 180
   state.foundIds.size;    // 0
   ```
4. **Trap:** never create a second state object. Everything (HUD, progress bar, results) reads `state`, so a duplicate is how screens drift out of sync. If a judge asks "why did the timer keep running?" — `startTimer()` first does `clearInterval(state.timerInterval)`, so double-starting can't stack intervals.

### Drill 5 — "Make the map open on [my city] instead of the whole state / auto-center."

*What they're checking:* you know where the map is created and how locate is wired.

1. `ensureMap()` at **`js/game.js` line 929** creates the map:

   ```js
   map = L.map('map').setView([47.45, -121.9], 8);
   ```

2. Option A — fixed default: change the coordinates (e.g. Seattle: `[47.6062, -122.3321]`, zoom 12).
3. Option B — auto-center on the user: the file already calls `map.locate({ watch: true, enableHighAccuracy: true })` at the end of `ensureMap()` (~line 967), and the `locationfound` handler re-centers on the **first** fix. So a fixed default + locate-on-load is the sensible combo — say that explicitly.
4. Verify: reload → the map opens on the chosen center; grant location (or press **L** / the ◎ button) and it jumps to you.
5. **Sandbox note:** Google's network geolocation returns 403 in restricted previews, so location never fires there — the map still works. Don't be surprised; real browsers get GPS.

### Drill 6 — "Stop a user voting twice (even after a refresh)."

*What they're checking:* they want you to discover this is already handled — and to be honest about its limits.

1. Point at the mechanism: `votedStorageKey()` (**line 749**) returns `streetHazards:voted:<uid-or-guestId>`; `loadVotedHazards()` (**line 756**) hydrates the `votedHazards` Set from localStorage; `voteHazardGone()` (~**line 1174**) returns early if `votedHazards.has(hazardId)`; after a successful transaction the id is added and persisted (line ~1196).
2. Demo the protection: vote once → the button flips to "You voted (x/y)" and disables. Reload → still disabled. 
3. To simulate "another device" so you can keep testing: clear the votes from the console, then reload:
   ```js
   Object.keys(localStorage).filter(k => k.startsWith('streetHazards:voted:')).forEach(k => localStorage.removeItem(k));
   ```
4. If the judge pushes back ("that's client-side — I could clear localStorage"): the honest upgrade is server-side — store `voterIds: []` on each hazard doc and, inside the *existing* transaction, read the doc and `if (voterIds.includes(uid)) return;` before pushing the uid. Rules can't express "array doesn't contain uid" cleanly, so the transaction is the right place.

### Drill 7 — "Show a toast when a report is submitted."

*What they're checking:* you can add UI + wire it into an async success path without breaking the flow.

1. `submitReport()` at **line 1009**. The success path (~lines 1077–1080) ends with:
   ```js
   renderRewards();
   renderPortfolio();
   closeReportPanel();
   nodes.status.textContent = 'Report submitted. Thank you.';
   ```
2. Add a tiny helper at the top level of `js/game.js`:
   ```js
   function showToast(message) {
     let toast = document.getElementById('app-toast');
     if (!toast) {
       toast = document.createElement('div');
       toast.id = 'app-toast';
       document.body.appendChild(toast);
     }
     toast.textContent = message;
     toast.classList.add('show');
     clearTimeout(showToast._timer);
     showToast._timer = setTimeout(() => toast.classList.remove('show'), 2600);
   }
   ```
3. Call it right after `closeReportPanel()` in the success path (inside the `try`, so errors still go to the catch):
   ```js
   showToast('Report submitted. Thank you.');
   ```
4. Add one CSS rule to `css/game.css`:
   ```css
   #app-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
     background: #172033; color: #fff; padding: 10px 18px; border-radius: 999px;
     opacity: 0; pointer-events: none; transition: opacity .25s; z-index: 2000; }
   #app-toast.show { opacity: 1; }
   ```
5. Verify: as a guest, Report a hazard → click the map → pick a type → Submit → the toast pops over the map, a marker appears, and the Network tab shows the Firestore write.
6. **Trap:** `closeReportPanel()` clears `nodes.status`, and the panel is hidden after submit anyway — so the toast (not the status text) is the confirmation the user actually sees.

---

## 6. Gotchas to mention confidently

- **Live rules are still wide open (checked 2026-09-06).** An unauthenticated request can create *and delete* hazard docs in production — the deployed rules are still Firebase's starter `allow read, write` default from the first commit (`firestore.rules`, commit `4ac270b`). The repo's stricter rules (guest create/update until 2026-10-05, **no client delete**, private `/users`) were never deployed. This is how all the demo seed data vanished once — anyone could run the seed page's "Remove demo data" or delete in the console. Fix: `firebase deploy --only firestore`, then the deletion path is closed for good. Demo data has since been re-seeded (~150 demo + 2 real reports).
- **Bug we fixed that you can reference:** `fsServerTimestamp()` was async but never awaited in `submitReport`, so `createdAt` was a Promise and **every report submission was broken** after the team merge. We found it by submitting as a guest and reading the console.
- **Merge story:** Stanley's original map app (`script.js`/`styles.css`) and Jaydon's game-first SPA were merged into one `game.js` map module — voting, place search, nearby sidebar, custom types all ported, dead files deleted. Be ready to explain *why* one merged file beats two (no duplicate state/logic).
- **Deploy:** `firebase deploy --only hosting,firestore`. The repo is always ahead of the live site until someone deploys — a common "why don't I see it" answer.
- **Location in the preview/sandbox** fails (Google geolocation 403) — harmless; real browsers get GPS.
