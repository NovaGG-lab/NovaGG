const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const players = {};
const bannedWords = ['fuck', 'shit', 'bitch', 'ass'];

function filterMessage(message) {
  const regex = new RegExp(bannedWords.join('|'), 'gi');
  return message.replace(regex, '****');
}

io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  socket.on("join", ({ username }) => {
  players[socket.id] = {
    id: socket.id,
    username,
    position: { x: 0, z: 0 },
  };
  io.emit("playerData", Object.values(players));
  io.emit("system", `${username} joined the game!`);
});


  socket.on("move", ({ x, z, rotationY }) => {
  if (players[socket.id]) {
    players[socket.id].position = { x, z };
    players[socket.id].rotationY = rotationY;
    socket.broadcast.emit("playerMoved", { id: socket.id, position: { x, z }, rotationY });
  }
});


  socket.on("chat", (msg) => {
    const player = players[socket.id];
    if (player) {
      const cleanMsg = filterMessage(msg);
      io.emit("chat", { username: player.username, message: cleanMsg });
    }
  });

  const disconnectPlayer = () => {
    delete players[socket.id];
    io.emit("playerLeft", socket.id);
  };

  socket.on("leave", disconnectPlayer);
  socket.on("disconnect", disconnectPlayer);
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
