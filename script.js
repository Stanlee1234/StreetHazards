import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import {
	getFirestore,
	collection,
	addDoc,
	doc,
	onSnapshot,
	runTransaction,
	serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const db = getFirestore(app);
const hazardsRef = collection(db, "hazards");
const votesRequired = 3;
const voteStorageKey = 'streetHazardsVoted';
const activeVoteStorageKey = 'streetHazardsActiveVoted';

const map = L.map('map').setView([0, 0], 2);
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

let userMarker = null;
let accuracyCircle = null;
let userLocation = null;
let hazards = [];
const hazardMarkers = new Map();
const hazardList = document.getElementById('hazard-list');
const hazardsStatus = document.getElementById('hazards-status');
const hazardsSidebar = document.querySelector('.hazards-sidebar');
const hazardsSidebarToggle = document.getElementById('hazards-sidebar-toggle');
const votedHazards = new Set(JSON.parse(localStorage.getItem(voteStorageKey) || '[]'));
const activeVotedHazards = new Set(JSON.parse(localStorage.getItem(activeVoteStorageKey) || '[]'));

hazardsSidebarToggle.addEventListener('click', () => {
	const isMinimized = hazardsSidebar.classList.toggle('is-minimized');
	document.body.classList.toggle('sidebar-minimized', isMinimized);
	hazardsSidebarToggle.setAttribute('aria-expanded', String(!isMinimized));
	hazardsSidebarToggle.setAttribute('aria-label', isMinimized ? 'Expand hazards sidebar' : 'Minimize hazards sidebar');
	hazardsSidebarToggle.textContent = isMinimized ? '>' : '<';
	setTimeout(() => map.invalidateSize(), 180);
});

function distanceInMeters(first, second) {
	const earthRadius = 6371000;
	const latDifference = (second.lat - first.lat) * Math.PI / 180;
	const lngDifference = (second.lng - first.lng) * Math.PI / 180;
	const latitude = first.lat * Math.PI / 180;
	const secondLatitude = second.lat * Math.PI / 180;
	const value = Math.sin(latDifference / 2) ** 2
		+ Math.cos(latitude) * Math.cos(secondLatitude) * Math.sin(lngDifference / 2) ** 2;
	return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function formatDistance(meters) {
	return meters < 1000 ? `${Math.round(meters)} m away` : `${(meters / 1000).toFixed(1)} km away`;
}

function votesRequiredFor(hazard) {
	return votesRequired + (hazard.activeVotes || 0);
}

function renderHazards() {
	const sortedHazards = hazards
		.map((hazard) => ({ ...hazard, distance: userLocation ? distanceInMeters(userLocation, hazard) : null }))
		.sort((first, second) => (first.distance ?? Infinity) - (second.distance ?? Infinity));

	hazardList.replaceChildren();
	if (!sortedHazards.length) {
		const emptyMessage = document.createElement('p');
		emptyMessage.className = 'hazard-empty';
		emptyMessage.textContent = 'No hazards have been reported yet.';
		hazardList.appendChild(emptyMessage);
		return;
	}

	sortedHazards.forEach((hazard) => {
		const item = document.createElement('article');
		item.className = 'hazard-item';
		item.innerHTML = `<button class="hazard-map-focus" type="button"><span class="hazard-item-header"><span></span><span class="hazard-distance"></span></span><span class="hazard-details"></span></button><button class="hazard-active-vote" type="button"></button><button class="hazard-vote" type="button"></button>`;
		item.querySelector('.hazard-item-header span').textContent = hazard.type || 'Other hazard';
		item.querySelector('.hazard-distance').textContent = hazard.distance === null ? 'Distance unavailable' : formatDistance(hazard.distance);
		item.querySelector('.hazard-details').textContent = hazard.details || 'No additional details';
		item.querySelector('.hazard-map-focus').addEventListener('click', () => {
			map.setView([hazard.lat, hazard.lng], 17);
			hazardMarkers.get(hazard.id)?.openPopup();
		});
		const activeVoteButton = item.querySelector('.hazard-active-vote');
		const activeVoteCount = hazard.activeVotes || 0;
		activeVoteButton.textContent = activeVotedHazards.has(hazard.id) ? `You confirmed it is active (${activeVoteCount} agree)` : `Confirm active hazard (${activeVoteCount} agree)`;
		activeVoteButton.disabled = activeVotedHazards.has(hazard.id);
		activeVoteButton.addEventListener('click', () => voteHazardActive(hazard.id, activeVoteButton));

		const voteButton = item.querySelector('.hazard-vote');
		const voteCount = hazard.notThereVotes || 0;
		const requiredVoteCount = votesRequiredFor(hazard);
		voteButton.textContent = votedHazards.has(hazard.id) ? `You voted that it is gone (${voteCount}/${requiredVoteCount})` : `Vote: not there anymore (${voteCount}/${requiredVoteCount})`;
		voteButton.disabled = votedHazards.has(hazard.id);
		voteButton.addEventListener('click', () => voteHazardGone(hazard.id, voteButton));
		hazardList.appendChild(item);
	});
}

async function voteHazardGone(hazardId, voteButton) {
	if (votedHazards.has(hazardId)) return;
	voteButton.disabled = true;
	voteButton.textContent = 'Saving vote...';
	try {
		await runTransaction(db, async (transaction) => {
			const hazardRef = doc(db, 'hazards', hazardId);
			const hazardSnapshot = await transaction.get(hazardRef);
			if (!hazardSnapshot.exists() || hazardSnapshot.data().resolved) return;
			const hazardData = hazardSnapshot.data();
			const nextVoteCount = (hazardData.notThereVotes || 0) + 1;
			transaction.update(hazardRef, { notThereVotes: nextVoteCount, resolved: nextVoteCount >= votesRequiredFor(hazardData) });
		});
		votedHazards.add(hazardId);
		localStorage.setItem(voteStorageKey, JSON.stringify([...votedHazards]));
	} catch (err) {
		console.error(err);
		voteButton.disabled = false;
		voteButton.textContent = 'Vote: not there anymore';
	}
}

async function voteHazardActive(hazardId, voteButton) {
	if (activeVotedHazards.has(hazardId)) return;
	voteButton.disabled = true;
	voteButton.textContent = 'Saving agreement...';
	try {
		await runTransaction(db, async (transaction) => {
			const hazardRef = doc(db, 'hazards', hazardId);
			const hazardSnapshot = await transaction.get(hazardRef);
			if (!hazardSnapshot.exists() || hazardSnapshot.data().resolved) return;
			transaction.update(hazardRef, { activeVotes: (hazardSnapshot.data().activeVotes || 0) + 1 });
		});
		activeVotedHazards.add(hazardId);
		localStorage.setItem(activeVoteStorageKey, JSON.stringify([...activeVotedHazards]));
	} catch (err) {
		console.error(err);
		voteButton.disabled = false;
		voteButton.textContent = 'Confirm active hazard';
	}
}

map.locate({ watch: true, enableHighAccuracy: true });
map.on('locationfound', function(e) {
	userLocation = e.latlng;
	hazardsStatus.textContent = `${hazards.length} reported hazard${hazards.length === 1 ? '' : 's'} nearby`;
	renderHazards();
	if (!userMarker) {
		userMarker = L.marker(e.latlng, { icon: gpsIcon }).addTo(map);
		accuracyCircle = L.circle(e.latlng, { radius: e.accuracy, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 1 }).addTo(map);
		map.setView(e.latlng, 16);
	} else {
		userMarker.setLatLng(e.latlng);
		accuracyCircle.setLatLng(e.latlng);
		accuracyCircle.setRadius(e.accuracy);
	}
});

map.on('locationerror', function(e) {
	console.warn(e.message);
	hazardsStatus.textContent = 'Enable location to sort by distance';
	renderHazards();
});

const reportToggle = document.getElementById('report-toggle');
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
let selectedLocation = null;
let reportMarker = null;

hazardType.addEventListener('change', () => {
	const isCustomHazard = hazardType.value === 'Other';
	customHazardField.hidden = !isCustomHazard;
	customHazardType.required = isCustomHazard;
	if (!isCustomHazard) customHazardType.value = '';
});

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
	if (reportMarker) {
		map.removeLayer(reportMarker);
		reportMarker = null;
	}
	reportLocation.textContent = 'No location selected';
	reportStatus.textContent = '';
}

reportToggle.addEventListener('click', () => openReportPanel());
reportClose.addEventListener('click', closeReportPanel);
reportCancel.addEventListener('click', closeReportPanel);
map.on('click', (e) => openReportPanel(e.latlng));

reportForm.addEventListener('submit', async function(e) {
	e.preventDefault();
	if (!selectedLocation) {
		reportStatus.textContent = 'Click the map to choose a location first.';
		reportStatus.className = 'report-status error';
		return;
	}
	reportSubmit.disabled = true;
	reportStatus.textContent = 'Submitting report...';
	reportStatus.className = 'report-status';
	try {
		const selectedHazardType = hazardType.value === 'Other'
			? customHazardType.value.trim()
			: hazardType.value;
		await addDoc(hazardsRef, {
			type: selectedHazardType,
			details: document.getElementById('hazard-details').value.trim(),
			lat: selectedLocation.lat,
			lng: selectedLocation.lng,
			activeVotes: 1,
			notThereVotes: 0,
			resolved: false,
			createdAt: serverTimestamp()
		});
		reportStatus.textContent = 'Report submitted. Thank you.';
		reportStatus.className = 'report-status success';
		reportForm.reset();
		customHazardField.hidden = true;
		customHazardType.required = false;
		selectedLocation = null;
		if (reportMarker) {
			map.removeLayer(reportMarker);
			reportMarker = null;
		}
		reportLocation.textContent = 'No location selected';
	} catch (err) {
		console.error(err);
		reportStatus.textContent = 'Could not submit the report. Please try again.';
		reportStatus.className = 'report-status error';
	} finally {
		reportSubmit.disabled = false;
	}
});

onSnapshot(hazardsRef, (snapshot) => {
	hazardMarkers.forEach((marker) => map.removeLayer(marker));
	hazardMarkers.clear();
	hazards = snapshot.docs.map((hazardDoc) => {
		const data = hazardDoc.data();
		if (data.resolved) return null;
		const activeVoteCount = data.activeVotes || 0;
		const marker = L.circleMarker([data.lat, data.lng], {
			radius: Math.min(8 + activeVoteCount * 2, 28),
			fillColor: '#ef4444',
			color: '#991b1b',
			weight: 2,
			fillOpacity: 0.8
		}).addTo(map).bindPopup(`<b>Hazard:</b> ${data.type}${data.details ? `<br>${data.details}` : ''}<br><b>${activeVoteCount} active agreement${activeVoteCount === 1 ? '' : 's'}</b><br><a class="hazard-google-maps" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.lat},${data.lng}`)}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>`);
		hazardMarkers.set(hazardDoc.id, marker);
		return { id: hazardDoc.id, ...data };
	}).filter(Boolean);
	hazardsStatus.textContent = userLocation ? `${hazards.length} reported hazard${hazards.length === 1 ? '' : 's'} nearby` : 'Locating you...';
	renderHazards();
});
