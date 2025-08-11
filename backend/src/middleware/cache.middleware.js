import { cache, CACHE_TTL } from '../lib/redis.js';

// Middleware để cache response
export const cacheMiddleware = (keyGenerator, ttl = CACHE_TTL.MEDIUM) => {
  return async (req, res, next) => {
    try {
      // Generate cache key based on request
      const cacheKey = typeof keyGenerator === 'function' 
        ? keyGenerator(req) 
        : keyGenerator;

      // Try to get data from cache
      const cachedData = await cache.get(cacheKey);
      
      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);

      // Store original res.json method
      const originalJson = res.json;

      // Override res.json to cache the response
      res.json = function(data) {
        // Cache the response data
        cache.set(cacheKey, data, ttl);
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without caching if Redis fails
    }
  };
};

// Middleware để invalidate cache
export const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    try {
      const originalJson = res.json;
      
      res.json = async function(data) {
        // Invalidate cache patterns after successful response
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const invalidationPromises = patterns.map(pattern => {
            const actualPattern = typeof pattern === 'function' 
              ? pattern(req, data) 
              : pattern;
            return cache.clearPattern(actualPattern);
          });
          
          await Promise.all(invalidationPromises);
          console.log('🗑️ Cache invalidated for patterns:', patterns);
        }
        
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache invalidation middleware error:', error);
      next();
    }
  };
};

// Helper functions cho cache keys
export const generateCacheKey = {
  userProfile: (req) => `user:profile:${req.params.userId || req.user._id}`,
  userPosts: (req) => `user:posts:${req.params.userId}:page:${req.query.page || 1}`,
  newsfeed: (req) => `newsfeed:${req.user._id}:page:${req.query.page || 1}`,
  messages: (req) => {
    const userId1 = req.user._id;
    const userId2 = req.params.id;
    return `messages:${[userId1, userId2].sort().join(':')}`;
  },
  notifications: (req) => `notifications:${req.user._id}`,
  usersSidebar: (req) => `users:sidebar:${req.user._id}`
};

// Cache invalidation patterns
export const invalidationPatterns = {
  userProfile: (req) => `user:profile:${req.user._id}`,
  userPosts: (req) => `user:posts:${req.user._id}:*`,
  newsfeed: () => 'newsfeed:*',
  messages: (req) => {
    const patterns = [`messages:*${req.user._id}*`];
    if (req.params.id) {
      patterns.push(`messages:*${req.params.id}*`);
    }
    return patterns;
  },
  notifications: (req) => `notifications:${req.params.userId || req.user._id}`,
  usersSidebar: () => 'users:sidebar:*'
};
