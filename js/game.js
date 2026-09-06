/* =====================================================
   HAZARDHUNT — game.js
   Single source of truth for: score, timer, discovered
   hazards, accuracy, and game-over state.
   ===================================================== */

'use strict';

/* ---------------- Hazard definitions ----------------
   Positions are percentages of the artwork box so the
   markers stay glued to their spots at any size.
   Coordinates were surveyed directly on the artwork. */

const HAZARDS = [
  {
    id: 'unsafe-scaffolding',
    name: 'Unsafe Construction Area',
    x: 23.9,
    y: 25.2,
    severity: 'high',
    points: 150,
    problem: 'Scaffolding sits loose over the walkway with no barrier below.',
    why: 'Loose scaffolding can drop tools or debris onto people passing underneath. A secured zone or covered walkway keeps pedestrians clear.'
  },
  {
    id: 'unsafe-storefront-sign',
    name: 'Improperly Placed Equipment',
    x: 82.9,
    y: 32.9,
    severity: 'low',
    points: 75,
    problem: 'Equipment and signage spill off the building into the street zone.',
    why: 'Items hung or placed where people walk can fall or block sightlines. Fixtures belong secured and out of the path of travel.'
  },
  {
    id: 'pothole',
    name: 'Pothole',
    x: 51.2,
    y: 47.8,
    severity: 'medium',
    points: 100,
    problem: 'A deep pothole has opened up in the roadway.',
    why: 'Potholes damage vehicles and buckle cyclists who hit them unexpectedly. Reporting them early prevents crashes and worse wear.'
  },
  {
    id: 'blocked-emergency-exit',
    name: 'Blocked Emergency Exit',
    x: 85.4,
    y: 52.4,
    severity: 'high',
    points: 150,
    problem: 'The storefront exit is blocked and hard to reach.',
    why: 'An obstructed exit can turn a quick evacuation into a trap. Exits must stay clear at all times — this one needs attention now.'
  },
  {
    id: 'road-debris',
    name: 'Vehicle/Pedestrian Conflict',
    x: 36.8,
    y: 54.1,
    severity: 'high',
    points: 150,
    problem: 'Traffic weaves around hazards with pedestrians nearby.',
    why: 'When obstacles force cars and people into the same space, the margin for error disappears. Clear roads keep everyone predictable.'
  },
  {
    id: 'worn-crosswalk',
    name: 'Unsafe Pedestrian Crossing',
    x: 52.9,
    y: 65.6,
    severity: 'high',
    points: 150,
    problem: 'The crosswalk stripes are faded and barely visible.',
    why: 'Worn markings give drivers no visual cue to yield. Fresh, visible crosswalks are proven to reduce pedestrian collisions.'
  },
  {
    id: 'fire-hydrant-blocked',
    name: 'Blocked Fire Hydrant',
    x: 16,
    y: 67.7,
    severity: 'medium',
    points: 100,
    problem: 'Clutter surrounds the hydrant, delaying emergency access.',
    why: 'Fire crews need seconds, not minutes. Anything blocking a hydrant slows hose connections when every moment counts.'
  },
  {
    id: 'fallen-barrier',
    name: 'Fallen Construction Barrier',
    x: 25.5,
    y: 78.4,
    severity: 'medium',
    points: 100,
    problem: 'A traffic barrier has tipped over near the work zone.',
    why: 'Barriers exist to steer people away from danger. A knocked-down one silently invites pedestrians into the hazard it was meant to block.'
  },
  {
    id: 'damaged-warning-sign',
    name: 'Damaged Warning Sign',
    x: 9.8,
    y: 23,
    severity: 'medium',
    points: 100,
    problem: 'The street sign is bent and barely readable.',
    why: 'Drivers and pedestrians rely on clear signage. A damaged sign hides important information and can lead to unsafe crossings or turns.'
  },
  {
    id: 'distracted-pedestrian',
    name: 'Distracted Pedestrian',
    x: 32.9,
    y: 26,
    severity: 'medium',
    points: 100,
    problem: 'A pedestrian steps into the street while looking away.',
    why: 'Distraction near traffic is one of the most common causes of urban collisions. Staying alert at the curb keeps both walkers and drivers safe.'
  },
  {
    id: 'obstructed-accessibility-path',
    name: 'Obstructed Accessibility Path',
    x: 75.6,
    y: 27,
    severity: 'medium',
    points: 100,
    problem: 'Objects left on the sidewalk block the clear path of travel.',
    why: 'Sidewalks must stay passable for wheelchairs, strollers, and pedestrians. Even a partial blockage can force someone into the road.'
  },
  {
    id: 'overflowing-litter',
    name: 'Trip Hazard',
    x: 28,
    y: 46,
    severity: 'low',
    points: 75,
    problem: 'Debris and waste spill across the walking surface.',
    why: 'Loose litter and uneven clutter are easy trips, especially in low light. Clean walkways prevent avoidable falls.'
  },
  {
    id: 'open-manhole',
    name: 'Open Manhole',
    x: 46.3,
    y: 63,
    severity: 'high',
    points: 150,
    problem: 'A manhole cover is missing, leaving an open shaft.',
    why: 'An open manhole is a serious fall and injury risk — especially at dusk when it blends into the pavement. It should be barricaded and reported immediately.'
  },
  {
    id: 'standing-water',
    name: 'Unsafe Puddle / Flooded Area',
    x: 26.8,
    y: 62,
    severity: 'low',
    points: 75,
    problem: 'Standing water pools across the walkway.',
    why: 'Flooded patches hide uneven pavement, become slippery, and can hide electrical hazards. They deserve a report just like any other obstacle.'
  },
  {
    id: 'traffic-cone',
    name: 'Misplaced Traffic Cone',
    x: 53.6,
    y: 73,
    severity: 'low',
    points: 75,
    problem: 'A cone sits in the middle of the roadway instead of marking a work zone.',
    why: 'A cone floating in live traffic confuses drivers and does nothing to protect workers. Equipment must mark real hazards, not block lanes.'
  },
  {
    id: 'low-visibility-road',
    name: 'Poor Visibility Area',
    x: 41.4,
    y: 40,
    severity: 'medium',
    points: 100,
    problem: 'Dim lighting and shadows swallow this stretch of road.',
    why: 'Drivers and pedestrians cannot react to what they cannot see. Poor visibility zones need better lighting before someone gets hurt.'
  },
  {
    id: 'dark-alley',
    name: 'Unlit Street Corner',
    x: 84.1,
    y: 74,
    severity: 'medium',
    points: 100,
    problem: 'The corner ahead is dark with no lighting.',
    why: 'Unlit corners hide pedestrians and hazards alike. Good street lighting is one of the cheapest safety upgrades a city can make.'
  },
  {
    id: 'blocked-emergency-access',
    name: 'Blocked Emergency Vehicle Access',
    x: 85.3,
    y: 86,
    severity: 'high',
    points: 150,
    problem: 'A cone and clutter narrow the curb where trucks must reach.',
    why: 'Fire trucks and ambulances need the full curb line. Blocked access routes cost critical minutes in an emergency.'
  },
  {
    id: 'garbage-fire-risk',
    name: 'Waste Blocking Exit Route',
    x: 93.9,
    y: 64,
    severity: 'medium',
    points: 100,
    problem: 'Waste is stacked against the building exit route.',
    why: 'Burning or blocking exits with stored waste endangers everyone inside. Keep exit routes clear and report build-ups early.'
  }
];

