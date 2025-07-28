# 🌍 Real-Time Location Tracker

A real-time location tracking application that allows multiple users to share and view their live locations on an interactive map. Built with Node.js, Express, Socket.io, and Leaflet.js.

## ✨ Features

📍 **Real-time location sharing** - Live GPS tracking with instant updates
🗺️ **Interactive map** - Powered by Leaflet.js with OpenStreetMap tiles
👥 **Multi-user support** - Multiple users can track each other simultaneously
🔄 **Live updates** - Locations update automatically as users move
📱 **Mobile responsive** - Works seamlessly on desktop and mobile devices
🚀 **Real-time communication** - Built with Socket.io for instant data sync
🎯 **Automatic centering** - Map centers on user's current location

## 🛠️ Technologies Used

- **Backend:** Node.js, Express.js
- **Real-time Communication:** Socket.io
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Mapping:** Leaflet.js with OpenStreetMap
- **Templating:** EJS
- **Geolocation:** HTML5 Geolocation API

## 🚀 Quick Start

## 🚀 Live Demo

[Click here to try it out!](https://realtime-location-tracker-qcds.onrender.com)


### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- Modern web browser with location services enabled

### Installation

1. **git clone https://github.com/souvikofficial/RealTime-Location-Tracker.git
   cd RealTime-Location-Tracker**
2. **npm install**
3. **node app.js**
4. **Open your browser** : http://localhost:3000
5. **Allow location access** when prompted by your browser


## 📁 Project Structure

RealTime-Location-Tracker/
├── app.js # Main server file
├── package.json # Dependencies and scripts
├── views/
│ └── index.ejs # Main HTML template
├── public/
│ └── script.js # Client-side JavaScript
└── README.md # This file


## 🎯 How It Works

1. **User Connection**: When a user visits the site, they connect to the Socket.io server
2. **Location Request**: Browser requests user's location using HTML5 Geolocation API
3. **Real-time Sharing**: User's coordinates are sent to server via Socket.io
4. **Live Updates**: Server broadcasts location updates to all connected users
5. **Map Visualization**: Each user's location appears as a marker on the interactive map

## 📱 Usage

1. **Open the application** in your web browser
2. **Allow location access** when prompted
3. **Share the URL** with friends/team members
4. **Watch live locations** update on the map in real-time
5. **Markers automatically update** as users move around

## ⚙️ Configuration

### Server Port
// Change port in app.js (default: 3000)
server.listen(3000, () => {
console.log("Server running on port 3000");
});

### Geolocation Settings
// Modify tracking accuracy in script.js
{
enableHighAccuracy: true, // Use GPS for high accuracy
timeout: 10000, // 10 second timeout
maximumAge: 0 // Don't use cached location
}

## 🔧 Troubleshooting

### Location Not Working?
✅ Ensure location services are enabled in your browser
✅ Allow location access when prompted
✅ Check if location services are enabled in your OS settings
✅ Use HTTPS in production (required for geolocation)

### Connection Issues?
✅ Make sure the server is running on the correct port
✅ Check if port 3000 is available
✅ Verify Socket.io connection in browser console
