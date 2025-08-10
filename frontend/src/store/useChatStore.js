import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  markMessagesAsRead: async (userId) => {
    try {
      await axiosInstance.post(`/messages/read/${userId}`);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      // Check if message is part of current conversation
      const isMessageFromConversation = 
        (newMessage.senderId._id === selectedUser._id) || 
        (newMessage.receiverId === selectedUser._id);
        
      if (!isMessageFromConversation) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });

    socket.on("messagesMarkedAsRead", (data) => {
      const { messages, selectedUser } = get();
      if (selectedUser && data.conversationWith === selectedUser._id) {
        // Update messages status to read for messages sent to the other user
        const updatedMessages = messages.map((message) => {
          if (message.receiverId === selectedUser._id && message.status !== "read") {
            return { ...message, status: "read" };
          }
          return message;
        });
        set({ messages: updatedMessages });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messagesMarkedAsRead");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