const GAME_DURATION_SECONDS = 180;

/* ---------------- State (single source of truth) ---------------- */

const state = {
  score: 0,
  timeLeft: GAME_DURATION_SECONDS,
  totalHazards: HAZARDS.length,
  foundIds: new Set(),
  wrongClicks: 0,
  gameOver: false,
  running: false,
  timerInterval: null
};

/* ---------------- DOM ---------------- */

const el = {
  views: {
    start: document.getElementById('start-view'),
    game: document.getElementById('game-view'),
    results: document.getElementById('results-view'),
    map: document.getElementById('map-view')
  },
  hud: {
    timer: document.getElementById('hud-timer'),
    score: document.getElementById('hud-score'),
    found: document.getElementById('hud-found'),
    total: document.getElementById('hud-total'),
    accuracy: document.getElementById('hud-accuracy')
  },
  artwork: document.getElementById('artwork'),
  progressCount: document.getElementById('progress-count'),
  progressFill: document.getElementById('progress-fill'),
  progressStatus: document.getElementById('progress-status'),
  results: {
    badge: document.getElementById('results-badge'),
    title: document.getElementById('results-title'),
    sub: document.getElementById('results-sub'),
    found: document.getElementById('results-found'),
    score: document.getElementById('results-score'),
    accuracy: document.getElementById('results-accuracy')
  },
  buttons: {
    start: document.getElementById('start-hunt-btn'),
    restart: document.getElementById('restart-btn'),
    how: document.getElementById('how-btn'),
    playAgain: document.getElementById('play-again-btn'),
    resultsMap: document.getElementById('results-map-btn'),
    mapBack: document.getElementById('map-back-btn')
  }
};

