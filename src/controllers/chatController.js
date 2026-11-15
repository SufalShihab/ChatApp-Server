import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// নতুন কনভার্সেশন তৈরি বা বিদ্যমান কনভার্সেশন খুঁজে বের করা
export const getOrCreateConversation = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    const fullConversation = await Conversation.findById(conversation._id).populate('members', 'name username profilePic');
    
    const currentUser = await User.findById(senderId);
    const receiverUser = await User.findById(receiverId);

    const isBlockedByMe = currentUser?.blockedUsers?.some(id => id.toString() === receiverId) || false;
    const isBlockedByThem = receiverUser?.blockedUsers?.some(id => id.toString() === senderId.toString()) || false;

    const conversationResponse = {
      ...fullConversation.toObject(),
      isBlockedByMe,
      isBlockedByThem,
    };

    res.status(200).json(conversationResponse);
  } catch (error) {
    console.error("Error in getOrCreateConversation:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ইউজারের সব কনভার্সেশন বা চ্যাট লিস্ট ফেচ করা (সুরক্ষিত ও ক্র্যাশ-প্রুফ)
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const conversations = await Conversation.find({
      members: { $in: [userId] },
      hiddenBy: { $ne: userId },
    })
      .populate('members', 'name username profilePic')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    const validConversations = conversations.map(conv => {
      const convObj = conv.toObject();
      
      // সেফলি unreadCount বের করা (যদি unreadCounts ম্যাপ না থাকে)
      let unreadCount = 0;
      if (convObj.unreadCounts) {
        // Map বা Object যেটাই হোক না কেন সেফলি রিড করা
        unreadCount = convObj.unreadCounts instanceof Map 
          ? (convObj.unreadCounts.get(userId) || 0) 
          : (convObj.unreadCounts[userId] || 0);
      }

      return {
        ...convObj,
        unreadCount,
      };
    }).filter(conv => conv.members && conv.members.length > 0 && !conv.members.includes(null));

    res.status(200).json(validConversations);
  } catch (error) {
    console.error("Error in getUserConversations:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// কনভার্সেশন হাইড বা ডিলিট করা
export const hideConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.hiddenBy) {
      conversation.hiddenBy = [];
    }

    if (!conversation.hiddenBy.includes(userId)) {
      conversation.hiddenBy.push(userId);
      await conversation.save();
    }

    res.status(200).json({ message: "Chat removed from list successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// চ্যাট ওপেন করলে আনরিড কাউন্ট শূন্য (0) করা
export const markChatAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      if (!conversation.unreadCounts) {
        conversation.unreadCounts = new Map();
      }
      conversation.unreadCounts.set(userId, 0);
      await conversation.save();
    }

    res.status(200).json({ message: "Chat marked as read" });
  } catch (error) {
    console.error("Error in markChatAsRead:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};