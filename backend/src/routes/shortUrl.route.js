import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  shortenUrl,
  redirectUrl,
  getUserUrls,
  getUrlAnalytics,
  deleteUrl,
} from "../controllers/shortUrl.controller.js";

const router = express.Router();

// Shorten URL (protected)
router.post("/shorten", protectRoute, shortenUrl);

// Get user's URLs (protected)
router.get("/", protectRoute, getUserUrls);

// Get URL analytics (protected)
router.get("/:shortCode/analytics", protectRoute, getUrlAnalytics);

// Delete URL (protected)
router.delete("/:shortCode", protectRoute, deleteUrl);

export default router;
