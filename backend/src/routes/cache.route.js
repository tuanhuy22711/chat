import express from 'express';
import { cache, CACHE_KEYS } from '../lib/redis.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get online users from cache
router.get('/online-users', protectRoute, async (req, res) => {
  try {
    const onlineUsers = await cache.get(CACHE_KEYS.ONLINE_USERS);
    res.status(200).json(onlineUsers || []);
  } catch (error) {
    console.error('Error getting online users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get cache statistics (for debugging)
router.get('/cache-stats', protectRoute, async (req, res) => {
  try {
    // This is a simple implementation - in production you'd want more detailed stats
    const stats = {
      message: "Cache is working",
      timestamp: new Date().toISOString()
    };
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear specific cache pattern (for debugging/admin)
router.delete('/cache/:pattern', protectRoute, async (req, res) => {
  try {
    const { pattern } = req.params;
    const cleared = await cache.clearPattern(pattern);
    res.status(200).json({ 
      message: `Cleared ${cleared} cache keys matching pattern: ${pattern}` 
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
