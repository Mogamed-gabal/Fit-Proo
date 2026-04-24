const mongoose = require('mongoose');

/**
 * Chat Message Model
 * Stores individual chat messages with read receipts and metadata
 */
const chatMessageSchema = new mongoose.Schema({
  // Message identification
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Chat reference
  chatId: {
    type: String,
    required: true,
    ref: 'Chat',
    index: true
  },
  
  // Sender information
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Message content
  content: {
    type: String,
    required: true,
    maxlength: [4000, 'Message content cannot exceed 4000 characters']
  },
  
  // Message type
  type: {
    type: String,
    required: true,
    enum: ['TEXT', 'IMAGE', 'FILE', 'SYSTEM'],
    default: 'TEXT',
    index: true
  },
  
  // File attachment (for IMAGE/FILE types)
  attachment: {
    url: String,
    filename: String,
    mimeType: String,
    size: Number,
    thumbnailUrl: String
  },
  
  // Read receipts
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: {
      type: Date,
      required: true,
      default: Date.now
    }
  }],
  
  // Message status
  status: {
    type: String,
    required: true,
    enum: ['SENT', 'DELIVERED', 'READ', 'FAILED'],
    default: 'SENT',
    index: true
  },
  
  // Message metadata
  metadata: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    originalContent: String,
    replyTo: {
      type: String,
      ref: 'ChatMessage'
    },
    mentions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      username: String
    }],
    reactions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      type: {
        type: String,
        enum: ['LIKE', 'LOVE', 'LAUGH', 'ANGRY', 'SAD']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // System message data (for SYSTEM type messages)
  systemData: {
    action: String, // USER_JOINED, USER_LEFT, CHAT_CREATED, etc.
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    targetUserName: String,
    details: mongoose.Schema.Types.Mixed
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    index: true
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'chat_messages'
});

// Indexes for performance
chatMessageSchema.index({ chatId: 1, createdAt: -1 });
chatMessageSchema.index({ senderId: 1, createdAt: -1 });
chatMessageSchema.index({ chatId: 1, senderId: 1 });
chatMessageSchema.index({ status: 1 });
chatMessageSchema.index({ type: 1 });
chatMessageSchema.index({ 'readBy.userId': 1 });
chatMessageSchema.index({ isDeleted: 1, createdAt: -1 });

