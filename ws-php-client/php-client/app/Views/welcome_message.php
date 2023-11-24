<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebSocket Chat</title>
</head>
<body>
  <div id="chat-container">
    <div id="connection-form">
      <label for="username">Enter Your Username:</label>
      <input type="text" id="username" />
      <label for="room-id">Enter Room ID:</label>
      <input type="text" id="room-id" />
      <button onclick="connectToChat()">Join Chat</button>
    </div>
    <div id="chat-box" style="display: none;">
      <ul id="messages-list"></ul>
      <div>
        <input type="text" id="message-input" />
        <button onclick="sendMessage()">Send</button>
      </div>
    </div>
  </div>

  <script>
    let socket;
    const messagesList = document.getElementById('messages-list');
    const connectionForm = document.getElementById('connection-form');
    const chatBox = document.getElementById('chat-box');
    const usernameInput = document.getElementById('username');
    const roomIdInput = document.getElementById('room-id');
    const messageInput = document.getElementById('message-input');

    function connectToChat() {
      const username = usernameInput.value.trim();
      const roomId = roomIdInput.value.trim();

      if (username !== '' && roomId !== '') {
        socket = new WebSocket(`ws://localhost:8082/?roomId=${roomId}&userId=${username}`);

        socket.addEventListener('open', () => {
          console.log('WebSocket connection opened');
          connectionForm.style.display = 'none';
          chatBox.style.display = 'block';
        });

        socket.addEventListener('message', (event) => {
          const messageData = JSON.parse(event.data);
          appendMessage(`${messageData.userId}: ${messageData.message}`);
        });

        socket.addEventListener('error', (error) => {
          console.error('WebSocket encountered an error:', error);
        });

        socket.addEventListener('close', () => {
          console.log('WebSocket connection closed');
          connectionForm.style.display = 'block';
          chatBox.style.display = 'none';
        });
      }
    }

    function sendMessage() {
      const message = messageInput.value.trim();

      if (socket && message !== '') {
        const messageData = {
          userId: usernameInput.value.trim(),
          roomId: roomIdInput.value.trim(),
          message,
        };

        socket.send(JSON.stringify(messageData));
        appendMessage(`You: ${message}`);
        messageInput.value = '';
      }
    }

    function appendMessage(message) {
      const li = document.createElement('li');
      li.textContent = message;
      messagesList.appendChild(li);
    }
  </script>
</body>
</html>
