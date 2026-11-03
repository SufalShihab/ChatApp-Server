import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// নতুন কনভার্সেশন তৈরি বা বিদ্যমান কনভার্সেশন খুঁজে বের করা (নিরাপদ ও টাইপ-সেফ চেকসহ)
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
    
    // সেফলি ইউজার ফেচ করা
    const currentUser = await User.findById(senderId);
    const receiverUser = await User.findById(receiverId);

    // .some() এবং .toString() ব্যবহার করে ObjectId ও সঠিক তুলনা নিশ্চিত করা হলো
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

// ইউজারের সব কনভার্সেশন বা চ্যাট লিস্ট ফেচ করা (সুরক্ষিত ও নিখুঁত)
export const getUserConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: { $in: [req.user._id] },
      hiddenBy: { $ne: req.user._id },
    })
      // এখানে -password বাদ দিয়ে শুধুমাত্র পজিটিভ সিলেকশন ব্যবহার করা হলো
      .populate('members', 'name username profilePic')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    // ফিল্টার করে নিশ্চিত করা যাতে কোনো ফাঁকা মেম্বার না থাকে
    const validConversations = conversations.filter(conv => conv.members && conv.members.length > 0);

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