// Static methods
chatMessageSchema.statics.createMessage = async function(messageData) {
  try {
    // Generate unique message ID
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const message = await this.create({
      ...messageData,
      messageId,
      status: 'SENT'
    });
    
    console.log(`Created message ${messageId} in chat ${messageData.chatId}`);
    return message;
    
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
};

chatMessageSchema.statics.getChatMessages = async function(chatId, options = {}) {
  try {
    const {
      page = 1,
      limit = 50,
      before = null,
      after = null,
      includeDeleted = false
    } = options;
    
    const query = { chatId };
    
    if (!includeDeleted) {
      query.isDeleted = false;
    }
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    if (after) {
      query.createdAt = { $gt: new Date(after) };
    }
    
    const messages = await this.find(query)
      .populate('senderId', 'name email role avatar')
      .populate('readBy.userId', 'name email')
      .populate('metadata.replyTo', 'messageId content senderId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();
    
    // Reverse to get chronological order
    return messages.reverse();
    
  } catch (error) {
    console.error('Error getting chat messages:', error);
    throw error;
  }
};

chatMessageSchema.statics.markAsRead = async function(messageId, userId) {
  try {
    const message = await this.findOneAndUpdate(
      {
        messageId,
        'readBy.userId': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            userId,
            readAt: new Date()
          }
        },
        $set: {
          status: 'READ'
        }
      },
      { new: true }
    );
    
    if (message) {
      console.log(`Marked message ${messageId} as read by user ${userId}`);
    }
    
    return message;
    
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

chatMessageSchema.statics.markChatAsRead = async function(chatId, userId) {
  try {
    const result = await this.updateMany(
      {
        chatId,
        senderId: { $ne: userId },
        'readBy.userId': { $ne: userId },
        isDeleted: false
      },
      {
        $push: {
          readBy: {
            userId,
            readAt: new Date()
          }
        }
      }
    );
    
    console.log(`Marked ${result.modifiedCount} messages as read in chat ${chatId} by user ${userId}`);
    return result;
    
  } catch (error) {
    console.error('Error marking chat as read:', error);
    throw error;
  }
};

chatMessageSchema.statics.getUnreadCount = async function(chatId, userId) {
  try {
    // First try to get unread count using participant lastReadAt (optimized)
    const Chat = require('./Chat');
    const chat = await Chat.findOne({ chatId, isDeleted: false });
    
    if (chat) {
      const participant = chat.participants.find(p => 
        p.userId.toString() === userId.toString()
      );
      
      if (participant && participant.lastReadAt) {
        const count = await this.countDocuments({
          chatId,
          senderId: { $ne: userId },
          createdAt: { $gt: participant.lastReadAt },
          isDeleted: false,
          type: { $ne: 'SYSTEM' } // Exclude system messages from unread count
        });
        return count;
      }
    }
    
    // Fallback to original method (excluding system messages)
    const count = await this.countDocuments({
      chatId,
      senderId: { $ne: userId },
      'readBy.userId': { $ne: userId },
      isDeleted: false,
      type: { $ne: 'SYSTEM' } // Exclude system messages from unread count
    });
    
    return count;
    
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

chatMessageSchema.statics.deleteMessage = async function(messageId, deletedBy) {
  try {
    const message = await this.findOneAndUpdate(
      { messageId, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy
        }
      },
      { new: true }
    );
    
    if (message) {
      console.log(`Deleted message ${messageId} by user ${deletedBy}`);
    }
    
    return message;
    
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

chatMessageSchema.statics.editMessage = async function(messageId, newContent, editedBy) {
  try {
    const message = await this.findOneAndUpdate(
      { messageId, isDeleted: false, senderId: editedBy },
      {
        $set: {
          content: newContent,
          'metadata.isEdited': true,
          'metadata.editedAt': new Date(),
          'metadata.originalContent': this.content
        }
      },
      { new: true }
    );
    
    if (message) {
      console.log(`Edited message ${messageId} by user ${editedBy}`);
    }
    
    return message;
    
  } catch (error) {
    console.error('Error editing message:', error);
    throw error;
  }
};

chatMessageSchema.statics.addReaction = async function(messageId, userId, reactionType) {
  try {
    const message = await this.findOneAndUpdate(
      {
        messageId,
        'metadata.reactions.userId': { $ne: userId }
      },
      {
        $push: {
          'metadata.reactions': {
            userId,
            type: reactionType,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    );
    
    if (message) {
      console.log(`Added reaction ${reactionType} to message ${messageId} by user ${userId}`);
    }
    
    return message;
    
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
};

chatMessageSchema.statics.removeReaction = async function(messageId, userId) {
  try {
    const message = await this.findOneAndUpdate(
      { messageId },
      {
        $pull: {
          'metadata.reactions': { userId }
        }
      },
      { new: true }
    );
    
    if (message) {
      console.log(`Removed reaction from message ${messageId} by user ${userId}`);
    }
    
    return message;
    
  } catch (error) {
    console.error('Error removing reaction:', error);
    throw error;
  }
};

// Instance methods
chatMessageSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  
  // Remove sensitive data if needed
  if (this.isDeleted) {
    obj.content = '[Message deleted]';
    obj.attachment = null;
  }
  
  return obj;
};

chatMessageSchema.methods.getReadStatus = function(userId) {
  const readByUser = this.readBy.find(read => read.userId.toString() === userId.toString());
  return {
    isRead: !!readByUser,
    readAt: readByUser ? readByUser.readAt : null
  };
};

// Virtual fields
chatMessageSchema.virtual('id').get(function() {
  return this._id;
});

// JSON transformation
chatMessageSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