/* ---------------- Sound system ----------------
   Every play call is wrapped so a blocked or missing
   audio file can never crash the game. */

const SOUND_FILES = {
  found: 'sounds/hazard-found.mp3',
  warning: 'sounds/warning.mp3',
  complete: 'sounds/complete.mp3',
  click: 'sounds/click.mp3'
};

const sounds = {};

function initSounds() {
  for (const [key, src] of Object.entries(SOUND_FILES)) {
    try {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.addEventListener('error', () => { sounds[key] = null; });
      sounds[key] = audio;
    } catch {
      sounds[key] = null;
    }
  }
}

function playSound(key) {
  const audio = sounds[key];
  if (!audio) return;
  try {
    audio.currentTime = 0;
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => { /* autoplay blocked — fail silently */ });
    }
  } catch {
    /* audio unavailable — fail silently */
  }
}

/* ---------------- Screen router ---------------- */

function showView(name) {
  for (const [key, node] of Object.entries(el.views)) {
    node.classList.toggle('active', key === name);
  }
}

/* ---------------- Rendering ---------------- */

function formatTime(totalSeconds) {
  const m = String(Math.floor(Math.max(0, totalSeconds) / 60)).padStart(2, '0');
  const s = String(Math.max(0, totalSeconds) % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function accuracyPercent() {
  const clicks = state.foundIds.size + state.wrongClicks;
  return clicks === 0 ? null : Math.round((state.foundIds.size / clicks) * 100);
}

function renderHud() {
  el.hud.timer.textContent = formatTime(state.timeLeft);
  el.hud.timer.classList.toggle('warning', state.timeLeft <= 60 && state.timeLeft > 10);
  el.hud.timer.classList.toggle('critical', state.timeLeft <= 10 && !state.gameOver);

  el.hud.score.textContent = String(state.score).padStart(4, '0');
  el.hud.found.textContent = `${state.foundIds.size} / ${state.totalHazards}`;
  el.hud.total.textContent = String(state.totalHazards);

  const acc = accuracyPercent();
  el.hud.accuracy.textContent = acc === null ? '—' : `${acc}%`;

  const pct = Math.round((state.foundIds.size / state.totalHazards) * 100);
  el.progressFill.style.width = `${pct}%`;
  el.progressFill.classList.toggle('complete', pct === 100);
  el.progressCount.textContent = `${state.foundIds.size} / ${state.totalHazards}`;
}

function renderResults(timeOut) {
  const found = state.foundIds.size;
  const allFound = found === state.totalHazards;
  const acc = accuracyPercent();

  el.results.badge.textContent = allFound ? '🏆' : timeOut ? '⏱️' : '📋';
  el.results.title.textContent = allFound ? 'CITY SECURED' : timeOut ? "TIME'S UP" : 'HAZARD HUNT COMPLETE';
  el.results.sub.textContent = allFound
    ? 'Every hazard identified — the city is safer with you on watch.'
    : timeOut
      ? 'The clock ran out, but every hazard you spotted still counts.'
      : 'The investigation ended early. Every find still counts.';

  el.results.found.textContent = `${found} / ${state.totalHazards}`;
  el.results.score.textContent = String(state.score).padStart(4, '0');
  el.results.accuracy.textContent = acc === null ? '—' : `${acc}%`;
}

/* ---------------- Markers + feedback ---------------- */

function buildMarkers() {
  el.artwork.querySelectorAll('.marker').forEach((m) => m.remove());
  el.artwork.querySelectorAll('.feedback-card').forEach((c) => c.remove());

  for (const hazard of HAZARDS) {
    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'marker';
    marker.dataset.id = hazard.id;
    marker.style.left = `${hazard.x}%`;
    marker.style.top = `${hazard.y}%`;
    marker.setAttribute('aria-label', `Investigate: something near here looks unsafe`);
    el.artwork.appendChild(marker);
  }
}

function showFeedbackCard(hazard, clientX, clientY) {
  closeFeedbackCard();

  const artworkRect = el.artwork.getBoundingClientRect();
  let leftPct = ((clientX - artworkRect.left) / artworkRect.width) * 100;
  let topPct = ((clientY - artworkRect.top) / artworkRect.height) * 100;
  leftPct = Math.min(78, Math.max(2, leftPct));
  topPct = Math.min(80, Math.max(2, topPct));

  const card = document.createElement('div');
  card.className = 'feedback-card';
  card.style.left = `${leftPct}%`;
  card.style.top = `${topPct}%`;
  card._centerX = leftPct;
  card._centerY = topPct;

  if (hazard) {
    card.innerHTML = `
      <button class="feedback-close" type="button" aria-label="Close">&times;</button>
      <h4 class="hazard">🚨 Hazard Found!</h4>
      <p class="hazard-name">${hazard.name}</p>
      <p><strong>What is wrong</strong>${hazard.problem}</p>
      <p><strong>Why it matters</strong>${hazard.why}</p>
      <div class="feedback-meta">
        <span class="severity ${hazard.severity}">${hazard.severity.toUpperCase()}</span>
        <span class="points">+${hazard.points}</span>
      </div>
    `;
  } else {
    card.innerHTML = `
      <button class="feedback-close" type="button" aria-label="Close">&times;</button>
      <h4 class="no-hazard">No hazard detected</h4>
      <p>Keep looking — scan the shadows, the walkways, and the signage.</p>
    `;
  }

  el.artwork.appendChild(card);
  card.querySelector('.feedback-close').addEventListener('click', closeFeedbackCard);

  // Clamp the card fully inside the artwork using layout math only —
  // getBoundingClientRect would include the entry animation's transform.
  const artW = el.artwork.clientWidth;
  const artH = el.artwork.clientHeight;
  const cw = card.offsetWidth;
  const chh = card.offsetHeight;
  const margin = 18; // clears the card-in animation's entry offset + rounding
  let cx = (card._centerX / 100) * artW;
  let cy = (card._centerY / 100) * artH;
  cx = Math.min(Math.max(cx, cw / 2 + margin), artW - cw / 2 - margin);
  cy = Math.min(Math.max(cy, chh / 2 + margin), artH - chh / 2 - margin);
  card.style.left = `${(cx / artW) * 100}%`;
  card.style.top = `${(cy / artH) * 100}%`;
}

function closeFeedbackCard() {
  el.artwork.querySelectorAll('.feedback-card').forEach((c) => c.remove());
}

function showFoundRing(clientX, clientY) {
  const artworkRect = el.artwork.getBoundingClientRect();
  const ring = document.createElement('div');
  ring.className = 'found-ring';
  ring.style.left = `${((clientX - artworkRect.left) / artworkRect.width) * 100}%`;
  ring.style.top = `${((clientY - artworkRect.top) / artworkRect.height) * 100}%`;
  el.artwork.appendChild(ring);
  setTimeout(() => ring.remove(), 900);
}

/* ---------------- Game flow ---------------- */

function startTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    if (!state.running) return;
    state.timeLeft -= 1;
    renderHud();
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      endGame('time-up');
    }
  }, 1000);
}

