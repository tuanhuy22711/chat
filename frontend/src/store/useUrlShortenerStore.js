import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useUrlShortenerStore = create((set, get) => ({
  urls: [],
  isLoading: false,
  isShortening: false,

  // Shorten URL
  shortenUrl: async (originalUrl, customCode = null, expiresIn = null) => {
    if (!originalUrl.trim()) {
      toast.error("Vui lòng nhập URL");
      return null;
    }

    set({ isShortening: true });
    try {
      const res = await axiosInstance.post("/short/shorten", {
        originalUrl: originalUrl.trim(),
        customCode,
        expiresIn,
      });

      // Add to urls list
      set((state) => ({
        urls: [res.data, ...state.urls],
      }));

      toast.success("Rút gọn link thành công!");
      return res.data;
    } catch (error) {
      console.error("Error shortening URL:", error);
      const errorMsg = error.response?.data?.error || "Không thể rút gọn link";
      toast.error(errorMsg);
      return null;
    } finally {
      set({ isShortening: false });
    }
  },

  // Get user's URLs
  getUserUrls: async (page = 1) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/short?page=${page}&limit=20`);
      
      if (page === 1) {
        set({ urls: res.data.urls });
      } else {
        set((state) => ({
          urls: [...state.urls, ...res.data.urls],
        }));
      }

      return res.data;
    } catch (error) {
      console.error("Error fetching URLs:", error);
      toast.error("Không thể tải danh sách link");
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // Get URL analytics
  getUrlAnalytics: async (shortCode) => {
    try {
      const res = await axiosInstance.get(`/short/${shortCode}/analytics`);
      return res.data;
    } catch (error) {
      console.error("Error fetching URL analytics:", error);
      toast.error("Không thể tải thống kê link");
      return null;
    }
  },

  // Delete URL
  deleteUrl: async (shortCode) => {
    try {
      await axiosInstance.delete(`/short/${shortCode}`);
      
      set((state) => ({
        urls: state.urls.filter((url) => url.shortCode !== shortCode),
      }));

      toast.success("Xóa link thành công!");
      return true;
    } catch (error) {
      console.error("Error deleting URL:", error);
      toast.error("Không thể xóa link");
      return false;
    }
  },

  // Copy to clipboard
  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Đã sao chép vào clipboard!");
      return true;
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Không thể sao chép");
      return false;
    }
  },

  // Clear URLs
  clearUrls: () => {
    set({ urls: [] });
  },
}));
