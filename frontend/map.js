// map.js
let map; // global

// 1️⃣ Show user location
function showMap(lat, lng) {
    if (map) map.remove(); // reset previous map

    map = L.map('map').setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data © OpenStreetMap contributors'
    }).addTo(map);

    // User marker
    L.marker([lat, lng]).addTo(map)
        .bindPopup("You are here")
        .openPopup();
}

// 2️⃣ Show donors on map
function showDonorsOnMap(donors) {
    if (!map) return;

    donors.forEach(d => {
        if (d.location) {
            L.marker([d.location.lat, d.location.lng])
                .addTo(map)
                .bindPopup(`${d.name} - ${d.bloodGroup || ""}`); // ✅ use backticks here
        }
    });
}

// 3️⃣ Optional: Show emergencies on map
function showEmergenciesOnMap(emergencies) {
    if (!map) return;

    emergencies.forEach(e => {
        if (e.location) {
            L.marker([e.location.lat, e.location.lng], {
                icon: L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
                    iconSize: [30, 30]
                })
            })
            .addTo(map)
            .bindPopup(`Emergency: ${e.bloodGroup || "Blood Needed"}`); // ✅ backticks
        }
    });
}

// 4️⃣ Utility: distance between two points
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI/180) *
        Math.cos(lat2 * Math.PI/180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // distance in km
}
// 5️⃣ Sort donors by distance (top 3)
function sortNearestDonors(userLocation, donors) {
    return donors
        .map(d => ({
            ...d,
            distance: getDistance(
                userLocation.lat,
                userLocation.lng,
                d.location.lat,
                d.location.lng
            )
        }))
        .sort((a, b) => a.distance - b.distance);
}