import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { connectDatabase } from './config/database';
import { getRedisClient } from './config/redis';
import assessmentRoutes from './routes/assessment.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initWebSocket } from './websocket/ws.handler';
import { startWorker, shutdownQueue } from './services/queue.service';
import logger from './utils/logger';

const app = express();
const server = http.createServer(app);

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
    skip: (req) => req.url === '/health',
  })
);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/assessments', assessmentRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Initialize WebSocket
initWebSocket(server);

const PORT = parseInt(process.env.PORT || '5000', 10);

async function bootstrap(): Promise<void> {
  // Start HTTP server immediately — don't block on DB
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 VedaAI Backend running on port ${PORT}`);
    logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`   API: http://localhost:${PORT}/api`);
    logger.info(`   WebSocket: ws://localhost:${PORT}/ws`);
    logger.info(`   Health: http://localhost:${PORT}/health`);
  });

  // Connect to MongoDB (non-blocking — server already listening)
  try {
    await connectDatabase();
    logger.info('✅ MongoDB connected');
  } catch (dbError: any) {
    logger.error(
      '❌ MongoDB connection failed — API requests will fail until DB is available:',
      dbError.message
    );
    // Don't exit — Mongoose will keep retrying in background
  }

  // Connect Redis and start worker (non-critical)
  try {
    const redis = getRedisClient();
    await redis.ping();
    startWorker();
    logger.info('✅ Redis connected and BullMQ worker started');
  } catch (redisError: any) {
    logger.warn(
      '⚠️  Redis not available — queue disabled, using inline processing fallback:',
      redisError.message
    );
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    await shutdownQueue();
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

bootstrap();

export default app;
