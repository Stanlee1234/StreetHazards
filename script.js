import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, deleteDoc, onSnapshot, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgVFIf6hyHjAmAf26rD9HbQcwR2OAyxgo",
  authDomain: "streethazards-2a.firebaseapp.com",
  projectId: "streethazards-2a",
  storageBucket: "streethazards-2a.firebasestorage.app",
  messagingSenderId: "919052017737",
  appId: "1:919052017737:web:b5c19b9261c68a45729f98",
  measurementId: "G-KVJPSJ0JH4"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const hazardsRef = collection(db, "hazards");
const votesRequired = 3;
const maximumHazardRadius = 24;
let currentUser = null;
let hazards = [];
let userLocation = null;
let activeHazardView = 'nearby';
let selectedLocation = null;
let reportMarker = null;
let searchMarker = null;
let userMarker = null;
let accuracyCircle = null;
let votedHazards = new Set();
let activeVotedHazards = new Set();

const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
const hazardMarkers = new Map();
const gpsIcon = L.divIcon({ className: 'gps-marker', html: '<div class="gps-pulse"></div><div class="gps-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });

const hazardList = document.getElementById('hazard-list');
const hazardsStatus = document.getElementById('hazards-status');
const hazardsSidebar = document.querySelector('.hazards-sidebar');
const hazardsSidebarToggle = document.getElementById('hazards-sidebar-toggle');
const nearbyHazardsTab = document.getElementById('nearby-hazards-tab');
const myHazardsTab = document.getElementById('my-hazards-tab');
const authStatus = document.getElementById('auth-status');
const authButton = document.getElementById('auth-button');
const reportAuthNotice = document.getElementById('report-auth-notice');
const reportAuthButton = document.getElementById('report-auth-button');
const reportToggle = document.getElementById('report-toggle');
const placeSearch = document.getElementById('place-search');
const placeSearchInput = document.getElementById('place-search-input');
const placeSearchResults = document.getElementById('place-search-results');
const placeSearchButton = document.querySelector('.place-search-submit');
const reportPanel = document.getElementById('report-panel');
const reportForm = document.getElementById('report-form');
const reportClose = document.getElementById('report-close');
const reportCancel = document.getElementById('report-cancel');
const reportLocation = document.getElementById('report-location');
const reportStatus = document.getElementById('report-status');
const reportSubmit = document.getElementById('report-submit');
const hazardType = document.getElementById('hazard-type');
const customHazardField = document.getElementById('custom-hazard-field');
const customHazardType = document.getElementById('custom-hazard-type');

function votedStorageKey(userId, voteType) { return `streetHazards:${userId}:${voteType}`; }
function getVotedHazards(voteType) {
  return currentUser ? new Set(JSON.parse(localStorage.getItem(votedStorageKey(currentUser.uid, voteType)) || '[]')) : new Set();
}
function requireSignIn(message = 'Sign in first to do that.') {
  if (currentUser) return true;
  authStatus.textContent = message;
  authButton.focus();
  return false;
}
function authErrorMessage(error) {
  if (error.code === 'auth/operation-not-allowed') return 'Google sign-in is not enabled in Firebase.';
  if (error.code === 'auth/unauthorized-domain') return 'This site is not an authorized Firebase sign-in domain.';
  if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') return 'Sign-in was canceled or blocked. Try again.';
  if (error.code === 'auth/operation-not-supported-in-this-environment') return 'Sign-in requires the deployed website, not a file preview.';
  return 'Could not complete sign in. Please try again.';
}
function distanceInMeters(first, second) {
  const earthRadius = 6371000;
  const latDifference = (second.lat - first.lat) * Math.PI / 180;
  const lngDifference = (second.lng - first.lng) * Math.PI / 180;
  const firstLatitude = first.lat * Math.PI / 180;
  const secondLatitude = second.lat * Math.PI / 180;
  const value = Math.sin(latDifference / 2) ** 2 + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(lngDifference / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
function formatDistance(meters) { return meters < 1000 ? `${Math.round(meters)} m away` : `${(meters / 1000).toFixed(1)} km away`; }
function formatPostedTime(timestamp) {
  if (!timestamp?.toDate) return 'Posted just now';
  return `Posted ${timestamp.toDate().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`;
}
function votesRequiredFor(hazard) { return votesRequired + (hazard.activeVotes || 0); }

function setHazardView(view) {
  activeHazardView = view;
  const showingMine = view === 'mine';
  nearbyHazardsTab.classList.toggle('is-active', !showingMine);
  myHazardsTab.classList.toggle('is-active', showingMine);
  nearbyHazardsTab.setAttribute('aria-selected', String(!showingMine));
  myHazardsTab.setAttribute('aria-selected', String(showingMine));
  renderHazards();
}

function renderHazards() {
  const visibleHazards = activeHazardView === 'mine' ? hazards.filter((hazard) => currentUser && hazard.creatorUid === currentUser.uid) : hazards;
  const sortedHazards = visibleHazards.map((hazard) => ({ ...hazard, distance: userLocation ? distanceInMeters(userLocation, hazard) : null })).sort((first, second) => (first.distance ?? Infinity) - (second.distance ?? Infinity));
  hazardList.replaceChildren();
  if (!sortedHazards.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'hazard-empty';
    emptyMessage.textContent = activeHazardView === 'mine' ? (currentUser ? 'You have not reported any active hazards.' : 'Sign in to see your hazards.') : 'No hazards have been reported yet.';
    hazardList.appendChild(emptyMessage);
    return;
  }
  sortedHazards.forEach((hazard) => {
    const item = document.createElement('article');
    item.className = 'hazard-item';
    const controls = activeHazardView === 'mine' ? '<button class="hazard-delete" type="button">Delete my hazard</button>' : '<button class="hazard-active-vote" type="button"></button><button class="hazard-vote" type="button"></button>';
    item.innerHTML = `<button class="hazard-map-focus" type="button"><span class="hazard-item-header"><span></span><span class="hazard-distance"></span></span><span class="hazard-details"></span><span class="hazard-active-count"></span><span class="hazard-posted-time"></span></button>${controls}`;
    item.querySelector('.hazard-item-header span').textContent = hazard.type || 'Other hazard';
    item.querySelector('.hazard-distance').textContent = hazard.distance === null ? 'Distance unavailable' : formatDistance(hazard.distance);
    item.querySelector('.hazard-details').textContent = hazard.details || 'No additional details';
    const activeVoteCount = hazard.activeVotes || 0;
    item.querySelector('.hazard-active-count').textContent = `${activeVoteCount} active agreement${activeVoteCount === 1 ? '' : 's'}`;
    item.querySelector('.hazard-posted-time').textContent = formatPostedTime(hazard.createdAt);
    item.querySelector('.hazard-map-focus').addEventListener('click', () => { map.setView([hazard.lat, hazard.lng], 17); hazardMarkers.get(hazard.id)?.openPopup(); });
    if (activeHazardView === 'mine') {
      item.querySelector('.hazard-delete').addEventListener('click', () => deleteMyHazard(hazard.id));
    } else {
      const activeButton = item.querySelector('.hazard-active-vote');
      const isCreator = currentUser && hazard.creatorUid === currentUser.uid;
      activeButton.textContent = isCreator ? 'You cannot agree with your own hazard' : activeVotedHazards.has(hazard.id) ? 'You agreed this hazard is active' : 'Agree this hazard is active';
      activeButton.disabled = isCreator || activeVotedHazards.has(hazard.id);
      activeButton.addEventListener('click', () => voteHazardActive(hazard.id, activeButton));
      const goneButton = item.querySelector('.hazard-vote');
      const goneCount = hazard.notThereVotes || 0;
      const requiredCount = votesRequiredFor(hazard);
      goneButton.textContent = votedHazards.has(hazard.id) ? `You voted that it is gone (${goneCount}/${requiredCount})` : `Vote: remove hazard (${goneCount}/${requiredCount})`;
      goneButton.disabled = votedHazards.has(hazard.id);
      goneButton.addEventListener('click', () => voteHazardGone(hazard.id, goneButton));
    }
    hazardList.appendChild(item);
  });
}

async function deleteMyHazard(hazardId) {
  if (!requireSignIn('Sign in first to delete your hazard.')) return;
  const hazard = hazards.find((item) => item.id === hazardId);
  if (!hazard || hazard.creatorUid !== currentUser.uid || !window.confirm('Delete this hazard? This cannot be undone.')) return;
  try { await deleteDoc(doc(db, 'hazards', hazardId)); } catch (error) { console.error(error); authStatus.textContent = 'Could not delete that hazard.'; }
}
async function voteHazardActive(hazardId, button) {
  if (!requireSignIn() || activeVotedHazards.has(hazardId)) return;
  button.disabled = true;
  button.textContent = 'Saving agreement...';
  try {
    await runTransaction(db, async (transaction) => {
      const hazardRef = doc(db, 'hazards', hazardId);
      const snapshot = await transaction.get(hazardRef);
      if (!snapshot.exists() || snapshot.data().resolved) return;
      const data = snapshot.data();
      if (data.creatorUid && data.creatorUid === currentUser.uid) return;
      transaction.update(hazardRef, { activeVotes: (data.activeVotes || 0) + 1 });
    });
    activeVotedHazards.add(hazardId);
    localStorage.setItem(votedStorageKey(currentUser.uid, 'active'), JSON.stringify([...activeVotedHazards]));
  } catch (error) { console.error(error); button.disabled = false; button.textContent = 'Agree this hazard is active'; }
}
async function voteHazardGone(hazardId, button) {
  if (!requireSignIn() || votedHazards.has(hazardId)) return;
  button.disabled = true;
  button.textContent = 'Saving vote...';
  try {
    await runTransaction(db, async (transaction) => {
      const hazardRef = doc(db, 'hazards', hazardId);
      const snapshot = await transaction.get(hazardRef);
      if (!snapshot.exists() || snapshot.data().resolved) return;
      const data = snapshot.data();
      const nextCount = (data.notThereVotes || 0) + 1;
      transaction.update(hazardRef, { notThereVotes: nextCount, resolved: nextCount >= votesRequiredFor(data) });
    });
    votedHazards.add(hazardId);
    localStorage.setItem(votedStorageKey(currentUser.uid, 'gone'), JSON.stringify([...votedHazards]));
  } catch (error) { console.error(error); button.disabled = false; button.textContent = 'Vote: remove hazard '; }
}

function showSearchMessage(message) {
  placeSearchResults.replaceChildren();
  const messageElement = document.createElement('div');
  messageElement.className = 'place-search-message';
  messageElement.textContent = message;
  placeSearchResults.appendChild(messageElement);
}
async function searchPlaces(query) {
  placeSearchButton.disabled = true;
  showSearchMessage('Searching...');
  try {
    const params = new URLSearchParams({ q: query, format: 'jsonv2', limit: '5', addressdetails: '1' });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
    if (!response.ok) throw new Error(`Search failed with status ${response.status}`);
    const results = await response.json();
    placeSearchResults.replaceChildren();
    if (!results.length) return showSearchMessage('No restaurants or landmarks found.');
    results.forEach((result) => {
      const resultButton = document.createElement('button');
      resultButton.className = 'place-search-result';
      resultButton.type = 'button';
      resultButton.setAttribute('role', 'option');
      resultButton.textContent = result.display_name;
      resultButton.addEventListener('click', () => {
        const location = [Number(result.lat), Number(result.lon)];
        map.setView(location, 17);
        if (searchMarker) map.removeLayer(searchMarker);
        searchMarker = L.marker(location).addTo(map).bindPopup(result.display_name).openPopup();
        placeSearchResults.replaceChildren();
      });
      placeSearchResults.appendChild(resultButton);
    });
  } catch (error) { console.error(error); showSearchMessage('Search is unavailable right now.'); }
  finally { placeSearchButton.disabled = false; }
}

function openReportPanel(latlng) {
  selectedLocation = latlng || selectedLocation;
  reportPanel.classList.add('is-open');
  reportStatus.textContent = '';
  reportStatus.className = 'report-status';
  if (selectedLocation) {
    if (!reportMarker) reportMarker = L.marker(selectedLocation).addTo(map);
    else reportMarker.setLatLng(selectedLocation);
    reportMarker.bindPopup('Selected report location').openPopup();
    reportLocation.textContent = `Location: ${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`;
  }
}
function closeReportPanel() {
  reportPanel.classList.remove('is-open');
  reportForm.reset();
  customHazardField.hidden = true;
  customHazardType.required = false;
  selectedLocation = null;
  if (reportMarker) { map.removeLayer(reportMarker); reportMarker = null; }
  reportLocation.textContent = 'No location selected';
  reportStatus.textContent = '';
}

hazardsSidebarToggle.addEventListener('click', () => {
  const minimized = hazardsSidebar.classList.toggle('is-minimized');
  document.body.classList.toggle('sidebar-minimized', minimized);
  hazardsSidebarToggle.setAttribute('aria-expanded', String(!minimized));
  hazardsSidebarToggle.setAttribute('aria-label', minimized ? 'Expand hazards sidebar' : 'Minimize hazards sidebar');
  hazardsSidebarToggle.textContent = minimized ? '>' : '<';
  setTimeout(() => map.invalidateSize(), 180);
});
nearbyHazardsTab.addEventListener('click', () => setHazardView('nearby'));
myHazardsTab.addEventListener('click', () => setHazardView('mine'));
placeSearch.addEventListener('submit', (event) => { event.preventDefault(); const query = placeSearchInput.value.trim(); if (query) searchPlaces(query); });
hazardType.addEventListener('change', () => { const custom = hazardType.value === 'Other'; customHazardField.hidden = !custom; customHazardType.required = custom; if (!custom) customHazardType.value = ''; });
reportToggle.addEventListener('click', () => openReportPanel());
reportClose.addEventListener('click', closeReportPanel);
reportCancel.addEventListener('click', closeReportPanel);
map.on('click', (event) => openReportPanel(event.latlng));
reportAuthButton.addEventListener('click', () => authButton.click());

reportForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!requireSignIn('Sign in first to report a hazard.') || !selectedLocation) return;
  reportSubmit.disabled = true;
  reportStatus.textContent = 'Submitting report...';
  try {
    await addDoc(hazardsRef, { type: hazardType.value === 'Other' ? customHazardType.value.trim() : hazardType.value, details: document.getElementById('hazard-details').value.trim(), lat: selectedLocation.lat, lng: selectedLocation.lng, activeVotes: 1, creatorUid: currentUser.uid, notThereVotes: 0, resolved: false, createdAt: serverTimestamp() });
    reportStatus.textContent = 'Report submitted. Thank you.';
    reportStatus.className = 'report-status success';
    closeReportPanel();
  } catch (error) { console.error(error); reportStatus.textContent = 'Could not submit the report. Please try again.'; reportStatus.className = 'report-status error'; }
  finally { reportSubmit.disabled = false; }
});

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  votedHazards = getVotedHazards('gone');
  activeVotedHazards = getVotedHazards('active');
  authStatus.textContent = user ? (user.displayName || user.email || 'Signed in') : 'Sign in to report or vote';
  authButton.textContent = user ? 'Sign out' : 'Sign in';
  reportAuthNotice.classList.toggle('is-hidden', Boolean(user));
  renderHazards();
});
getRedirectResult(auth).catch((error) => { if (error.code && error.code !== 'auth/popup-closed-by-user') { console.error(error); authStatus.textContent = authErrorMessage(error); } });
authButton.addEventListener('click', async () => {
  authButton.disabled = true;
  try {
    if (currentUser) await signOut(auth);
    else {
      try { await signInWithPopup(auth, googleProvider); }
      catch (error) { if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') await signInWithRedirect(auth, googleProvider); else throw error; }
    }
  } catch (error) { console.error(error); authStatus.textContent = authErrorMessage(error); }
  finally { authButton.disabled = false; }
});

map.locate({ watch: true, enableHighAccuracy: true });
map.on('locationfound', (event) => {
  userLocation = event.latlng;
  hazardsStatus.textContent = `${hazards.length} reported hazard${hazards.length === 1 ? '' : 's'} nearby`;
  renderHazards();
  if (!userMarker) {
    userMarker = L.marker(event.latlng, { icon: gpsIcon }).addTo(map);
    accuracyCircle = L.circle(event.latlng, { radius: event.accuracy, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 1 }).addTo(map);
    map.setView(event.latlng, 16);
  } else { userMarker.setLatLng(event.latlng); accuracyCircle.setLatLng(event.latlng); accuracyCircle.setRadius(event.accuracy); }
});
map.on('locationerror', (event) => { console.warn(event.message); hazardsStatus.textContent = 'Enable location to sort by distance'; renderHazards(); });

onSnapshot(hazardsRef, (snapshot) => {
  hazardMarkers.forEach((marker) => map.removeLayer(marker));
  hazardMarkers.clear();
  hazards = snapshot.docs.map((hazardDoc) => {
    const data = hazardDoc.data();
    if (data.resolved) return null;
    const activeVoteCount = data.activeVotes || 0;
    const marker = L.circleMarker([data.lat, data.lng], { radius: Math.min(8 + activeVoteCount * 2, maximumHazardRadius), fillColor: '#ef4444', color: '#991b1b', weight: 2, fillOpacity: 0.8 }).addTo(map).bindPopup(`<b>Hazard:</b> ${data.type}${data.details ? `<br>${data.details}` : ''}<br>${formatPostedTime(data.createdAt)}<br><b>${activeVoteCount} active agreement${activeVoteCount === 1 ? '' : 's'}</b><br><a class="hazard-google-maps" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.lat},${data.lng}`)}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>`);
    hazardMarkers.set(hazardDoc.id, marker);
    return { id: hazardDoc.id, ...data };
  }).filter(Boolean);
  hazardsStatus.textContent = userLocation ? `${hazards.length} reported hazard${hazards.length === 1 ? '' : 's'} nearby` : 'Locating you...';
  renderHazards();
});
