const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const cors = require("cors");

//enabling for all routing
app.use(cors());

//creating server
const server = http.createServer(app);
const io = socketio(server);

io.on("connection", function(socket){
    console.log("A User Connected");

    socket.on("send-location", function(data){
        io.emit("receive-location", {id:socket.id, ...data});
    });

    socket.on("disconnect",function() {
        io.emit("user-disconnected",socket.id);
        console.log("User Disconnected");
    });
    console.log("connected");
});

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname, "public")));


app.get("/",(req,res)=>{
    res.render("index.ejs");
});


app.listen(3000,()=>{
    console.log("App is Listening to your Port 3000");
});