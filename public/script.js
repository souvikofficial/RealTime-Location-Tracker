const socket = io.connect('http://localhost:3000');

socket.on("connect", () => {
    console.log("Connected to server");
});


if (navigator.geolocation){
    navigator.geolocation.watchPosition((position)=>
        {
        const {latitude,longitude} = position.coords;
        socket.emit("send-location",{latitude,longitude});
    }
    ,(error) => {
    console.error(error);
},
{
    enableHighAccuracy: false, // Try false first (uses WiFi instead of GPS)
    timeout: 30000,           // Increase to 30 seconds
    maximumAge: 60000         // Allow cached location
}

);
}

//intializing the map
const map = L.map("map").setView([0,0],4);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
    attribution:"OpenStreetMap"
}).addTo(map);

const markers = {};


//Handling incoming Location data
socket.on("receive-location",(data) => {
    const {id,latitude,longitude} = data;
    map.setView([latitude,longitude]);
    if(markers[id]){
        markers[id].setLatLng([latitude,longitude]);
    }
    else{
        markers[id] = L.marker([latitude,longitude]).addTo(map);
    }
});


//Handle user Disconnection
socket.on("user-disconnected",(id) => {
    if(markers[id]){
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});


console.log("Hello");