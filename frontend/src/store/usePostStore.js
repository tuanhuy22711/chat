import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";

export const usePostStore = create((set, get) => ({
  posts: [],
  isLoading: false,
  isCreating: false,
  currentPage: 1,
  hasMore: true,

  // Get newsfeed posts
  getPosts: async (page = 1) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/posts?page=${page}&limit=10`);
      const { posts, currentPage, hasMore } = res.data;
      
      if (page === 1) {
        set({ posts, currentPage, hasMore });
      } else {
        set((state) => ({
          posts: [...state.posts, ...posts],
          currentPage,
          hasMore,
        }));
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error(error.response?.data?.error || "Failed to fetch posts");
    } finally {
      set({ isLoading: false });
    }
  },

  // Create new post
  createPost: async (postData) => {
    const { authUser } = useAuthStore.getState();
    set({ isCreating: true });
    try {
      const res = await axiosInstance.post("/posts", postData);
      
      // Add new post to the beginning of the list immediately
      // We'll ignore the socket event for this post since we already have it
      set((state) => ({
        posts: [res.data, ...state.posts],
        isCreating: false,
      }));
      
      toast.success("Post created successfully!");
      return res.data;
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(error.response?.data?.error || "Failed to create post");
      set({ isCreating: false });
      throw error;
    }
  },

  // Edit post
  editPost: async (postId, postData) => {
    try {
      const res = await axiosInstance.put(`/posts/${postId}`, postData);
      
      // Update post in the list
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId ? res.data : post
        ),
      }));
      
      toast.success("Post updated successfully!");
      return res.data;
    } catch (error) {
      console.error("Error editing post:", error);
      toast.error(error.response?.data?.error || "Failed to edit post");
      throw error;
    }
  },

  // Delete post
  deletePost: async (postId) => {
    try {
      await axiosInstance.delete(`/posts/${postId}`);
      
      // Remove post from the list
      set((state) => ({
        posts: state.posts.filter((post) => post._id !== postId),
      }));
      
      toast.success("Post deleted successfully!");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error(error.response?.data?.error || "Failed to delete post");
      throw error;
    }
  },

  // Add reaction
  addReaction: async (postId, reactionType = "like") => {
    try {
      const res = await axiosInstance.post(`/posts/${postId}/react`, {
        type: reactionType,
      });
      
      // Update post reactions in the list
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId 
            ? { ...post, reactions: res.data.reactions, reactionCounts: res.data.reactionCounts }
            : post
        ),
      }));
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error(error.response?.data?.error || "Failed to add reaction");
    }
  },

  // Remove reaction
  removeReaction: async (postId) => {
    try {
      const res = await axiosInstance.delete(`/posts/${postId}/react`);
      
      // Update post reactions in the list
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId 
            ? { ...post, reactions: res.data.reactions, reactionCounts: res.data.reactionCounts }
            : post
        ),
      }));
    } catch (error) {
      console.error("Error removing reaction:", error);
      toast.error(error.response?.data?.error || "Failed to remove reaction");
    }
  },

  // Add comment
  addComment: async (postId, commentText, parentCommentId = null) => {
    try {
      const res = await axiosInstance.post(`/posts/${postId}/comment`, {
        text: commentText,
        parentCommentId,
      });
      
      // Update post comments in the list
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId 
            ? { ...post, comments: res.data.comments, commentCount: res.data.commentCount }
            : post
        ),
      }));
      
      toast.success("Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(error.response?.data?.error || "Failed to add comment");
    }
  },

  // Toggle pin post
  togglePinPost: async (postId) => {
    try {
      const res = await axiosInstance.patch(`/posts/${postId}/pin`);
      
      // Update post in the list
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId ? res.data : post
        ),
      }));
      
      toast.success(res.data.isPinned ? "Post pinned!" : "Post unpinned!");
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error(error.response?.data?.error || "Failed to pin/unpin post");
    }
  },

  // Share post
  sharePost: async (postId) => {
    try {
      const res = await axiosInstance.post(`/posts/${postId}/share`);
      
      // Add shared post to the beginning of the list immediately
      set((state) => ({
        posts: [res.data, ...state.posts],
      }));
      
      toast.success("Post shared successfully!");
      return res.data;
    } catch (error) {
      console.error("Error sharing post:", error);
      toast.error(error.response?.data?.error || "Failed to share post");
      throw error;
    }
  },

  // Socket event handlers
  subscribeToPostUpdates: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    socket.on("newPost", (post) => {
      const { authUser } = useAuthStore.getState();
      
      // Don't add posts created by current user to prevent duplicates
      if (post.author._id === authUser._id) return;
      
      set((state) => {
        // Check if post already exists to prevent duplicates
        const postExists = state.posts.some(existingPost => existingPost._id === post._id);
        if (!postExists) {
          return {
            posts: [post, ...state.posts],
          };
        }
        return state;
      });
    });

    socket.on("postUpdated", (updatedPost) => {
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === updatedPost._id ? updatedPost : post
        ),
      }));
    });

    socket.on("postDeleted", (postId) => {
      set((state) => ({
        posts: state.posts.filter((post) => post._id !== postId),
      }));
    });

    socket.on("postReactionUpdated", (data) => {
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === data.postId 
            ? { ...post, reactions: data.reactions, reactionCounts: data.reactionCounts }
            : post
        ),
      }));
    });

    socket.on("postCommentAdded", (data) => {
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === data.postId 
            ? { ...post, comments: data.comments, commentCount: data.commentCount }
            : post
        ),
      }));
    });

    socket.on("postPinUpdated", (updatedPost) => {
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === updatedPost._id ? updatedPost : post
        ),
      }));
    });
  },

  unsubscribeFromPostUpdates: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    socket.off("newPost");
    socket.off("postUpdated");
    socket.off("postDeleted");
    socket.off("postReactionUpdated");
    socket.off("postCommentAdded");
    socket.off("postPinUpdated");
  },
}));
