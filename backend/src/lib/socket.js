import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";
import { cache, CACHE_KEYS, CACHE_TTL } from "./redis.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const defaultOrigins = [
  "https://chat-zeta-murex.vercel.app",
  "https://bloggers-secretary-bones-donated.trycloudflare.com",
  "http://localhost:5173",
  "https://ambassador-seasons-surrey-age.trycloudflare.com",
  "http://47.236.3.65:5001"
];

const parsedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = parsedOrigins.length ? parsedOrigins : defaultOrigins;

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
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
  if (userId) {
    userSocketMap[userId] = socket.id;
    
    // Store user info in socket for easy access
    socket.userId = userId;
    socket.userName = socket.handshake.query.userName || "Unknown User";
    socket.userProfilePic = socket.handshake.query.userProfilePic || "";
    socket.isInCall = false;
    socket.pendingCall = false;
    
    // Cache online users
    const onlineUsers = Object.keys(userSocketMap);
    cache.set(CACHE_KEYS.ONLINE_USERS, onlineUsers, CACHE_TTL.SHORT);
  }

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

  // WebRTC signaling events
  socket.on("call:initiate", (data) => {
    const { targetUserId, callType, callerId } = data;
    const targetSocketId = getReceiverSocketId(targetUserId);
    
    if (targetSocketId) {
      // Check if target user is already in a call
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket && targetSocket.isInCall) {
        socket.emit("call:user-busy", { targetUserId });
        return;
      }
      
      // Send call invitation to target user
      io.to(targetSocketId).emit("call:incoming", {
        callerId,
        targetUserId,
        callType,
        callerName: socket.userName || "Unknown User",
        callerProfilePic: socket.userProfilePic || ""
      });
      
      // Mark both users as in call
      socket.isInCall = true;
      if (targetSocket) {
        targetSocket.pendingCall = true;
      }
    } else {
      socket.emit("call:user-offline", { targetUserId });
    }
  });

  socket.on("call:accept", (data) => {
    const { callerId, targetUserId } = data;
    const callerSocketId = getReceiverSocketId(callerId);
    
    if (callerSocketId) {
      const callerSocket = io.sockets.sockets.get(callerSocketId);
      if (callerSocket) {
        callerSocket.isInCall = true;
      }
      
      socket.isInCall = true;
      socket.pendingCall = false;
      
      io.to(callerSocketId).emit("call:accepted", {
        targetUserId,
        targetName: socket.userName || "Unknown User",
        targetProfilePic: socket.userProfilePic || ""
      });
    }
  });

  socket.on("call:reject", (data) => {
    const { callerId, targetUserId } = data;
    const callerSocketId = getReceiverSocketId(callerId);
    
    if (callerSocketId) {
      const callerSocket = io.sockets.sockets.get(callerSocketId);
      if (callerSocket) {
        callerSocket.isInCall = false;
      }
      
      io.to(callerSocketId).emit("call:rejected", { targetUserId });
    }
    
    socket.pendingCall = false;
  });

  socket.on("call:end", (data) => {
    // Notify all participants that call has ended
    Object.keys(userSocketMap).forEach((userId) => {
      const socketId = userSocketMap[userId];
      const userSocket = io.sockets.sockets.get(socketId);
      if (userSocket && userSocket.isInCall) {
        userSocket.isInCall = false;
        userSocket.pendingCall = false;
        io.to(socketId).emit("call:ended", {});
      }
    });
    
    socket.isInCall = false;
    socket.pendingCall = false;
  });

  socket.on("webrtc:signal", (data) => {
    const { signal, target } = data;
    
    // Forward WebRTC signaling data to the appropriate peer
    Object.keys(userSocketMap).forEach((userId) => {
      if (userId !== socket.userId) {
        const socketId = userSocketMap[userId];
        const userSocket = io.sockets.sockets.get(socketId);
        if (userSocket && userSocket.isInCall) {
          io.to(socketId).emit("webrtc:signal", { signal });
        }
      }
    });
  });

  // Handle sending messages
  socket.on("sendMessage", async (data) => {
    try {
      const { receiverId, text } = data;
      const senderId = userId;
      
      // Create and save message to database
      const newMessage = new Message({
        senderId,
        receiverId,
        text
      });
      
      await newMessage.save();
      
      // Populate sender information
      await newMessage.populate("senderId", "fullName profilePic");
      
      const receiverSocketId = getReceiverSocketId(receiverId);
      
      if (receiverSocketId) {
        // Send message to receiver
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
      
      // Also send back to sender for confirmation
      socket.emit("newMessage", newMessage);
      
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("messageError", { error: "Failed to send message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    
    // Update cached online users
    const onlineUsers = Object.keys(userSocketMap);
    cache.set(CACHE_KEYS.ONLINE_USERS, onlineUsers, CACHE_TTL.SHORT);
    
    io.emit("getOnlineUsers", onlineUsers);
  });
});

export function emitToGroup(groupId, event, data) {
  io.to(`group_${groupId}`).emit(event, data);
}

export { io, app, server };
