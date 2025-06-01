const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a notification title']
  },
  message: {
    type: String,
    required: [true, 'Please provide a notification message']
  },
  type: {
    type: String,
    enum: ['support_request', 'knowledge_base', 'system', 'admin'],
    required: true
  },
  relatedTo: {
    model: {
      type: String,
      enum: ['SupportRequest', 'KnowledgeArticle', 'User', null],
      default: null
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// Static method to get unread count for a user
NotificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ user: userId, isRead: false });
};

// Static method to mark all as read for a user
NotificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { user: userId, isRead: false },
    { isRead: true }
  );
};

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;
