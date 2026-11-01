import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { cloudinary } from '../utils/cloudinary.js';

// ১. মেসেজ পাঠানো (টেক্সট, ফাইল, রিপ্লাই এবং ব্লক চেক সহ)
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text, receiverId, replyTo } = req.body;
    const senderId = req.user._id;

    // চেক করা যে সেন্ডার বা রিসিভার একে অপরকে ব্লক করেছে কি না
    const recipient = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (!recipient || !sender) {
      return res.status(404).json({ message: "User not found" });
    }

    if (recipient.blockedUsers.includes(senderId) || sender.blockedUsers.includes(receiverId)) {
      return res.status(403).json({ message: "You cannot send messages to this user because of blocking." });
    }

    let attachmentUrls = [];
    if (req.files && req.files.length > 0) {
      attachmentUrls = req.files.map((file) => file.path);
    }

    const newMessage = await Message.create({
      conversationId,
      sender: senderId,
      text: text || "",
      attachments: attachmentUrls,
      replyTo: replyTo || null,
      seenBy: [senderId],
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id,
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name profilePic')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' }
      });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ২. মেসেজ রিঅ্যাকশন যোগ বা আপডেট করা
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // ইউজার ইতিমধ্যে কোনো রিঅ্যাকশন দিয়ে থাকলে তা আপডেট বা রিমোভ করা
    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === userId.toString()
    );

    if (existingReactionIndex > -1) {
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        // একই ইমোজিতে আবার ক্লিক করলে রিঅ্যাকশন মুছে যাবে
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // ভিন্ন ইমোজি হলে তা পরিবর্তন হবে
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      // নতুন রিঅ্যাকশন যোগ হবে
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();
    const updatedMessage = await Message.findById(messageId).populate('sender', 'name profilePic');
    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ৩. মেসেজ ডিলিট করা (Soft Delete - টেক্সট পরিবর্তন করে দেওয়া এবং Cloudinary থেকে ফাইল মোছা)
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // ছবি বা ফাইল থাকলে Cloudinary থেকে মুছে ফেলা
    if (message.attachments && message.attachments.length > 0) {
      for (const fileUrl of message.attachments) {
        const parts = fileUrl.split('/');
        const fileName = parts[parts.length - 1].split('.')[0];
        const folderName = parts[parts.length - 2];
        const publicId = `${folderName}/${fileName}`;

        await cloudinary.uploader.destroy(publicId);
      }
    }

    // ডাটাবেজ থেকে সম্পূর্ণ ডিলিট না করে টেক্সট ও অ্যাটাচমেন্ট পরিবর্তন করে দেওয়া
    message.text = "This message was deleted";
    message.attachments = [];
    message.reactions = [];
    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'name profilePic')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' }
      });

    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ৪. মেসেজ ফেচ করা
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId })
      .populate('sender', 'name profilePic')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' }
      })
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};