function endGame(reason) {
  if (state.gameOver) return;
  state.gameOver = true;
  state.running = false;
  clearInterval(state.timerInterval);
  closeFeedbackCard();

  renderHud();
  renderResults(reason === 'time-up');

  if (reason === 'time-up') {
    playSound('warning');
  } else {
    playSound('complete');
  }

  showView('results');
}

function resetGame() {
  state.score = 0;
  state.timeLeft = GAME_DURATION_SECONDS;
  state.foundIds.clear();
  state.wrongClicks = 0;
  state.gameOver = false;
  state.running = true;

  buildMarkers();
  renderHud();
  startTimer();
}

function handleMarkerClick(marker, event) {
  const id = marker.dataset.id;

  if (state.foundIds.has(id)) {
    return; // already scored — no double counting
  }

  const hazard = HAZARDS.find((h) => h.id === id);
  if (!hazard) return;

  state.foundIds.add(id);
  state.score += hazard.points;
  marker.classList.add('found');
  marker.disabled = true;

  showFoundRing(event.clientX, event.clientY);
  showFeedbackCard(hazard, event.clientX, event.clientY);
  playSound('found');
  renderHud();

  if (state.foundIds.size === state.totalHazards) {
    el.progressStatus.textContent = 'CITY SECURED — every hazard found!';
    el.progressStatus.classList.add('secured');
    setTimeout(() => endGame('complete'), 1400);
  }
}

