const { Server } = require('socket.io');
const ChatSocketHandler = require('./chatSocketHandler');

/**
 * Socket.io Server Setup
 * Initialize and configure the real-time chat server
 */
class SocketServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || ["http://localhost:3000", "http://localhost:4200"],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.chatHandler = new ChatSocketHandler(this.io);
    this.initialize();
  }

  /**
   * Initialize socket server
   */
  initialize() {
    // Initialize chat handlers
    this.chatHandler.initialize();

    // Global error handling
    this.io.on('error', (error) => {
      console.error('Socket.io error:', error);
    });

    // Connection tracking
    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);
      console.log(`Total connected users: ${this.chatHandler.getConnectedUsersCount()}`);
    });

    // Disconnection tracking
    this.io.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      console.log(`Remaining connected users: ${this.chatHandler.getConnectedUsersCount()}`);
    });

    console.log('Socket server initialized successfully');
  }

  /**
   * Get socket.io instance
   */
  getIO() {
    return this.io;
  }

  /**
   * Get chat handler instance
   */
  getChatHandler() {
    return this.chatHandler;
  }

  /**
   * Broadcast system message
   */
  broadcastSystemMessage(message, targetRole = null) {
    return this.chatHandler.broadcastSystemMessage(message, targetRole);
  }

  /**
   * Get server statistics
   */
  getStatistics() {
    return {
      connectedUsers: this.chatHandler.getConnectedUsersCount(),
      sockets: this.io.sockets.sockets.size,
      rooms: this.io.sockets.adapter.rooms.size
    };
  }
}

module.exports = SocketServer;
