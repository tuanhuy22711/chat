import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
     origin: [
      "https://chat-zeta-murex.vercel.app",
      "https://bloggers-secretary-bones-donated.trycloudflare.com",
      "http://localhost:5173" 
    ],
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Join user to their group rooms
  socket.on("joinGroups", (groupIds) => {
    groupIds.forEach((groupId) => {
      socket.join(`group_${groupId}`);
    });
  });

  // Leave group room
  socket.on("leaveGroup", (groupId) => {
    socket.leave(`group_${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Helper function to emit to group
export function emitToGroup(groupId, event, data) {
  io.to(`group_${groupId}`).emit(event, data);
}

export { io, app, server };
