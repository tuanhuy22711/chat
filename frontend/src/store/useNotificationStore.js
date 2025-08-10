import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: true,
  currentPage: 1,

  // Fetch notifications
  getNotifications: async (page = 1) => {
    try {
      set({ isLoading: true });
      const res = await axiosInstance.get(`/notifications?page=${page}&limit=20`);
      
      if (page === 1) {
        set({
          notifications: res.data.notifications,
          unreadCount: res.data.unreadCount,
          currentPage: page,
          hasMore: res.data.hasMore,
          isLoading: false,
        });
      } else {
        set((state) => ({
          notifications: [...state.notifications, ...res.data.notifications],
          currentPage: page,
          hasMore: res.data.hasMore,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      set({ isLoading: false });
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const res = await axiosInstance.get("/notifications/unread-count");
      set({ unreadCount: res.data.unreadCount });
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      await axiosInstance.put(`/notifications/${notificationId}/read`);
      
      set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      await axiosInstance.put("/notifications/mark-all-read");
      
      set((state) => ({
        notifications: state.notifications.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: new Date(),
        })),
        unreadCount: 0,
      }));
      
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      await axiosInstance.delete(`/notifications/${notificationId}`);
      
      set((state) => {
        const notification = state.notifications.find(n => n._id === notificationId);
        const wasUnread = notification && !notification.isRead;
        
        return {
          notifications: state.notifications.filter((n) => n._id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      });
      
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  },

  // Add new notification (for real-time updates)
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  // Socket event handlers
  subscribeToNotifications: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    socket.on("newNotification", (notification) => {
      get().addNotification(notification);
      
      // Show toast notification
      toast.success(notification.message, {
        duration: 3000,
        icon: notification.type === "message" ? "💬" : "📝",
      });
    });
  },

  unsubscribeFromNotifications: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    socket.off("newNotification");
  },
}));
