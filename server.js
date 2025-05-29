const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const players = {};

io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  socket.on("join", ({ username }) => {
    players[socket.id] = { id: socket.id, username };
    io.emit("playerData", Object.values(players));
  });

  socket.on("leave", () => {
    delete players[socket.id];
    io.emit("playerLeft", socket.id);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("playerLeft", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Multiplayer server running on http://localhost:3000");
});
