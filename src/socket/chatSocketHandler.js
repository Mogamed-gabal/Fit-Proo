const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ChatService = require('../services/chatService');
const EnhancedChatAccessService = require('../services/enhancedChatAccessService');
const DynamicPermissionMiddleware = require('../middleware/dynamicPermissionMiddleware');
const config = require('../config/chatAccessConfig');
const logger = require('../config/logger');

// Constants
const TYPING_DEBOUNCE_TIME = 2000; // 2 seconds minimum between typing events
const AUTO_REJOIN_DELAY = 1000; // 1 second delay before auto-rejoin
const MAX_REJOIN_MESSAGES = 20; // Maximum messages to fetch on rejoin

/**
 * Chat Socket Handler
 * Real-time chat functionality with access control
 */
class ChatSocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socket.id
    this.userSockets = new Map(); // socket.id -> user info
    this.adminViewers = new Map(); // chatId -> Set of admin socket IDs
    this.supervisorViewers = new Map(); // chatId -> Set of supervisor socket IDs
  }

  /**
   * Initialize socket handlers
   */
  initialize() {
    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));
    
    logger.info('Chat socket handler initialized');
  }

  /**
   * Authenticate socket connection
   */
  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Invalid authentication token'));
    }
  }

  /**
   * Socket middleware for strict validation
   */
  async socketMiddleware(socket, data, next) {
    try {
      // Validate user authentication (already done in authenticateSocket)
      if (!socket.user || !socket.userId) {
        return next(new Error('User not authenticated'));
      }

      // Validate user role
      const validRoles = ['client', 'doctor', 'admin', 'supervisor'];
      if (!validRoles.includes(socket.userRole)) {
        return next(new Error('Invalid user role'));
      }

      // For chat-related events, validate chat participation and status
      if (data.chatId) {
        const Chat = require('../models/Chat');
        const chat = await Chat.findOne({ 
          chatId: data.chatId, 
          isDeleted: false 
        });

        if (!chat) {
          return next(new Error('Chat not found'));
        }

        // Check chat status
        if (chat.status === 'LOCKED') {
          return next(new Error('Chat is locked'));
        }

        if (chat.status === 'SUSPENDED') {
          return next(new Error('Chat is suspended'));
        }

        // Check subscription binding validity
        if (!chat.subscriptionBinding || !chat.subscriptionBinding.subscriptionId) {
          return next(new Error('Invalid chat subscription binding'));
        }

        // Check user participation (except for admin/supervisor view events)
        if (socket.userRole !== 'admin' && socket.userRole !== 'supervisor') {
          const participant = chat.participants.find(p => 
            p.userId.toString() === socket.userId.toString()
          );

          if (!participant) {
            return next(new Error('User is not a participant in this chat'));
          }

          if (!participant.isActive) {
            return next(new Error('User is not an active participant in this chat'));
          }
        }

        // Add chat data to socket for later use
        socket.currentChat = chat;
      }

      next();
    } catch (error) {
      logger.error('Socket middleware error:', error);
      next(new Error('Socket validation failed'));
    }
  }

  /**
   * Handle socket connection
   */
  async handleConnection(socket) {
    logger.info(`User ${socket.userId} connected (${socket.userRole})`);
    
    // Track connected user
    this.connectedUsers.set(socket.userId, socket.id);
    this.userSockets.set(socket.id, {
      userId: socket.userId,
      role: socket.userRole,
      socket,
      rejoinedChats: new Set() // Track rejoined chats
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to chat server',
      userId: socket.userId,
      role: socket.userRole,
      timestamp: new Date()
    });

    // Auto-rejoin previous chat rooms after a short delay
    setTimeout(async () => {
      await this.autoRejoinChats(socket);
    }, AUTO_REJOIN_DELAY);

    // Register event handlers
    this.registerEventHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', () => this.handleDisconnection(socket));
  }

  /**
   * Auto-rejoin previous chat rooms with full message sync
   */
  async autoRejoinChats(socket) {
    try {
      const userInfo = this.userSockets.get(socket.id);
      if (!userInfo) return;

      // Get user's active chats
      const ChatService = require('../services/chatService');
      const userChats = await ChatService.getUserChats(socket.userId, { limit: 50 });
      
      if (!userChats.success) return;

      // Rejoin each chat room with full sync
      for (const chat of userChats.chats) {
        if (chat.status === 'ACTIVE') {
          try {
            // Check access permission first
            const accessResult = await ChatService.joinChat(socket.userId, chat.chatId);
            
            if (accessResult.success) {
              socket.join(chat.chatId);
              
              // Join admin/supervisor viewer rooms if applicable
              if (socket.userRole === 'admin') {
                socket.join(chat.chatId + '_admin_view');
              } else if (socket.userRole === 'supervisor') {
                const hasPermission = await this.checkSupervisorPermission(socket.userId, 'VIEW_ALL_CHATS');
                if (hasPermission) {
                  socket.join(chat.chatId + '_supervisor_view');
                }
              }

              userInfo.rejoinedChats.add(chat.chatId);
              
              // Get user's lastReadAt from chat participants
              const participant = chat.participants.find(p => 
                p.userId.toString() === socket.userId.toString()
              );
              
              const lastReadAt = participant?.lastReadAt || new Date(0);
              
              // Get ONLY new messages after lastReadAt to prevent duplication
              const ChatMessage = require('../models/ChatMessage');
              const recentMessages = await ChatMessage.find({
                chatId: chat.chatId,
                createdAt: { $gt: lastReadAt },
                isDeleted: false
              })
              .sort({ createdAt: -1 })
              .limit(MAX_REJOIN_MESSAGES)
              .lean();

              // Update participant lastReadAt to current time for sync
              await ChatService.updateParticipantLastRead(chat.chatId, socket.userId);
              
              socket.emit('chat_rejoined', {
                chatId: chat.chatId,
                chat: accessResult.chat,
                unreadCount: accessResult.unreadCount,
                recentMessages: recentMessages.reverse(), // Reverse to chronological order
                timestamp: new Date()
              });

              // Broadcast typing state restoration (optional)
              socket.to(chat.chatId).emit('user_joined', {
                chatId: chat.chatId,
                userId: socket.userId,
                userName: socket.user.name,
                timestamp: new Date(),
                rejoined: true
              });
            }
          } catch (error) {
        logger.error(`Error rejoining chat ${chat.chatId}:`, error);
      }
        }
      }

      logger.info(`Auto-rejoined ${userInfo.rejoinedChats.size} chats for user ${socket.userId}`);

    } catch (error) {
      logger.error('Error auto-rejoining chats:', error);
    }
  }

  /**
   * Register socket event handlers
   */
  registerEventHandlers(socket) {
    // Typing indicators with debounce
    const typingTimeouts = new Map(); // chatId -> timeoutId

    // Join chat room
    socket.on('join_chat', async (data) => {
      await this.handleJoinChat(socket, data);
    });

    // Leave chat room
    socket.on('leave_chat', async (data) => {
      await this.handleLeaveChat(socket, data);
    });

    // Send message with strict validation
    socket.on('send_message', async (data) => {
      try {
        // CRITICAL: Check admin/supervisor role FIRST before any other logic
        if (socket.userRole === 'admin' || socket.userRole === 'supervisor') {
          socket.emit('error', { 
            success: false,
            message: 'Read-only access - cannot send messages',
            code: 'READ_ONLY_ACCESS'
          });
          return;
        }

        // Apply socket middleware
        await this.socketMiddleware(socket, data, async (error) => {
          if (error) {
            socket.emit('error', { 
              success: false,
              message: error.message,
              code: 'VALIDATION_ERROR'
            });
            return;
          }

          // Check rate limiting at socket level
          const UserRateLimit = require('../models/UserRateLimit');
          const rateLimitCheck = await UserRateLimit.checkRateLimit(socket.userId, 'SEND_MESSAGE');
          if (!rateLimitCheck.allowed) {
            socket.emit('error', { 
              success: false,
              message: 'Rate limit exceeded',
              reason: rateLimitCheck.reason,
              retryAfter: rateLimitCheck.blockedUntil ? 
                Math.ceil((rateLimitCheck.blockedUntil - new Date()) / 1000) : 300,
              code: 'RATE_LIMIT_EXCEEDED'
            });
            return;
          }

          await this.handleSendMessage(socket, data);
        });
      } catch (error) {
        logger.error('Error in send_message event:', error);
        socket.emit('error', { 
          success: false,
          message: 'Message sending failed',
          code: 'SEND_ERROR'
        });
      }
    });

    // Join chat with validation
    socket.on('join_chat', async (data) => {
      try {
        await this.socketMiddleware(socket, data, async (error) => {
          if (error) {
            socket.emit('error', { 
              success: false,
              message: error.message,
              code: 'VALIDATION_ERROR'
            });
            return;
          }

          await this.handleJoinChat(socket, data);
        });
      } catch (error) {
        logger.error('Error in join_chat event:', error);
        socket.emit('error', { 
          success: false,
          message: 'Chat join failed',
          code: 'JOIN_CHAT_ERROR'
        });
      }
    });

    // Leave chat
    socket.on('leave_chat', async (data) => {
      try {
        await this.handleLeaveChat(socket, data);
      } catch (error) {
        logger.error('Error in leave_chat event:', error);
        socket.emit('error', { 
          success: false,
          message: 'Chat leave failed',
          code: 'LEAVE_CHAT_ERROR'
        });
      }
    });

    // Mark message as read
    socket.on('mark_read', async (data) => {
      try {
        await this.handleMarkRead(socket, data);
      } catch (error) {
        logger.error('Error in mark_read event:', error);
        socket.emit('error', { 
          success: false,
          message: 'Mark read failed',
          code: 'MARK_READ_ERROR'
        });
      }
    });

    // Typing indicators with debounce and spam protection
    const typingDebounceTime = new Map(); // socketId -> last typing event time
    socket.on('typing_start', async (data) => {
      try {
        // Prevent typing event spam - minimum 2 seconds between events
        const now = Date.now();
        const lastTypingTime = typingDebounceTime.get(socket.id) || 0;
        
        if (now - lastTypingTime < TYPING_DEBOUNCE_TIME) {
          return; // Ignore spam typing events
        }
        
        typingDebounceTime.set(socket.id, now);
        await this.handleTypingStart(socket, data, typingTimeouts);
      } catch (error) {
        logger.error('Error in typing_start event:', error);
      }
    });

    socket.on('typing_stop', async (data) => {
      try {
        // Clear debounce time on stop
        typingDebounceTime.delete(socket.id);
        await this.handleTypingStop(socket, data, typingTimeouts);
      } catch (error) {
        logger.error('Error in typing_stop event:', error);
      }
    });

    // Admin join chat view with validation
    socket.on('admin_join_chat', async (data) => {
      try {
        if (socket.userRole !== 'admin') {
          socket.emit('error', { message: 'Admin access required' });
          return;
        }

        await this.socketMiddleware(socket, data, async (error) => {
          if (error) {
            socket.emit('error', { message: error.message });
            return;
          }

          await this.handleAdminJoinChat(socket, data);
        });
      } catch (error) {
        logger.error('Error in admin_join_chat event:', error);
        socket.emit('error', { 
          success: false,
          message: 'Admin chat join failed',
          code: 'ADMIN_JOIN_ERROR'
        });
      }
    });

    socket.on('admin_leave_chat', async (data) => {
      try {
        await this.handleAdminLeaveChat(socket, data);
      } catch (error) {
        logger.error('Error in admin_leave_chat event:', error);
        socket.emit('error', { 
          success: false,
          message: 'Admin chat leave failed',
          code: 'ADMIN_LEAVE_ERROR'
        });
      }
    });

    // Supervisor join chat view with validation
    socket.on('supervisor_join_chat', async (data) => {
      try {
        if (socket.userRole !== 'supervisor') {
          socket.emit('error', { message: 'Supervisor access required' });
          return;
        }

        await this.socketMiddleware(socket, data, async (error) => {
          if (error) {
            socket.emit('error', { message: error.message });
            return;
          }

          await this.handleSupervisorJoinChat(socket, data);
        });
      } catch (error) {
        logger.error('Error in supervisor_join_chat event:', error);
        socket.emit('error', { 
          success: false,
          message: 'Supervisor chat join failed',
          code: 'SUPERVISOR_JOIN_ERROR'
        });
      }
    });

    socket.on('supervisor_leave_chat', async (data) => {
      try {
        await this.handleSupervisorLeaveChat(socket, data);
      } catch (error) {
        logger.error('Error in supervisor_leave_chat event:', error);
        socket.emit('error', { 
          success: false,
          message: 'Supervisor chat leave failed',
          code: 'SUPERVISOR_LEAVE_ERROR'
        });
      }
    });
  }

  /**
   * Handle join chat room
   */
  async handleJoinChat(socket, data) {
    try {
      const { chatId } = data;
      
      if (!chatId) {
        socket.emit('error', { message: 'Chat ID is required' });
        return;
      }

      // Check access permission
      const joinResult = await ChatService.joinChat(socket.userId, chatId);
      
      if (!joinResult.success) {
        socket.emit('error', { 
          message: 'Access denied', 
          reason: joinResult.error || 'Unknown error' 
        });
        return;
      }

      // Join room
      socket.join(chatId);
      
      // Join admin/supervisor viewer rooms if applicable
      if (socket.userRole === 'admin') {
        socket.join(chatId + '_admin_view');
      } else if (socket.userRole === 'supervisor') {
        // Check if supervisor has VIEW_ALL_CHATS permission
        const hasPermission = await this.checkSupervisorPermission(socket.userId, 'VIEW_ALL_CHATS');
        if (hasPermission) {
          socket.join(chatId + '_supervisor_view');
        }
      }

      // Send join success
      socket.emit('chat_joined', {
        chatId,
        chat: joinResult.chat,
        unreadCount: joinResult.unreadCount,
        accessResult: joinResult.accessResult,
        timestamp: new Date()
      });

      // Update participant lastReadAt for online users
      if (socket.userRole !== 'admin' && socket.userRole !== 'supervisor') {
        try {
          await ChatService.updateParticipantLastRead(chatId, socket.userId);
        } catch (error) {
          logger.error('Error updating lastReadAt:', error);
        }
      }

      // Broadcast to other participants (except admin/supervisor viewers)
      if (socket.userRole !== 'admin' && socket.userRole !== 'supervisor') {
        socket.to(chatId).emit('user_joined', {
          chatId,
          userId: socket.userId,
          userName: socket.user.name,
          timestamp: new Date()
        });
      }

      logger.info(`User ${socket.userId} joined chat ${chatId}`);

    } catch (error) {
      logger.error('Error joining chat:', error);
      socket.emit('error', { 
        success: false,
        message: error.message,
        code: 'JOIN_ERROR'
      });
    }
  }

  /**
   * Handle leave chat room
   */
  async handleLeaveChat(socket, data) {
    try {
      const { chatId } = data;
      
      if (!chatId) {
        socket.emit('error', { message: 'Chat ID is required' });
        return;
      }

      // Leave room
      socket.leave(chatId);
      socket.leave(chatId + '_admin_view');
      socket.leave(chatId + '_supervisor_view');

      // Remove from admin/supervisor viewers
      this.removeFromViewers(chatId, socket.id, socket.userRole);

      // Send leave success
      socket.emit('chat_left', {
        chatId,
        timestamp: new Date()
      });

      // Notify other participants
      if (socket.userRole !== 'admin' && socket.userRole !== 'supervisor') {
        socket.to(chatId).emit('user_left', {
          chatId,
          userId: socket.userId,
          userName: socket.user.name,
          timestamp: new Date()
        });
      }

      logger.info(`User ${socket.userId} left chat ${chatId}`);

    } catch (error) {
      logger.error('Error leaving chat:', error);
      socket.emit('error', { 
        success: false,
        message: error.message,
        code: 'LEAVE_ERROR'
      });
    }
  }

  /**
   * Handle send message
   */
  async handleSendMessage(socket, data) {
    try {
      const { chatId, content, type = 'TEXT', attachment } = data;
      
      if (!chatId || !content) {
        socket.emit('error', { message: 'Chat ID and content are required' });
        return;
      }

      // Admin and supervisors cannot send messages
      if (socket.userRole === 'admin' || socket.userRole === 'supervisor') {
        socket.emit('error', { message: 'Read-only access' });
        return;
      }

      // Send message through service (includes all validations)
      const result = await ChatService.sendMessage(socket.userId, chatId, {
        content,
        type,
        attachment
      });

      if (!result.success) {
        socket.emit('error', { 
          message: result.error || 'Failed to send message',
          reason: result.reason
        });
        return;
      }

      const message = result.message;

      // Broadcast to chat room
      this.io.to(chatId).emit('new_message', {
        chatId,
        message,
        sender: {
          userId: socket.userId,
          name: socket.user.name,
          role: socket.userRole
        },
        timestamp: new Date()
      });

      // Broadcast to admin viewers
      this.io.to(chatId + '_admin_view').emit('new_message', {
        chatId,
        message,
        sender: {
          userId: socket.userId,
          name: socket.user.name,
          role: socket.userRole
        },
        timestamp: new Date(),
        viewerType: 'admin'
      });

      // Broadcast to supervisor viewers
      this.io.to(chatId + '_supervisor_view').emit('new_message', {
        chatId,
        message,
        sender: {
          userId: socket.userId,
          name: socket.user.name,
          role: socket.userRole
        },
        timestamp: new Date(),
        viewerType: 'supervisor'
      });

      // Handle offline users - mark as unread
      await this.handleOfflineUsers(chatId, message);

      // Send success to sender
      socket.emit('message_sent', {
        chatId,
        message,
        usage: result.usage,
        timestamp: new Date()
      });

      logger.info(`Message sent in chat ${chatId} by user ${socket.userId}`);

    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('error', { 
        success: false,
        message: error.message,
        code: 'SEND_MESSAGE_ERROR'
      });
    }
  }

  /**
   * Handle mark as read
   */
  async handleMarkRead(socket, data) {
    try {
      const { messageId } = data;
      
      if (!messageId) {
        socket.emit('error', { message: 'Message ID is required' });
        return;
      }

      const result = await ChatService.markMessageAsRead(socket.userId, messageId);
      
      if (result.success) {
        // Notify other participants about read status
        socket.broadcast.emit('message_read', {
          messageId,
          userId: socket.userId,
          timestamp: new Date()
        });
      }

    } catch (error) {
      logger.error('Error marking message as read:', error);
      socket.emit('error', { 
        success: false,
        message: error.message,
        code: 'MARK_READ_ERROR'
      });
    }
  }

  /**
   * Handle typing start with debounce
   */
  async handleTypingStart(socket, data, typingTimeouts) {
    try {
      const { chatId } = data;
      
      if (!chatId) {
        return;
      }

      // Clear existing timeout for this chat
      if (typingTimeouts.has(chatId)) {
        clearTimeout(typingTimeouts.get(chatId));
      }

      // Broadcast typing indicator to other participants
      socket.to(chatId).emit('typing_start', {
        chatId,
        userId: socket.userId,
        userName: socket.user.name,
        timestamp: new Date()
      });

      // Set auto-stop timeout (5 seconds)
      const timeoutId = setTimeout(() => {
        socket.to(chatId).emit('typing_stop', {
          chatId,
          userId: socket.userId,
          userName: socket.user.name,
          timestamp: new Date(),
          autoStopped: true
        });
        
        typingTimeouts.delete(chatId);
      }, 5000);

      typingTimeouts.set(chatId, timeoutId);

    } catch (error) {
      logger.error('Error handling typing start:', error);
    }
  }

  /**
   * Handle typing stop
   */
  async handleTypingStop(socket, data, typingTimeouts) {
    try {
      const { chatId } = data;
      
      if (!chatId) {
        return;
      }

      // Clear timeout if it exists
      if (typingTimeouts.has(chatId)) {
        clearTimeout(typingTimeouts.get(chatId));
        typingTimeouts.delete(chatId);
      }

      // Broadcast typing stop to other participants
      socket.to(chatId).emit('typing_stop', {
        chatId,
        userId: socket.userId,
        userName: socket.user.name,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('Error handling typing stop:', error);
    }
  }

  /**
   * Handle admin join chat view
   */
  async handleAdminJoinChat(socket, data) {
    try {
      const { chatId } = data;
      
      if (socket.userRole !== 'admin') {
        socket.emit('error', { message: 'Admin access required' });
        return;
      }

      if (!chatId) {
        socket.emit('error', { message: 'Chat ID is required' });
        return;
      }

      // Log admin view audit
      await ChatService.logChatViewAudit(socket.userId, 'ADMIN', chatId);

      // Join admin view room
      socket.join(chatId + '_admin_view');
      
      // Track admin viewer
      if (!this.adminViewers.has(chatId)) {
        this.adminViewers.set(chatId, new Set());
      }
      this.adminViewers.get(chatId).add(socket.id);

      socket.emit('admin_chat_joined', {
        chatId,
        timestamp: new Date()
      });

      logger.info(`Admin ${socket.userId} joined view of chat ${chatId}`);

    } catch (error) {
      logger.error('Error admin joining chat:', error);
      socket.emit('error', { 
        success: false,
        message: error.message,
        code: 'ADMIN_JOIN_CHAT_ERROR'
      });
    }
  }

  /**
   * Handle admin leave chat view
   */
  async handleAdminLeaveChat(socket, data) {
    try {
      const { chatId } = data;
      
      if (!chatId) {
        return;
      }

      // Leave admin view room
      socket.leave(chatId + '_admin_view');
      
      // Remove from admin viewers
      this.removeFromViewers(chatId, socket.id, 'admin');

      socket.emit('admin_chat_left', {
        chatId,
        timestamp: new Date()
      });

      logger.info(`Admin ${socket.userId} left view of chat ${chatId}`);

    } catch (error) {
      logger.error('Error admin leaving chat:', error);
    }
  }

  /**
   * Handle supervisor join chat view
   */
  async handleSupervisorJoinChat(socket, data) {
    try {
      const { chatId } = data;
      
      if (socket.userRole !== 'supervisor') {
        socket.emit('error', { message: 'Supervisor access required' });
        return;
      }

      if (!chatId) {
        socket.emit('error', { message: 'Chat ID is required' });
        return;
      }

      // Check supervisor permission
      const hasPermission = await this.checkSupervisorPermission(socket.userId, 'VIEW_ALL_CHATS');
      if (!hasPermission) {
        socket.emit('error', { message: 'Permission denied' });
        return;
      }

      // Log supervisor view audit
      await ChatService.logChatViewAudit(socket.userId, 'SUPERVISOR', chatId);

      // Join supervisor view room
      socket.join(chatId + '_supervisor_view');
      
      // Track supervisor viewer
      if (!this.supervisorViewers.has(chatId)) {
        this.supervisorViewers.set(chatId, new Set());
      }
      this.supervisorViewers.get(chatId).add(socket.id);

      socket.emit('supervisor_chat_joined', {
        chatId,
        timestamp: new Date()
      });

      logger.info(`Supervisor ${socket.userId} joined view of chat ${chatId}`);

    } catch (error) {
      logger.error('Error supervisor joining chat:', error);
      socket.emit('error', { 
        success: false,
        message: error.message,
        code: 'SUPERVISOR_JOIN_CHAT_ERROR'
      });
    }
  }

  /**
   * Handle supervisor leave chat view
   */
  async handleSupervisorLeaveChat(socket, data) {
    try {
      const { chatId } = data;
      
      if (!chatId) {
        return;
      }

      // Leave supervisor view room
      socket.leave(chatId + '_supervisor_view');
      
      // Remove from supervisor viewers
      this.removeFromViewers(chatId, socket.id, 'supervisor');

      socket.emit('supervisor_chat_left', {
        chatId,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error supervisor leaving chat:', error);
      socket.emit('error', { 
        success: false,
        message: error.message,
        code: 'SUPERVISOR_LEAVE_CHAT_ERROR'
      });
    }
  }

  /**
   * Handle socket disconnection
   */
  handleDisconnection(socket) {
    logger.info(`User ${socket.userId} disconnected`);
    
    // Remove from tracking
    this.connectedUsers.delete(socket.userId);
    this.userSockets.delete(socket.id);
    
    // Remove from all viewer rooms
    for (const [chatId, adminSet] of this.adminViewers.entries()) {
      adminSet.delete(socket.id);
      if (adminSet.size === 0) {
        this.adminViewers.delete(chatId);
      }
    }
    
    for (const [chatId, supervisorSet] of this.supervisorViewers.entries()) {
      supervisorSet.delete(socket.id);
      if (supervisorSet.size === 0) {
        this.supervisorViewers.delete(chatId);
      }
    }
  }

  /**
   * Handle offline users - mark messages as unread for offline participants
   */
  async handleOfflineUsers(chatId, message) {
    try {
      const Chat = require('../models/Chat');
      const chat = await Chat.findOne({ chatId, isDeleted: false });
      
      if (!chat) return;

      // Get all participants
      for (const participant of chat.participants) {
        if (!participant.isActive) continue; // Skip inactive participants

        // Check if user is offline (not connected)
        const isOffline = !this.connectedUsers.has(participant.userId.toString());
        
        if (isOffline) {
          // Use $max operator to prevent race conditions in lastReadAt updates
          await Chat.updateOne(
            { 
              chatId,
              'participants.userId': participant.userId
            },
            { 
              $max: { 
                'participants.$.lastReadAt': message.createdAt 
              }
            }
          );
          
          logger.info(`Marked message as unread for offline user ${participant.userId} in chat ${chatId}`);
        }
      }

    } catch (error) {
      logger.error('Error handling offline users:', error);
    }
  }

  /**
   * Check supervisor permission
   */
  async checkSupervisorPermission(userId, permission) {
    try {
      // Use the dynamic permission service
      const PermissionService = require('../services/permissionService');
      return await PermissionService.checkUserPermission(userId, permission);
    } catch (error) {
      logger.error('Error checking supervisor permission:', error);
      return false;
    }
  }

  /**
   * Remove user from viewers
   */
  removeFromViewers(chatId, socketId, role) {
    if (role === 'admin') {
      const adminSet = this.adminViewers.get(chatId);
      if (adminSet) {
        adminSet.delete(socketId);
        if (adminSet.size === 0) {
          this.adminViewers.delete(chatId);
        }
      }
    } else if (role === 'supervisor') {
      const supervisorSet = this.supervisorViewers.get(chatId);
      if (supervisorSet) {
        supervisorSet.delete(socket.id);
        if (supervisorSet.size === 0) {
          this.supervisorViewers.delete(chatId);
        }
      }
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get chat viewers count
   */
  getChatViewersCount(chatId) {
    const adminCount = this.adminViewers.get(chatId)?.size || 0;
    const supervisorCount = this.supervisorViewers.get(chatId)?.size || 0;
    return {
      admin: adminCount,
      supervisor: supervisorCount,
      total: adminCount + supervisorCount
    };
  }

  /**
   * Broadcast system message
   */
  broadcastSystemMessage(message, targetRole = null) {
    const data = {
      type: 'SYSTEM',
      message,
      timestamp: new Date()
    };

    if (targetRole) {
      // Send to specific role
      for (const [socketId, userInfo] of this.userSockets.entries()) {
        if (userInfo.role === targetRole) {
          userInfo.socket.emit('system_message', data);
        }
      }
    } else {
      // Send to all connected users
      this.io.emit('system_message', data);
    }
  }
}

module.exports = ChatSocketHandler;
