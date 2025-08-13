import express from "express";
import promClient from "prom-client";

const router = express.Router();

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'chat-app-backend',
  environment: process.env.NODE_ENV || 'development'
});

// Register default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'chat_app_',
});

// Custom metrics
const httpRequestsTotal = new promClient.Counter({
  name: 'chat_app_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestDuration = new promClient.Histogram({
  name: 'chat_app_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const activeConnections = new promClient.Gauge({
  name: 'chat_app_active_connections',
  help: 'Number of active socket connections',
  registers: [register]
});

const messagesSent = new promClient.Counter({
  name: 'chat_app_messages_sent_total',
  help: 'Total number of messages sent',
  labelNames: ['type'],
  registers: [register]
});

const messagesReceived = new promClient.Counter({
  name: 'chat_app_messages_received_total',
  help: 'Total number of messages received',
  labelNames: ['type'],
  registers: [register]
});

const groupsCreated = new promClient.Counter({
  name: 'chat_app_groups_created_total',
  help: 'Total number of groups created',
  registers: [register]
});

const postsCreated = new promClient.Counter({
  name: 'chat_app_posts_created_total',
  help: 'Total number of posts created',
  registers: [register]
});

const notificationsSent = new promClient.Counter({
  name: 'chat_app_notifications_sent_total',
  help: 'Total number of notifications sent',
  labelNames: ['type'],
  registers: [register]
});

const cacheHits = new promClient.Counter({
  name: 'chat_app_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_key'],
  registers: [register]
});

const cacheMisses = new promClient.Counter({
  name: 'chat_app_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_key'],
  registers: [register]
});

const dbConnectionPool = new promClient.Gauge({
  name: 'chat_app_db_connection_pool_size',
  help: 'Current database connection pool size',
  registers: [register]
});

const dbQueryDuration = new promClient.Histogram({
  name: 'chat_app_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// Middleware to track HTTP requests
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestsTotal.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode
    });
    
    httpRequestDuration.observe({
      method: req.method,
      route: route,
      status_code: res.statusCode
    }, duration);
  });
  
  next();
};

// Export metrics for use in other modules
export const metrics = {
  activeConnections,
  messagesSent,
  messagesReceived,
  groupsCreated,
  postsCreated,
  notificationsSent,
  cacheHits,
  cacheMisses,
  dbConnectionPool,
  dbQueryDuration
};

// Metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metricsData = await register.metrics();
    res.end(metricsData);
  } catch (error) {
    console.error('Error collecting metrics:', error);
    res.status(500).end('Error collecting metrics');
  }
});

// Health check endpoint with metrics
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

export default router;
