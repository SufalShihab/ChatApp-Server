import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// নতুন কনভার্সেশন তৈরি বা বিদ্যমান কনভার্সেশন খুঁজে বের করা (ব্লক স্ট্যাটাসসহ)
export const getOrCreateConversation = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    // ১. চেক করা ইতিমধ্যে দুজনের মধ্যে চ্যাট আছে কিনা
    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    // ২. যদি না থাকে, তবে নতুন কনভার্সেশন তৈরি করা
    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    const fullConversation = await Conversation.findById(conversation._id).populate('members', '-password');
    
    // ৩. বর্তমান ইউজার এবং অপর ইউজারের লেটেস্ট ব্লক লিস্ট ফেচ করা
    const currentUser = await User.findById(senderId);
    const receiverUser = await User.findById(receiverId);

    // ফ্রন্টএন্ডের সুবিধার জন্য কনভার্সেশন অবজেক্টের সাথে ব্লক স্ট্যাটাস যুক্ত করে পাঠানো
    const conversationResponse = {
      ...fullConversation.toObject(),
      isBlockedByMe: currentUser.blockedUsers?.includes(receiverId),
      isBlockedByThem: receiverUser.blockedUsers?.includes(senderId),
    };

    res.status(200).json(conversationResponse);
  } catch (error) {
    console.error("Error in getOrCreateConversation:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ইউজারের সব কনভার্সেশন বা চ্যাট লিস্ট ফেচ করা
export const getUserConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: { $in: [req.user._id] },
    })
      .populate('members', '-password')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};