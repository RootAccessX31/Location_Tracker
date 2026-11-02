const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store latest user locations in memory
const userLocations = {};

// API endpoint for Android app to post location
app.post('/api/location', (req, res) => {
    const { userId, latitude, longitude } = req.body;

    if (!userId || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    const data = { userId, latitude, longitude, timestamp: new Date() };
    userLocations[userId] = data;

    // Broadcast updated location to all connected dashboard clients via WebSockets
    io.emit('locationUpdate', data);

    console.log(`[Location Update] User ${userId}: ${latitude}, ${longitude}`);
    return res.status(200).json({ status: 'success' });
});

// Socket setup for initial connection
io.on('connection', (socket) => {
    console.log('Dashboard connected:', socket.id);
    // Send existing user locations to newly opened dashboard
    socket.emit('initialLocations', userLocations);
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});