const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const port = process.env.PORT || 3000;

http.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

const { Server } = require('socket.io');

const server = http.createServer(app);

const players = {};
const bannedWords = ['fuck', 'shit', 'bitch', 'ass'];

app.use(express.static(__dirname));

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
