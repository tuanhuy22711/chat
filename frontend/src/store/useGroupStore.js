import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupsLoading: false,
  isGroupMessagesLoading: false,
  isCreatingGroup: false,

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error(error.response?.data?.error || "Failed to fetch groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  createGroup: async (groupData) => {
    set({ isCreatingGroup: true });
    try {
      const res = await axiosInstance.post("/groups/create", groupData);
      set((state) => ({
        groups: [res.data, ...state.groups],
        isCreatingGroup: false,
      }));
      toast.success("Group created successfully!");
      return res.data;
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error(error.response?.data?.error || "Failed to create group");
      set({ isCreatingGroup: false });
      throw error;
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: res.data });
    } catch (error) {
      console.error("Error fetching group messages:", error);
      toast.error(error.response?.data?.error || "Failed to fetch group messages");
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  sendGroupMessage: async (groupId, messageData) => {
    const { groupMessages } = get();
    const { authUser } = useAuthStore.getState();
    
    // Create optimistic message with temporary ID
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const optimisticMessage = {
      _id: tempId,
      ...messageData,
      senderId: authUser, // Use full authUser object
      groupId: groupId,
      messageType: "group",
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    console.log("Adding optimistic message:", optimisticMessage);
    set({ groupMessages: [...groupMessages, optimisticMessage] });

    try {
      const res = await axiosInstance.post(`/groups/${groupId}/messages`, messageData);
      console.log("Message sent successfully:", res.data);
      
      // Replace optimistic message with real message from server
      set((state) => ({
        groupMessages: state.groupMessages.map(msg => 
          msg._id === tempId ? res.data : msg
        ),
      }));
    } catch (error) {
      console.error("Error sending group message:", error);
      toast.error(error.response?.data?.error || "Failed to send message");
      
      // Remove optimistic message on error
      set((state) => ({
        groupMessages: state.groupMessages.filter(
          (msg) => msg._id !== tempId
        ),
      }));
    }
  },

  addGroupMember: async (groupId, userId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/members`, {
        userId,
      });
      
      // Update group in groups list
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? res.data : group
        ),
        selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup,
      }));
      
      toast.success("Member added successfully!");
    } catch (error) {
      console.error("Error adding group member:", error);
      toast.error(error.response?.data?.error || "Failed to add member");
    }
  },

  leaveGroup: async (groupId) => {
    try {
      await axiosInstance.delete(`/groups/${groupId}/leave`);
      
      // Remove group from list and clear selection if it was selected
      set((state) => ({
        groups: state.groups.filter((group) => group._id !== groupId),
        selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
        groupMessages: state.selectedGroup?._id === groupId ? [] : state.groupMessages,
      }));
      
      toast.success("Left group successfully!");
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error(error.response?.data?.error || "Failed to leave group");
    }
  },

  setSelectedGroup: (group) => {
    set({ selectedGroup: group });
  },

  markGroupMessagesAsRead: async (groupId) => {
    try {
      await axiosInstance.post(`/groups/${groupId}/read`);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  },

  // Socket event handlers
  subscribeToGroupMessages: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    socket.on("newGroupMessage", (message) => {
      console.log("Received new group message:", message);
      const { selectedGroup, groupMessages } = get();
      const { authUser } = useAuthStore.getState();
      
      if (selectedGroup && message.groupId === selectedGroup._id) {
        // Check if message already exists to prevent duplicates
        const messageExists = groupMessages.some(msg => msg._id === message._id);
        
        if (!messageExists) {
          console.log("Adding new group message to state");
          
          // If it's from current user, replace any optimistic message
          if (message.senderId._id === authUser._id) {
            set((state) => ({
              groupMessages: [
                ...state.groupMessages.filter(msg => !msg.isOptimistic),
                message
              ]
            }));
          } else {
            // For other users, just add the message
            set({ groupMessages: [...groupMessages, message] });
          }
        }
      }
    });

    socket.on("newGroup", (group) => {
      set((state) => ({
        groups: [group, ...state.groups],
      }));
      toast.success(`You were added to group: ${group.name}`);
    });

    socket.on("groupUpdated", (updatedGroup) => {
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === updatedGroup._id ? updatedGroup : group
        ),
        selectedGroup: state.selectedGroup?._id === updatedGroup._id ? updatedGroup : state.selectedGroup,
      }));
    });

    socket.on("messagesMarkedAsRead", (data) => {
      const { selectedGroup, groupMessages } = get();
      if (selectedGroup && data.groupId === selectedGroup._id) {
        // Update messages to include the new readBy entry
        const updatedMessages = groupMessages.map((message) => {
          // Only update messages that this user hasn't already marked as read
          const alreadyRead = message.readBy?.some(
            (readEntry) => readEntry.user === data.userId
          );
          
          if (!alreadyRead && message.senderId._id !== data.userId) {
            return {
              ...message,
              readBy: [
                ...(message.readBy || []),
                {
                  user: data.userId,
                  readAt: data.readAt
                }
              ]
            };
          }
          return message;
        });
        
        set({ groupMessages: updatedMessages });
      }
    });
  },

  unsubscribeFromGroupMessages: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    socket.off("newGroupMessage");
    socket.off("newGroup");
    socket.off("groupUpdated");
    socket.off("messagesMarkedAsRead");
  },
}));
