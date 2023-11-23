const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });
const rooms = new Map(); // Map to store WebSocket clients for each room

wss.on("connection", (ws, req) => {
    const url = new URL(req.url, 'http://localhost:8080');
    const roomId = url.searchParams.get('roomId') || 'default';

    console.log(`New client connected to room ${roomId}`);

    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
    }

    // Add the client to the room
    rooms.get(roomId).add(ws);

    ws.on('message', (message) => {
        console.log(`Received message in room ${roomId}: ${message}`);

        // Broadcast the message to all clients in the room
        rooms.get(roomId).forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });

        // Echo the message back to the sender
        ws.send(`You said in room ${roomId}: ${message}`);
    });

    ws.on('close', () => {
        console.log(`Client disconnected from room ${roomId}`);
        rooms.get(roomId).delete(ws);
    });
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

server.listen(8080, () => {
    console.log('WebSocket server listening on port 8080');
});
