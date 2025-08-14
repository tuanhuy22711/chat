import AIChat from "../models/aiChat.model.js";
import aiService from "../lib/aiService.js";
import { io, getReceiverSocketId } from "../lib/socket.js";
import { cache, CACHE_KEYS, CACHE_TTL } from "../lib/redis.js";
import { metrics } from "../middleware/metrics.middleware.js";
import mongoose from "mongoose";

// Get user's AI chat sessions
export const getChatSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Try cache first
    const cacheKey = `${CACHE_KEYS.AI_CHAT_SESSIONS(userId)}:page:${page}`;
    const cachedSessions = await cache.get(cacheKey);
    
    if (cachedSessions) {
      return res.status(200).json(cachedSessions);
    }

    const sessions = await AIChat.find({ userId, isActive: true })
      .select('sessionId metadata createdAt updatedAt messages')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Add session titles and message counts
    const sessionsWithMetadata = sessions.map(session => ({
      _id: session._id,
      sessionId: session.sessionId,
      title: session.messages.length > 0 
        ? session.messages[0].content.substring(0, 50) + '...'
        : 'New Chat',
      messageCount: session.messages.length,
      lastMessage: session.messages.length > 0 
        ? { content: session.messages[session.messages.length - 1].content.substring(0, 100) + '...' }
        : null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      metadata: session.metadata,
    }));

    const result = {
      sessions: sessionsWithMetadata,
      currentPage: page,
      hasMore: sessions.length === limit,
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, result, CACHE_TTL.MEDIUM);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getChatSessions:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get specific chat session messages
export const getChatMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;

    // Try cache first
    const cacheKey = CACHE_KEYS.AI_CHAT_MESSAGES(userId, sessionId);
    const cachedMessages = await cache.get(cacheKey);
    
    if (cachedMessages) {
      return res.status(200).json(cachedMessages);
    }

    const chat = await AIChat.findOne({ userId, sessionId, isActive: true });
    
    if (!chat) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    const result = {
      sessionId: chat.sessionId,
      messages: chat.messages,
      metadata: chat.metadata,
    };

    // Cache for 2 minutes
    await cache.set(cacheKey, result, CACHE_TTL.SHORT * 2);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getChatMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send message to AI
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId, message, model } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Find or create chat session
    let chat = await AIChat.findOne({ userId, sessionId });
    
    if (!chat) {
      chat = new AIChat({
        userId,
        sessionId: sessionId || new mongoose.Types.ObjectId().toString(),
        messages: [],
        metadata: {
          model: model || process.env.AI_MODEL || 'gpt-3.5-turbo',
        },
      });
    }

    // Add user message
    const userMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };
    chat.messages.push(userMessage);

    // Prepare messages for AI (include system prompt and conversation history)
    const systemPrompt = aiService.createSystemPrompt(req.user);
    const messagesForAI = [
      { role: 'system', content: systemPrompt },
      ...chat.messages.slice(-10).map(msg => ({ // Last 10 messages for context
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Generate AI response
    const aiResponse = await aiService.generateResponse(messagesForAI, {
      model: chat.metadata.model,
    });

    // Add AI message
    const assistantMessage = {
      role: 'assistant',
      content: aiResponse.content,
      timestamp: new Date(),
    };
    chat.messages.push(assistantMessage);

    // Update metadata
    chat.metadata.totalTokens += aiResponse.tokens;
    chat.metadata.cost += parseFloat(aiResponse.cost);
    chat.metadata.model = aiResponse.model;

    await chat.save();

    // Clear relevant caches
    await cache.clearPattern(`ai_chat_sessions:${userId}:*`);
    await cache.clearPattern(`ai_chat_messages:${userId}:${sessionId}*`);

    // Update metrics
    metrics.messagesSent.inc({ type: 'ai_chat' });
    metrics.messagesReceived.inc({ type: 'ai_response' });

    // Don't send socket event if this is a user-initiated request
    // The frontend will handle the response directly
    
    res.status(200).json({
      sessionId: chat.sessionId,
      userMessage,
      assistantMessage,
      metadata: chat.metadata,
    });
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    res.status(500).json({ error: "Failed to send message to AI" });
  }
};

// Create new chat session
export const createNewSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, model } = req.body;

    const newSession = new AIChat({
      userId,
      sessionId: new mongoose.Types.ObjectId().toString(),
      messages: [],
      metadata: {
        model: model || process.env.AI_MODEL || 'gpt-3.5-turbo',
        title: title || 'New Chat',
      },
    });

    await newSession.save();

    // Clear cache
    await cache.clearPattern(`ai_chat_sessions:${userId}:*`);

    res.status(201).json({
      sessionId: newSession.sessionId,
      title: title || 'New Chat',
      metadata: newSession.metadata,
      createdAt: newSession.createdAt,
    });
  } catch (error) {
    console.error("Error in createNewSession:", error.message);
    res.status(500).json({ error: "Failed to create new chat session" });
  }
};

// Delete chat session
export const deleteSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;

    const chat = await AIChat.findOneAndUpdate(
      { userId, sessionId },
      { isActive: false },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    // Clear cache
    await cache.clearPattern(`ai_chat_sessions:${userId}:*`);
    await cache.clearPattern(`ai_chat_messages:${userId}:${sessionId}*`);

    res.status(200).json({ message: "Chat session deleted successfully" });
  } catch (error) {
    console.error("Error in deleteSession:", error.message);
    res.status(500).json({ error: "Failed to delete chat session" });
  }
};

// Get AI models available
export const getAvailableModels = async (req, res) => {
  try {
    const models = [
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'OpenAI',
        description: 'Fast and efficient for most conversations',
        costPer1kTokens: 0.002,
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'OpenAI',
        description: 'Most capable model for complex tasks',
        costPer1kTokens: 0.03,
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'Google',
        description: 'Google\'s advanced language model',
        costPer1kTokens: 0.001,
      },
    ];

    res.status(200).json({ models });
  } catch (error) {
    console.error("Error in getAvailableModels:", error.message);
    res.status(500).json({ error: "Failed to get available models" });
  }
};

// Get user's AI usage statistics
export const getUsageStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await AIChat.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMessages: { $sum: { $size: "$messages" } },
          totalTokens: { $sum: "$metadata.totalTokens" },
          totalCost: { $sum: "$metadata.cost" },
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalSessions: 0,
      totalMessages: 0,
      totalTokens: 0,
      totalCost: 0,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getUsageStats:", error.message);
    res.status(500).json({ error: "Failed to get usage statistics" });
  }
};
