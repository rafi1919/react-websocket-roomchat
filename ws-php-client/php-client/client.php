<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebSocket Chat</title>
</head>
<body>
    <div id="chat"></div>
    <input type="text" id="messageInput" placeholder="Type your message">
    <button onclick="sendMessage()">Send</button>

    <script>
        const socket = new WebSocket('ws://localhost:8080');

        socket.addEventListener('open', (event) => {
            console.log('WebSocket connection opened');
        });

        socket.addEventListener('message', (event) => {
            const message = event.data;
            document.getElementById('chat').innerHTML += `<p>${message}</p>`;
        });

        socket.addEventListener('error', (error) => {
            console.error('WebSocket encountered error:', error);
        });

        function sendMessage() {
            const inputMessage = document.getElementById('messageInput').value;
            if (inputMessage.trim() !== '') {
                socket.send(inputMessage);
                document.getElementById('messageInput').value = '';
            }
        }
    </script>
</body>
</html>
