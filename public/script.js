const socket = io();
let currentUser = null;
let isFirstLocation = true;

// Connection handling with status updates
socket.on("connect", () => {
    console.log("Connected to server");
    updateStatus('connected');
    hideLoading(); // From the HTML we improved
});

socket.on("disconnect", () => {
    console.log("Disconnected from server");
    updateStatus('disconnected');
});

socket.on("reconnect", () => {
    console.log("Reconnected to server");
    updateStatus('connected');
});

// Enhanced geolocation with error handling
if (navigator.geolocation) {
    let lastSentTime = 0;
    const THROTTLE_INTERVAL = 2000; // Send location max every 2 seconds

    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            const now = Date.now();

            // Throttle location updates
            if (now - lastSentTime < THROTTLE_INTERVAL) {
                return;
            }

            // Store current user's location
            currentUser = { latitude, longitude, accuracy };
            
            socket.emit("send-location", {
                latitude,
                longitude,
                accuracy,
                timestamp: now
            });

            lastSentTime = now;
            console.log(`Location sent: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${accuracy}m)`);
        },
        (error) => {
            console.error("Geolocation error:", error);
            
            let errorMessage = "Location access denied";
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = "Location permission denied. Please enable location access.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = "Location information unavailable.";
                    break;
                case error.TIMEOUT:
                    errorMessage = "Location request timed out.";
                    break;
            }
            
            showError(errorMessage); // From the HTML we improved
        },
        {
            enableHighAccuracy: false,
            timeout: 30000,
            maximumAge: 60000
        }
    );
} else {
    showError("Geolocation is not supported by this browser.");
}

// Initialize the map
const map = L.map("map").setView([0, 0], 2);

// Add tile layer with better styling
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
    minZoom: 2
}).addTo(map);

// Store markers and user info
const markers = {};
const userColors = ['red', 'blue', 'green', 'orange', 'violet', 'darkred', 'lightred', 'beige', 'darkblue', 'darkgreen'];
let colorIndex = 0;

// Create custom marker icons
function createUserIcon(color, isCurrentUser = false) {
    return L.divIcon({
        html: `<div style="
            background-color: ${color};
            width: ${isCurrentUser ? '16px' : '12px'};
            height: ${isCurrentUser ? '16px' : '12px'};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [isCurrentUser ? 20 : 16, isCurrentUser ? 20 : 16],
        className: 'custom-marker-icon'
    });
}

// Handle incoming location data
socket.on("receive-location", (data) => {
    const { id, latitude, longitude, accuracy, timestamp } = data;
    
    // Check if this is the current user
    const isCurrentUser = (id === socket.id);
    
    // Center map on first location or current user's location
    if (isFirstLocation || (isCurrentUser && currentUser)) {
        map.setView([latitude, longitude], 15);
        isFirstLocation = false;
    }

    // Update or create marker
    if (markers[id]) {
        markers[id].marker.setLatLng([latitude, longitude]);
        
        // Update accuracy circle if it exists
        if (markers[id].accuracyCircle && accuracy) {
            markers[id].accuracyCircle.setLatLng([latitude, longitude]);
            markers[id].accuracyCircle.setRadius(accuracy);
        }
    } else {
        // Assign color to new user
        const userColor = userColors[colorIndex % userColors.length];
        colorIndex++;

        // Create marker
        const marker = L.marker([latitude, longitude], {
            icon: createUserIcon(userColor, isCurrentUser)
        }).addTo(map);

        // Add popup with user info
        const popupContent = `
            <b>${isCurrentUser ? 'You' : 'User ' + id.slice(-4)}</b><br>
            Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}<br>
            ${accuracy ? `Accuracy: ±${Math.round(accuracy)}m<br>` : ''}
            ${timestamp ? `Updated: ${new Date(timestamp).toLocaleTimeString()}` : ''}
        `;
        marker.bindPopup(popupContent);

        // Add accuracy circle for current user
        let accuracyCircle = null;
        if (isCurrentUser && accuracy) {
            accuracyCircle = L.circle([latitude, longitude], {
                radius: accuracy,
                color: userColor,
                fillColor: userColor,
                fillOpacity: 0.1,
                weight: 1
            }).addTo(map);
        }

        markers[id] = {
            marker,
            accuracyCircle,
            color: userColor,
            isCurrentUser
        };
    }
});

// Handle user disconnection
socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        // Remove marker
        map.removeLayer(markers[id].marker);
        
        // Remove accuracy circle if it exists
        if (markers[id].accuracyCircle) {
            map.removeLayer(markers[id].accuracyCircle);
        }
        
        delete markers[id];
        console.log(`User ${id.slice(-4)} disconnected`);
    }
});

// Handle active users list
socket.on("active-users", (users) => {
    console.log(`Active users: ${users.length}`);
});

// Handle server errors
socket.on("error", (error) => {
    console.error("Server error:", error);
    showError(error);
});

// Map controls and features
map.on('click', function(e) {
    console.log(`Map clicked at: ${e.latlng.lat}, ${e.latlng.lng}`);
});

// Add zoom control customization
map.zoomControl.setPosition('topright');

// Add scale control
L.control.scale({
    position: 'bottomleft'
}).addTo(map);

console.log("Real-time tracking initialized");
