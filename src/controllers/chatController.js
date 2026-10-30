import Conversation from '../models/Conversation.js';

// নতুন কনভার্সেশন তৈরি বা বিদ্যমান কনভার্সেশন খুঁজে বের করা
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

    // ২. যদি না থাকে, তবে members অ্যারেতে উভয় আইডি দিয়ে নতুন কনভার্সেশন তৈরি করা
    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    const fullConversation = await Conversation.findById(conversation._id).populate('members', '-password');
    res.status(200).json(fullConversation);
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