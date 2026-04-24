const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const hpp = require('hpp');
const compression = require('compression');

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

const connectDB = require('./src/config/db');
const logger = require('./src/config/logger');
const routes = require('./src/routes');
const autoScheduler = require('./src/utils/autoScheduler');
const { secureErrorHandler, notFoundHandler } = require('./src/middlewares/secureErrorHandler');
const SocketServer = require('./src/socket');
const ChatService = require('./src/services/chatService');

// Import cron for scheduled tasks
const cron = require('node-cron');

// Load environment variables
dotenv.config();

const app = express();

/*
========================================
IMPORTANT FOR PROXY / CLUSTER
========================================
*/
app.set('trust proxy', 1);

/*
========================================
SECURITY: HELMET
========================================
*/
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

/*
========================================
SECURITY: CORS
========================================
*/
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5500',
      'http://localhost:4200',
      'https://fit-front-three.vercel.app'
    ];

    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors({
  origin: ['http://localhost:4200','https://fit-front-three.vercel.app'],
  credentials: true
}));

app.use(cors(corsOptions));

/*
========================================
CORS ERROR HANDLER
========================================
*/
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS policy violation'
    });
  }
  next(err);
});

/*
========================================
GLOBAL MIDDLEWARES
========================================
*/
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(hpp());

/*
========================================
LOGGER
========================================
*/
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  const morganFormat =
    ':method :url :status :response-time ms - :res[content-length]';

  app.use(
    morgan(morganFormat, {
      stream: {
        write: (message) => logger.info(message.trim())
      }
    })
  );
}

/*
========================================
ANTI BOT SLOWDOWN
========================================
*/
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: () => 500
});

app.use('/api', speedLimiter);

/*
========================================
RATE LIMITER (FIXED FOR IPV6 / CLUSTER)
========================================
*/
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },

  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => req.ip
});

app.use('/api/', limiter);

/*
========================================
HEALTH CHECK ROUTE
========================================
*/
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Fitness Platform API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/*
========================================
GLOBAL SUPERVISOR AUDIT MIDDLEWARE
========================================
*/
const GlobalSupervisorAudit = require('./src/middleware/globalSupervisorAudit');

// Apply global supervisor audit middleware to capture all supervisor actions
app.use('/api', GlobalSupervisorAudit.globalAuditMiddleware());

/*
========================================
API ROUTES
========================================
*/
app.use('/api', routes);

/*
========================================
404 HANDLER
========================================
*/
app.use(notFoundHandler);

/*
========================================
GLOBAL ERROR HANDLER
========================================
*/
app.use(secureErrorHandler);

/*
========================================
START SERVER
========================================
*/
const startServer = async () => {
  try {
    await connectDB();

    // Initialize auto-scheduler after database connection
    await autoScheduler.initialize();

    const PORT = process.env.PORT || 5000;

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(
        `Server running on port ${PORT} in ${
          process.env.NODE_ENV || 'development'
        } mode`
      );
    });

    // Initialize socket server
    const socketServer = new SocketServer(server);
    
    // Make socket server available globally
    global.socketServer = socketServer;

    // Initialize subscription lifecycle cron job
    const subscriptionCronJob = cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('Running subscription lifecycle sync...');
        
        // Lock expired chats
        await ChatService.lockExpiredChats();
        
        logger.info('Subscription lifecycle sync completed');
      } catch (error) {
        logger.error('Error in subscription lifecycle cron job:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    // Initialize orphan chat prevention cron job
    const orphanChatCronJob = cron.schedule('0 */6 * * *', async () => {
      try {
        logger.info('Running orphan chat prevention check...');
        
        const Chat = require('./src/models/Chat');
        const Subscription = require('./src/models/Subscription');
        
        // Find chats with invalid subscription bindings or insufficient participants
        const invalidChats = await Chat.aggregate([
          {
            $match: {
              isDeleted: false,
              status: { $ne: 'LOCKED' }
            }
          },
          {
            $lookup: {
              from: 'subscriptions',
              localField: 'subscriptionBinding.subscriptionId',
              foreignField: '_id',
              as: 'subscription'
            }
          },
          {
            $match: {
              $or: [
                { 'subscriptionBinding.subscriptionId': { $exists: false } },
                { subscription: { $size: 0 } }, // No subscription found
                { 
                  $and: [
                    { subscription: { $ne: [] } },
                    { 'subscription.0.status': { $ne: 'ACTIVE' } } // Subscription not active
                  ]
                },
                { participants: { $size: { $lt: 2 } } } // Less than 2 participants
              ]
            }
          }
        ]);
        
        if (invalidChats.length > 0) {
          logger.info(`Found ${invalidChats.length} invalid chats, locking them...`);
          
          // Lock all invalid chats
          const chatIds = invalidChats.map(chat => chat.chatId);
          await Chat.updateMany(
            { chatId: { $in: chatIds } },
            { 
              $set: { 
                status: 'LOCKED', 
                updatedAt: new Date(),
                'metadata.lockReason': 'Invalid subscription or participants'
              }
            }
          );
          
          logger.info(`Locked ${invalidChats.length} invalid chats`);
        }
        
        logger.info('Orphan chat prevention check completed');
      } catch (error) {
        logger.error('Error in orphan chat prevention cron job:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Promise Rejection:', err);
      
      // Flush any pending supervisor audit logs before shutdown
      const GlobalSupervisorAudit = require('./src/middleware/globalSupervisorAudit');
      GlobalSupervisorAudit.flushLogs().catch(error => {
        logger.error('Error flushing audit logs during shutdown:', error);
      });
      
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      
      // Flush any pending supervisor audit logs before shutdown
      const GlobalSupervisorAudit = require('./src/middleware/globalSupervisorAudit');
      GlobalSupervisorAudit.flushLogs().catch(error => {
        logger.error('Error flushing audit logs during shutdown:', error);
      });
      
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;