import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    hiddenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // 🔥 নতুন যুক্ত হলো: কার কয়টি আনরিড মেসেজ আছে তা ট্র্যাক করার জন্য
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model('Conversation', conversationSchema);