function handleMissClick(event) {
  if (event.target.closest('.feedback-card')) return;
  state.wrongClicks += 1;
  playSound('click');
  showFeedbackCard(null, event.clientX, event.clientY);
  renderHud();
}

/* ---------------- Community map (Leaflet + Firestore) ---------------- */

const mapModule = (() => {
  let map = null;
  let db = null;
  let initialized = false;
  let userMarker = null;
  let accuracyCircle = null;
  let selectedLocation = null;
  let reportMarker = null;
  let hazardLayers = [];
  let leaderboard = {};
  const playerId = localStorage.getItem('streethazards-player-id') || crypto.randomUUID();
  const playerName = localStorage.getItem('streethazards-player-name') || 'Street Sentinel';

  localStorage.setItem('streethazards-player-id', playerId);
  localStorage.setItem('streethazards-player-name', playerName);

  const nodes = {
    panel: document.getElementById('report-panel'),
    form: document.getElementById('report-form'),
    close: document.getElementById('report-close'),
    cancel: document.getElementById('report-cancel'),
    location: document.getElementById('report-location'),
    status: document.getElementById('report-status'),
    submit: document.getElementById('report-submit'),
    toggle: document.getElementById('report-toggle'),
    locate: document.getElementById('locate-me'),
    filter: document.getElementById('hazard-filter'),
    points: document.getElementById('report-points'),
    rewardProgress: document.getElementById('reward-progress'),
    rewardBadge: document.getElementById('reward-badge'),
    rewardNext: document.getElementById('reward-next-text'),
    badges: document.getElementById('badge-row'),
    leaderboard: document.getElementById('leaderboard-list'),
    leaderboardCount: document.getElementById('leaderboard-count')
  };

  function getReportCount() {
    return Number(localStorage.getItem('streethazards-report-count') || 0);
  }

  function renderRewards() {
    const count = getReportCount();
    const points = count * 100;
    const next = count < 1 ? 1 : count < 3 ? 3 : 10;
    const badge = count >= 10 ? 'City Guardian' : count >= 3 ? 'Street Watcher' : 'First Responder';
    nodes.points.textContent = points;
    nodes.rewardBadge.textContent = badge;
    nodes.rewardNext.textContent = count >= 10 ? 'All rewards unlocked' : `${next - count} report${next - count === 1 ? '' : 's'} to unlock`;
    nodes.rewardProgress.style.width = `${Math.min(100, (count / next) * 100)}%`;
    nodes.badges.querySelector('[data-badge="first"]').classList.toggle('locked', count < 1);
    nodes.badges.querySelector('[data-badge="watch"]').classList.toggle('locked', count < 3);
    nodes.badges.querySelector('[data-badge="guardian"]').classList.toggle('locked', count < 10);
  }

  function renderLeaderboard() {
    const entries = Object.values(leaderboard).sort((a, b) => b.reports - a.reports).slice(0, 5);
    nodes.leaderboardCount.textContent = `${entries.reduce((sum, entry) => sum + entry.reports, 0)} reports`;
    if (!entries.length) {
      nodes.leaderboard.innerHTML = '<div class="leaderboard-empty">Be the first sentinel on the board.</div>';
      return;
    }
    nodes.leaderboard.innerHTML = entries.map((entry, index) => `
      <div class="leaderboard-entry ${entry.id === playerId ? 'current' : ''}">
        <span class="leaderboard-rank">${['①', '②', '③'][index] || `${index + 1}.`}</span>
        <span class="leaderboard-name">${entry.name}${entry.id === playerId ? ' <b>YOU</b>' : ''}</span>
        <span class="leaderboard-reports">${entry.reports * 100} pts</span>
      </div>
    `).join('');
  }

  function applyFilter() {
    const filter = nodes.filter.value;
    hazardLayers.forEach(({ layer, type }) => {
      const visible = filter === 'all' || type === filter;
      if (visible) layer.addTo(map);
      else map.removeLayer(layer);
    });
  }

  function addHazardMarker(data) {
    const layer = L.circleMarker([data.lat, data.lng], {
      radius: 8,
      fillColor: '#ef4444',
      color: '#991b1b',
      weight: 2,
      fillOpacity: 0.8
    }).bindPopup(`<b>Hazard:</b> ${data.type}${data.details ? `<br>${data.details}` : ''}`);
    hazardLayers.push({ layer, type: data.type });
    layer.addTo(map);
    applyFilter();
  }

  async function initFirebase() {
    if (db) return db;
    try {
      const appMod = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
      const fsMod = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
      const app = appMod.initializeApp({
        apiKey: 'AIzaSyCgVFIf6hyHjAmAf26rD9HbQcwR2OAyxgo',
        authDomain: 'streethazards-2a.firebaseapp.com',
        projectId: 'streethazards-2a',
        storageBucket: 'streethazards-2a.firebasestorage.app',
        messagingSenderId: '919052017737',
        appId: '1:919052017737:web:b5c19b9261c68a45729f98',
        measurementId: 'G-KVJPSJ0JH4'
      });
      db = fsMod.getFirestore(app);
      return db;
    } catch (err) {
      console.warn('Community map is offline:', err && err.message);
      return null;
    }
  }

  function ensureMap() {
    if (map || typeof L === 'undefined') return;
    map = L.map('map').setView([0, 0], 2);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const gpsIcon = L.divIcon({
      className: 'gps-marker',
      html: '<div class="gps-pulse"></div><div class="gps-dot"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    map.on('locationfound', (e) => {
      const radius = e.accuracy;
      if (!userMarker) {
        userMarker = L.marker(e.latlng, { icon: gpsIcon }).addTo(map);
        accuracyCircle = L.circle(e.latlng, {
          radius,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
          weight: 1
        }).addTo(map);
        map.setView(e.latlng, 16);
      } else {
        userMarker.setLatLng(e.latlng);
        accuracyCircle.setLatLng(e.latlng);
        accuracyCircle.setRadius(radius);
      }
    });

    map.on('locationerror', () => { /* geolocation unavailable — map still works */ });

    map.on('click', (e) => openReportPanel(e.latlng));

    map.locate({ watch: true, enableHighAccuracy: true });
  }

  function openReportPanel(latlng) {
    selectedLocation = latlng || selectedLocation;
    nodes.panel.classList.add('is-open');
    nodes.status.textContent = '';
    nodes.status.className = 'report-status';

    if (selectedLocation && map) {
      if (!reportMarker) {
        reportMarker = L.marker(selectedLocation).addTo(map);
      } else {
        reportMarker.setLatLng(selectedLocation);
      }
      reportMarker.bindPopup('Selected report location').openPopup();
      nodes.location.textContent = `Location: ${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`;
    }
  }

  function closeReportPanel() {
    nodes.panel.classList.remove('is-open');
    nodes.form.reset();
    selectedLocation = null;
    if (reportMarker && map) {
      map.removeLayer(reportMarker);
      reportMarker = null;
    }
    nodes.location.textContent = 'No location selected';
    nodes.status.textContent = '';
  }

  async function submitReport(event) {
    event.preventDefault();
    if (!selectedLocation) {
      nodes.status.textContent = 'Click the map to choose a location first.';
      nodes.status.className = 'report-status error';
      return;
    }

    nodes.submit.disabled = true;
    nodes.status.textContent = 'Submitting report...';
    nodes.status.className = 'report-status';

    try {
      const firestore = await initFirebase();
      if (!firestore) throw new Error('offline');

      await fsAddDoc(firestore, {
        type: document.getElementById('hazard-type').value,
        details: document.getElementById('hazard-details').value.trim(),
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        createdAt: fsServerTimestamp(),
        reporterId: playerId,
        reporterName: playerName
      });
      localStorage.setItem('streethazards-report-count', String(getReportCount() + 1));
      renderRewards();
      nodes.status.textContent = 'Report submitted. Thank you.';
      nodes.status.className = 'report-status success';
      nodes.form.reset();
      selectedLocation = null;
      if (reportMarker && map) {
        map.removeLayer(reportMarker);
        reportMarker = null;
      }
      nodes.location.textContent = 'No location selected';
    } catch (err) {
      console.warn('Report submit failed:', err && err.message);
      nodes.status.textContent = 'Could not submit the report. Please try again.';
      nodes.status.className = 'report-status error';
    } finally {
      nodes.submit.disabled = false;
    }
  }

  let fsMod = null;
  async function fsAddDoc(dbRef, data) {
    fsMod = fsMod || (await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'));
    return fsMod.addDoc(fsMod.collection(dbRef, 'hazards'), data);
  }
  async function fsServerTimestamp() {
    fsMod = fsMod || (await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'));
    return fsMod.serverTimestamp();
  }

  async function watchHazards() {
    const firestore = await initFirebase();
    if (!firestore) return;
    try {
      const mod = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
      mod.onSnapshot(mod.collection(firestore, 'hazards'), (snapshot) => {
        leaderboard = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const id = data.reporterId || 'anonymous';
          leaderboard[id] = leaderboard[id] || { id, name: data.reporterName || 'Anonymous sentinel', reports: 0 };
          leaderboard[id].reports += 1;
        });
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' && map) addHazardMarker(change.doc.data());
        });
        renderLeaderboard();
      });
    } catch (err) {
      console.warn('Live hazard feed unavailable:', err && err.message);
    }
  }

  function activate() {
    ensureMap();
    renderRewards();
    renderLeaderboard();
    if (map) setTimeout(() => map.invalidateSize(), 60);
    if (!initialized) {
      initialized = true;
      nodes.toggle.addEventListener('click', () => openReportPanel());
      nodes.close.addEventListener('click', closeReportPanel);
      nodes.cancel.addEventListener('click', closeReportPanel);
      nodes.form.addEventListener('submit', submitReport);
      nodes.filter.addEventListener('change', applyFilter);
      nodes.locate.addEventListener('click', () => map && map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true }));
      watchHazards();
    }
  }

  return { activate };
})();

