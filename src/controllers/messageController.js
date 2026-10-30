import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

// মেসেজ পাঠানো
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text, receiverId } = req.body;
    const senderId = req.user._id;

    const newMessage = await Message.create({
      conversationId,
      sender: senderId,
      text,
      seenBy: [senderId],
    });

    // কনভার্সেশনের lastMessage আপডেট করা
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id,
    });

    const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name avatar');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// নির্দিষ্ট কনভার্সেশনের সব মেসেজ নিয়ে আসা
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};