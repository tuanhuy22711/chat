import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getChatSessions,
  getChatMessages,
  sendMessage,
  createNewSession,
  deleteSession,
  getAvailableModels,
  getUsageStats,
} from "../controllers/aiChat.controller.js";

const router = express.Router();

// Get all chat sessions for user
router.get("/sessions", protectRoute, getChatSessions);

// Get messages for specific session
router.get("/sessions/:sessionId/messages", protectRoute, getChatMessages);

// Send message to AI
router.post("/send", protectRoute, sendMessage);

// Create new chat session
router.post("/sessions", protectRoute, createNewSession);

// Delete chat session
router.delete("/sessions/:sessionId", protectRoute, deleteSession);

// Get available AI models
router.get("/models", protectRoute, getAvailableModels);

// Get user's usage statistics
router.get("/usage", protectRoute, getUsageStats);

export default router;