/* ---------------- Wiring ---------------- */

const startButton = document.getElementById('start-hunt-btn');
let showingHowFromGame = false;

function showHowItWorks() {
  playSound('click');
  // Pause the hunt while the player reviews the instructions;
  // the start button resumes it instead of resetting.
  state.running = false;
  clearInterval(state.timerInterval);
  closeFeedbackCard();
  startButton.textContent = '▶ Resume Hunt';
  showingHowFromGame = true;
  showView('start');
}

function wireEvents() {
  el.buttons.start.addEventListener('click', () => {
    playSound('click');
    if (showingHowFromGame) {
      // Resume the paused hunt exactly where it left off.
      showingHowFromGame = false;
      startButton.textContent = '▶ Start Hunt';
      state.running = true;
      startTimer();
      showView('game');
      return;
    }
    showView('game');
    resetGame();
  });

  el.buttons.restart.addEventListener('click', () => {
    playSound('click');
    closeFeedbackCard();
    resetGame();
  });

  el.buttons.playAgain.addEventListener('click', () => {
    playSound('click');
    el.progressStatus.textContent = '';
    el.progressStatus.classList.remove('secured');
    showView('game');
    resetGame();
  });

  el.buttons.how.addEventListener('click', showHowItWorks);
  el.buttons.resultsMap.addEventListener('click', () => {
    playSound('click');
    state.running = false; // pause while browsing the community map
    clearInterval(state.timerInterval);
    closeFeedbackCard();
    showView('map');
    mapModule.activate();
  });
  el.buttons.mapBack.addEventListener('click', () => {
    playSound('click');
    if (state.gameOver) {
      // The hunt already ended — return to the results instead of resuming.
      showView('results');
      return;
    }
    state.running = true; // resume the paused hunt
    startTimer();
    showView('game');
  });

  el.artwork.addEventListener('click', (event) => {
    if (state.gameOver || !state.running) return;
    const marker = event.target.closest('.marker');
    if (marker && !marker.classList.contains('found')) {
      handleMarkerClick(marker, event);
    } else if (!marker) {
      handleMissClick(event);
    }
  });
}

function init() {
  initSounds();
  wireEvents();
  renderHud();
  buildMarkers();
}

init();
