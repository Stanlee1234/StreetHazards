# StreetHazards

StreetHazards is a community map for reporting road problems and checking what is happening nearby. Reports appear on the map and in the closest-hazards sidebar, so people can quickly see issues in their area before they get there.

## What it does

- Shows reported hazards on an interactive Leaflet map.
- Sorts hazards by distance when location access is available.
- Lets signed-in users report preset or custom hazards.
- Lets users vote when a hazard is no longer present.
- Removes a hazard after enough people vote that it is gone. More active agreement means more removal votes are required.
- Shows active agreement counts and keeps marker sizes within a reasonable limit.
- Opens a hazard location in Google Maps from its map popup.
- Supports a collapsible hazard sidebar and a mobile-friendly layout.

## HazardHunt game

The main page also runs the HazardHunt hazard-spotting game: an illustrated city scene (`art/unsafe-city.png`) with clickable hazard markers, a 3-minute timer, live score/found/accuracy HUD, progress bar, sound cues, and a results screen with Play Again.

## Files

- `index.html` — single-page app: start screen, game view, results screen, community map, report form.
- `css/game.css` — cohesive stylesheet for the whole experience.
- `js/game.js` — single source of truth (score, timer, discovered hazards, accuracy, game-over) plus the preserved community-map logic.
- `art/unsafe-city.png` — the illustrated game artwork.
- `sounds/*.mp3` — game sound cues.
- `about.html` — simple project overview page.
- `favicon.svg` — site icon.

## Development

- Start locally: `python -m http.server` (or any static server) from the repo root.
- The map uses Leaflet (loaded from CDN) and Firebase (loaded lazily only when the map view is opened).
