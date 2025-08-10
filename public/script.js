const socket = io();
let currentUser = null;
let isFirstLocation = true;

// Connection handling with status updates
socket.on("connect", () => {
    console.log("Connected to server");
    updateStatus('connected');
    hideLoading();
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
            
            showError(errorMessage);
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

// Initialize map with better styling
const map = L.map("map").setView([0, 0], 2);

// Add CartoDB Voyager tiles (better looking than default OpenStreetMap)
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
    minZoom: 2
}).addTo(map);

// Store markers and user info
const markers = {};
const userColors = ['red', 'blue', 'green', 'orange', 'violet', 'darkred', 'lightred', 'beige', 'darkblue', 'darkgreen'];
let colorIndex = 0;

// Create custom marker icons
function createUserIcon(color, isCurrentUser = false) {
    const size = isCurrentUser ? 16 : 12;
    const borderSize = isCurrentUser ? 20 : 16;
    
    return L.divIcon({
        html: `<div style="
            background-color: ${color};
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [borderSize, borderSize],
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
        
        // Update popup content
        const popupContent = `
            <b>${isCurrentUser ? 'You' : 'User ' + id.slice(-4)}</b><br>
            Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}<br>
            ${accuracy ? `Accuracy: ±${Math.round(accuracy)}m<br>` : ''}
            Updated: ${new Date(timestamp).toLocaleTimeString()}
        `;
        markers[id].marker.setPopupContent(popupContent);
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
        
        // Update user count
        updateUserCount(Object.keys(markers).length);
    }
});

// Handle active users list
socket.on("active-users", (users) => {
    console.log(`Active users: ${users.length}`);
    updateUserCount(users.length);
});

// Handle server errors
socket.on("error", (error) => {
    console.error("Server error:", error);
    showError(error);
});

// Add zoom control customization
map.zoomControl.setPosition('topright');

// Add scale control
L.control.scale({
    position: 'bottomleft'
}).addTo(map);

console.log("Real-time tracking initialized");
