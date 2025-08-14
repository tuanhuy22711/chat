import express from "express";
import dotenv from "dotenv";

dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";

import path from "path";

import { connectDB } from "./lib/db.js";
import connectRedis from "./lib/redis.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js";
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";
import cacheRoutes from "./routes/cache.route.js";
import streamRoutes from "./routes/stream.route.js";
import aiChatRoutes from "./routes/aiChat.route.js";
import metricsRoutes, { metricsMiddleware } from "./middleware/metrics.middleware.js";
import { app, server } from "./lib/socket.js";


const PORT = process.env.PORT;
const __dirname = path.resolve();

const parsedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const defaultOrigins = ["http://localhost:5173", "http://localhost:3000"];
const allowedOrigins = parsedOrigins.length ? parsedOrigins : defaultOrigins;

// Increase payload limit for image uploads (50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // Cho phép gửi cookie/token
  })
);

// Add metrics middleware
app.use(metricsMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/cache", cacheRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api/ai", aiChatRoutes);

// Metrics and health endpoints
app.use("/", metricsRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
  connectRedis();
});
