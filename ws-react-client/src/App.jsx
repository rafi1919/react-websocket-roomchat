import React, { useState, useEffect } from 'react';

const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [isInChat, setIsInChat] = useState(false);

  const connectToChat = () => {
    if (roomId.trim() !== '') {
      const newSocket = new WebSocket(`ws://localhost:8080/?roomId=${roomId}`);

      newSocket.addEventListener('open', () => {
        console.log('WebSocket connection opened');
        setSocket(newSocket);
        setIsInChat(true);
      });

      newSocket.addEventListener('message', (event) => {
        const messageData = event.data;
        if (messageData instanceof Blob) {
          const reader = new FileReader();
          reader.onload = function () {
            const textMessage = reader.result;
            setMessages((prevMessages) => [...prevMessages, textMessage]);
          };
          reader.readAsText(messageData);
        } else {
          setMessages((prevMessages) => [...prevMessages, messageData]);
        }
      });

      newSocket.addEventListener('error', (error) => {
        console.error('WebSocket encountered error:', error);
      });

      return () => {
        newSocket.close();
      };
    }
  };

  const sendMessage = () => {
    if (socket && inputMessage.trim() !== '') {
      socket?.send(inputMessage);
      setInputMessage('');
    }
  };

  return (
    <div>
      {!isInChat ? (
        <div>
          <label>Enter Room ID:</label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={connectToChat}>Join Chat</button>
        </div>
      ) : (
        <div>
          <div>
            <ul>
              {messages.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </div>
          <div>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;
