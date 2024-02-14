const WebSocket = require('ws');
const http = require('http');
const mysql = require('mysql2');

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });
const rooms = new Map();
const { v4: uuidv4 } = require('uuid');

const dbConnection = mysql.createPool({
  host: 'hostname',
  port: 'port',
  user: 'user',
  password: 'password',
  database: 'database',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'link');
  const roomId = url.searchParams.get('roomId') || 'default';
  const userId = url.searchParams.get('userId') || 'anonymous';

  console.log(`${userId} connected to room ${roomId}`);
  logConnectionToDatabase(userId, roomId);

  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }

  rooms.get(roomId).add(ws);

  ws.on('message', (message) => {
    console.log(`Received message in room ${roomId}: ${message}`);
    const createAt = new Date().toISOString();
    const chatId = uuidv4();
    const chatStatus = 1;
    saveMessageToDatabase(chatId, roomId, userId, message, createAt, chatStatus);

    // Broadcast the message to all clients in the room
    rooms.get(roomId).forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        console.log(`Sending message to client in room ${roomId} : ${message}`);
        client.send(`${message}`);
      }
    });

    // ws.send(`${message}`);
  });

  ws.on('close', () => {
    console.log(`Client disconnected from room ${roomId}`);
    rooms.get(roomId).delete(ws);
  });

  // Send stored messages when a user joins
  sendStoredMessages(ws, roomId);
});

function saveMessageToDatabase(chatId, roomId, userId, message, createAt, chatStatus) {
  const messageData = JSON.parse(message);

  dbConnection.query(
    'INSERT INTO chat_messages (chat_id, chat_laporan_id, chat_user_id, chat_message, chat_create_at, chat_status) VALUES (?, ?, ?, ?, ?, ?)',
    [chatId, roomId, userId, messageData.message, createAt, chatStatus],
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
            chatStatus : row.chat_status,
          };
          client.send(JSON.stringify(storedMessage));
        });
      }
    }
  );
}

function logConnectionToDatabase( userId, roomId) {
  const chatId = uuidv4();
  const connectionTime = new Date();
  const sql = 'INSERT INTO log_chat_main (log_chat_id, log_chat_user_id, log_chat_laporan_id ,log_chat_time) VALUES (?, ?, ?, ?)';
  const values = [chatId, userId, roomId, connectionTime];

  dbConnection.query(sql, values, (error, results, fields) => {
    if (error) {
      console.error('Error executing query', error);
    } else {
      console.log('WebSocket connection logged to the database');

      const sqlUpdate =
      'UPDATE chat_messages SET chat_status = 0 WHERE chat_laporan_id = ? ';
      const valuesUpdate = [roomId]
      dbConnection.query(sqlUpdate, valuesUpdate, (updateError, updateResults) => {
        if (updateError) {
          console.error('Error updating chat_status:', updateError);
        } else {
          console.log('Chat status updated to 0 for another user.');
        }
      });
    }
  });
}

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

server.listen(8082, () => {
  console.log('WebSocket server listening on port 8082');
});
