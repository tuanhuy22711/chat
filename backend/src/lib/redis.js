import { createClient } from 'redis';

// Redis client configuration
const client = createClient({
    username: 'default',
    password: 'PdVoLZizqpcG1LFOmX6d23fpoPKip60p',
    socket: {
        host: 'redis-15228.crce194.ap-seast-1-1.ec2.redns.redis-cloud.com',
        port: 15228
    }
});

client.on('error', err => console.log('Redis Client Error', err));
client.on('connect', () => console.log('Connected to Redis'));
client.on('ready', () => console.log('Redis client ready'));

// Initialize Redis connection
const connectRedis = async () => {
    try {
        if (!client.isOpen) {
            await client.connect();
            console.log('✅ Redis connected successfully');
        }
    } catch (error) {
        console.error('❌ Redis connection failed:', error);
    }
};

// Cache utility functions
export const cache = {
    // Get data from cache
    get: async (key) => {
        try {
            const data = await client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    },

    // Set data to cache with optional TTL (Time To Live)
    set: async (key, data, ttl = 300) => { // Default 5 minutes
        try {
            await client.setEx(key, ttl, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Redis set error:', error);
            return false;
        }
    },

    // Delete data from cache
    del: async (key) => {
        try {
            await client.del(key);
            return true;
        } catch (error) {
            console.error('Redis delete error:', error);
            return false;
        }
    },

    // Check if key exists
    exists: async (key) => {
        try {
            const result = await client.exists(key);
            return result === 1;
        } catch (error) {
            console.error('Redis exists error:', error);
            return false;
        }
    },

    // Clear cache by pattern
    clearPattern: async (pattern) => {
        try {
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(keys);
            }
            return keys.length;
        } catch (error) {
            console.error('Redis clear pattern error:', error);
            return 0;
        }
    },

    // Increment counter
    incr: async (key) => {
        try {
            return await client.incr(key);
        } catch (error) {
            console.error('Redis incr error:', error);
            return 0;
        }
    },

    // Set expiry for existing key
    expire: async (key, ttl) => {
        try {
            await client.expire(key, ttl);
            return true;
        } catch (error) {
            console.error('Redis expire error:', error);
            return false;
        }
    }
};

// Cache keys constants
export const CACHE_KEYS = {
    USER_PROFILE: (userId) => `user:profile:${userId}`,
    USER_POSTS: (userId, page) => `user:posts:${userId}:page:${page}`,
    NEWSFEED: (userId, page) => `newsfeed:${userId}:page:${page}`,
    MESSAGES: (userId1, userId2) => `messages:${[userId1, userId2].sort().join(':')}`,
    USERS_SIDEBAR: (userId) => `users:sidebar:${userId}`,
    NOTIFICATIONS: (userId) => `notifications:${userId}`,
    UNREAD_COUNT: (userId) => `unread:count:${userId}`,
    ONLINE_USERS: 'online:users',
    POST: (postId) => `post:${postId}`,
    USER_CONVERSATIONS: (userId) => `conversations:${userId}`
};

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
    SHORT: 60,        // 1 minute
    MEDIUM: 300,      // 5 minutes  
    LONG: 1800,       // 30 minutes
    VERY_LONG: 3600   // 1 hour
};

export { client };
export default connectRedis;
