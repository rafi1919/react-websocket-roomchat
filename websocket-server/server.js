const WebSocket = require('ws');
const http = require('http');
const mysql = require('mysql2');

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });
const rooms = new Map();
const { v4: uuidv4 } = require('uuid');

const dbConnection = mysql.createPool({
    host: '172.72.1.138',
    port: '49162',
    user: 'root',
    password: 'g2r3J*M2',
    database: 'wbs_dev',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

wss.on("connection", (ws, req) => {
    const url = new URL(req.url, 'http://localhost:8082');
    const roomId = url.searchParams.get('roomId') || 'default';
    const userId = url.searchParams.get('userId') || 'anonymous';
    

    console.log(`${userId} connected to room ${roomId}`);

    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
    }

    rooms.get(roomId).add(ws);

    ws.on('message', (message) => {
        console.log(`Received message in room ${roomId}: ${message}`);
        const createAt = new Date().toISOString();
        const chatId = uuidv4();

        saveMessageToDatabase(chatId, roomId, userId, message, createAt);

        const messageContent = JSON.parse(message).message;
        rooms.get(roomId).forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(messageContent);
            }
        });

        ws.send(`${messageContent}`);
    });

    ws.on('close', () => {
        console.log(`Client disconnected from room ${roomId}`);
        rooms.get(roomId).delete(ws);
    });

    // Send stored messages when a user joins
    sendStoredMessages(ws, roomId);
});

function saveMessageToDatabase(chatId, roomId, userId, message, createAt) {

    const messageData = JSON.parse(message)

    dbConnection.query(
        'INSERT INTO chat_messages (chat_id, chat_laporan_id, chat_user_id, chat_message, chat_create_at) VALUES (?, ?, ?, ?, ?)',
        [chatId, roomId, userId, messageData.message, createAt],
        (err, results) => {
            if (err) {
                console.error('Error saving message to database:', err);
            } else {
                console.log('Message saved to the database');
            }
        }
    );
}

function sendStoredMessages(client, roomId) {
    dbConnection.query(
        'SELECT * FROM chat_messages WHERE chat_laporan_id = ? ORDER BY chat_create_at',
        [roomId],
        (err, results) => {
            if (err) {
                console.error(err);
            } else {
                results.forEach((row) => {
                    const storedMessage = {
                        chatId: row.chat_id,
                        roomId: row.chat_laporan_id,
                        userId: row.chat_user_id,
                        message: row.chat_message,
                        createAt: row.chat_create_at,

                    };
                    client.send(JSON.stringify(storedMessage));
                });
            }
        }
    );
}

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

server.listen(8082, () => {
    console.log('WebSocket server listening on port 8082');
});
