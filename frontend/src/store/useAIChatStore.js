import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

export const useAIChatStore = create((set, get) => ({
  sessions: [],
  currentSession: null,
  messages: [],
  models: [],
  usageStats: null,
  isLoading: false,
  isSending: false,
  
  // Get chat sessions
  getSessions: async (page = 1) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/ai/sessions?page=${page}&limit=20`);
      
      if (page === 1) {
        set({ sessions: res.data.sessions });
      } else {
        set((state) => ({
          sessions: [...state.sessions, ...res.data.sessions],
        }));
      }
    } catch (error) {
      console.error("Error fetching AI chat sessions:", error);
      toast.error("Failed to load chat sessions");
    } finally {
      set({ isLoading: false });
    }
  },

  // Get messages for a session
  getMessages: async (sessionId) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/ai/sessions/${sessionId}/messages`);
      set({ 
        messages: res.data.messages,
        currentSession: sessionId,
      });
    } catch (error) {
      console.error("Error fetching AI chat messages:", error);
      toast.error("Failed to load messages");
    } finally {
      set({ isLoading: false });
    }
  },

  // Send message to AI
  sendMessage: async (sessionId, message, model = null) => {
    if (!message.trim()) return;

    // Prevent duplicate sends
    if (get().isSending) return;

    set({ isSending: true });
    
    // Add user message optimistically
    const userMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
      isOptimistic: true,
    };
    
    set((state) => ({
      messages: [...state.messages, userMessage],
    }));

    try {
      const res = await axiosInstance.post("/ai/send", {
        sessionId,
        message: message.trim(),
        model,
      });

      // Replace ALL optimistic messages with server response
      set((state) => ({
        messages: [
          ...state.messages.filter(msg => !msg.isOptimistic), // Remove all optimistic messages
          res.data.userMessage,
          res.data.assistantMessage,
        ],
        currentSession: res.data.sessionId,
      }));

      // Update session in sessions list
      set((state) => ({
        sessions: state.sessions.map((session) =>
          session.sessionId === res.data.sessionId
            ? {
                ...session,
                lastMessage: res.data.assistantMessage.content.substring(0, 100) + "...",
                messageCount: session.messageCount + 2,
                updatedAt: new Date().toISOString(),
              }
            : session
        ),
      }));

      return res.data.sessionId;
    } catch (error) {
      console.error("Error sending message to AI:", error);
      toast.error("Failed to send message");
      
      // Remove optimistic messages on error
      set((state) => ({
        messages: state.messages.filter(msg => !msg.isOptimistic),
      }));
    } finally {
      set({ isSending: false });
    }
  },

  // Create new session
  createNewSession: async (title = null, model = null) => {
    try {
      const res = await axiosInstance.post("/ai/sessions", {
        title,
        model,
      });

      const newSession = {
        sessionId: res.data.sessionId,
        title: res.data.title,
        messageCount: 0,
        lastMessage: null,
        createdAt: res.data.createdAt,
        updatedAt: res.data.createdAt,
        metadata: res.data.metadata,
      };

      set((state) => ({
        sessions: [newSession, ...state.sessions],
        currentSession: res.data.sessionId,
        messages: [],
      }));

      return res.data.sessionId;
    } catch (error) {
      console.error("Error creating new AI chat session:", error);
      toast.error("Failed to create new chat session");
    }
  },

  // Delete session
  deleteSession: async (sessionId) => {
    try {
      await axiosInstance.delete(`/ai/sessions/${sessionId}`);
      
      set((state) => ({
        sessions: state.sessions.filter((s) => s.sessionId !== sessionId),
        currentSession: state.currentSession === sessionId ? null : state.currentSession,
        messages: state.currentSession === sessionId ? [] : state.messages,
      }));

      toast.success("Chat session deleted");
    } catch (error) {
      console.error("Error deleting AI chat session:", error);
      toast.error("Failed to delete chat session");
    }
  },

  // Get available models
  getModels: async () => {
    try {
      const res = await axiosInstance.get("/ai/models");
      set({ models: res.data.models });
    } catch (error) {
      console.error("Error fetching AI models:", error);
    }
  },

  // Get usage statistics
  getUsageStats: async () => {
    try {
      const res = await axiosInstance.get("/ai/usage");
      set({ usageStats: res.data });
    } catch (error) {
      console.error("Error fetching usage stats:", error);
    }
  },

  // Set current session
  setCurrentSession: (sessionId) => {
    set({ currentSession: sessionId, messages: [] });
  },

  // Clear current session
  clearCurrentSession: () => {
    set({ currentSession: null, messages: [] });
  },

  // Socket event handlers
  subscribeToAIUpdates: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    // Clean up existing listeners first
    socket.off("newAIMessage");

    socket.on("newAIMessage", (data) => {
      const { sessionId, userMessage, assistantMessage } = data;
      
      // Only update if we're currently viewing this session
      const currentState = get();
      if (currentState.currentSession === sessionId) {
        // Don't add if messages already exist (prevent duplicates)
        const lastMessage = currentState.messages[currentState.messages.length - 1];
        const isDuplicate = lastMessage && 
          lastMessage.content === assistantMessage.content && 
          lastMessage.role === 'assistant';
        
        if (!isDuplicate) {
          set((state) => ({
            messages: [...state.messages, assistantMessage],
          }));
        }
      }
    });
  },

  unsubscribeFromAIUpdates: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    socket.off("newAIMessage");
  },
}));
