import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [isInChat, setIsInChat] = useState(false);
  const [userId, setUserId] = useState('');

  const connectToChat = () => {
    if (roomId.trim() !== '' && userId.trim() !== '') {
      const newSocket = new WebSocket(
        `ws://localhost:8082/?roomId=${roomId}&userId=${userId}`
      );

      newSocket.addEventListener('open', () => {
        console.log('WebSocket connection opened');
        setSocket(newSocket);
        setIsInChat(true);
      });

      newSocket.addEventListener('message', (event) => {
        const messageData = event.data;
        console.log('WebSocket message received:', messageData);
        if (messageData instanceof Blob) {
          const reader = new FileReader();
          reader.onload = function () {
            const textMessage = reader.result;
            setMessages((prevMessages) => [...prevMessages, textMessage]);
          };
          reader.readAsText(messageData);
        } else {
          setMessages((prevMessages) => [
            ...prevMessages,
            JSON.parse(messageData)?.message,
          ]);
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
      const createAt = new Date().toISOString();
      const chatId = uuidv4();

      const messageData = {
        chatId,
        userId,
        roomId,
        message: inputMessage,
        createAt,
        chatStatus:2,
      };

      socket.send(JSON.stringify(messageData));
      setInputMessage('');
    }
  };

  return (
    <div>
      {!isInChat ? (
        <div>
          <label>Enter Your Username:</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
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
