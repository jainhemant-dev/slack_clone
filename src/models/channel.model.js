import mongoose from 'mongoose';

const ChannelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Channel name is required'],
    trim: true,
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: [true, 'Workspace is required'],
  },
  description: {
    type: String,
    default: '',
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Channel creator is required'],
  },
  pinnedItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  }],
  isDirectMessage: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Check if the model exists before creating it
export default mongoose.models.Channel || mongoose.model('Channel', ChannelSchema);