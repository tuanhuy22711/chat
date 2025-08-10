import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getNewsfeed,
  getUserPosts,
  createPost,
  editPost,
  deletePost,
  addReaction,
  removeReaction,
  addComment,
  togglePinPost,
  sharePost,
} from "../controllers/post.controller.js";

const router = express.Router();

// Get newsfeed
router.get("/", protectRoute, getNewsfeed);

// Get user posts
router.get("/user/:userId", protectRoute, getUserPosts);

// Create post
router.post("/", protectRoute, createPost);

// Edit post
router.put("/:postId", protectRoute, editPost);

// Delete post
router.delete("/:postId", protectRoute, deletePost);

// Reactions
router.post("/:postId/react", protectRoute, addReaction);
router.delete("/:postId/react", protectRoute, removeReaction);

// Comments
router.post("/:postId/comment", protectRoute, addComment);

// Pin/Unpin
router.patch("/:postId/pin", protectRoute, togglePinPost);

// Share
router.post("/:postId/share", protectRoute, sharePost);

export default router;
