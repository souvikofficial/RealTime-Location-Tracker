const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// Environment configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

// CORS configuration (more secure)
const corsOptions = {
  origin: NODE_ENV === 'production' ? 'https://yourdomain.com' : '*',
  methods: ['GET', 'POST'],
  credentials: true
};
app.use(cors(corsOptions));

// Creating server
const server = http.createServer(app);
const io = socketio(server, {
  cors: corsOptions
});

// Store active users
const activeUsers = new Map();

// Socket.IO connection handling
io.on("connection", function(socket){
    console.log(`User connected: ${socket.id} at ${new Date().toISOString()}`);
    
    // Add user to active users
    activeUsers.set(socket.id, {
        id: socket.id,
        connectedAt: new Date(),
        lastLocation: null
    });

    // Send current active users to new user
    socket.emit("active-users", Array.from(activeUsers.keys()));

    socket.on("send-location", function(data){
        try {
            // Validate location data
            if (!data || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
                socket.emit("error", "Invalid location data");
                return;
            }

            // Check for reasonable coordinates
            if (Math.abs(data.latitude) > 90 || Math.abs(data.longitude) > 180) {
                socket.emit("error", "Invalid coordinates");
                return;
            }

            // Update user's last location
            if (activeUsers.has(socket.id)) {
                activeUsers.get(socket.id).lastLocation = {
                    ...data,
                    timestamp: new Date()
                };
            }

            // Broadcast to all clients
            io.emit("receive-location", {
                id: socket.id, 
                ...data,
                timestamp: new Date().toISOString()
            });

            console.log(`Location update from ${socket.id}: ${data.latitude}, ${data.longitude}`);
        } catch (error) {
            console.error(`Error handling location from ${socket.id}:`, error);
            socket.emit("error", "Failed to process location");
        }
    });

    socket.on("disconnect", function() {
        try {
            // Remove user from active users
            activeUsers.delete(socket.id);
            
            // Notify other clients
            io.emit("user-disconnected", socket.id);
            
            console.log(`User disconnected: ${socket.id} at ${new Date().toISOString()}`);
        } catch (error) {
            console.error(`Error handling disconnect for ${socket.id}:`, error);
        }
    });

    // Handle connection errors
    socket.on("error", (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
    });
});

// Middleware
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json()); // Parse JSON bodies

// Routes
app.get("/", (req, res) => {
    try {
        res.render("index", { 
            title: "Real Time Tracking App",
            activeUsers: activeUsers.size
        });
    } catch (error) {
        console.error("Error rendering index:", error);
        res.status(500).send("Server Error");
    }
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        activeUsers: activeUsers.size,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Real Time Tracking App is listening on port ${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`📍 Server started at ${new Date().toISOString()}`);
});
