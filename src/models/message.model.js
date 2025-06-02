import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Message content is required'],
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Message sender is required'],
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: [true, 'Channel is required'],
  },
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null, // null means it's not a thread reply
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  attachments: [{
    type: {
      type: String,
      enum: ['file', 'image', 'audio', 'video', 'link'],
    },
    url: String,
    name: String,
    size: Number,
    mimeType: String,
  }],
  reactions: [{
    emoji: String,
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  }],
  isEdited: {
    type: Boolean,
    default: false,
  },
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  isPinned: {
    type: Boolean,
    default: false,
  },
  tone: {
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral'
    },
    impact: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    category: {
      type: String,
      enum: ['assertive', 'aggressive', 'weak', 'confusing', 'clear', 'friendly', 'professional', 'casual','neutral'],
      default: 'neutral'
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    }
  },
}, { timestamps: true });

// Check if the model exists before creating it
export default mongoose.models.Message || mongoose.model('Message', MessageSchema);