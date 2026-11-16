// import Message from '../models/Message.js';
// import Conversation from '../models/Conversation.js';
// import User from '../models/User.js';
// import { cloudinary } from '../utils/cloudinary.js';

// // ১. মেসেজ পাঠানো (টেক্সট, ফাইল, রিপ্লাই এবং ব্লক চেক সহ)
// export const sendMessage = async (req, res) => {
//   try {
//     const { conversationId, text, receiverId, replyTo } = req.body;
//     const senderId = req.user._id;

//     // চেক করা যে সেন্ডার বা রিসিভার একে অপরকে ব্লক করেছে কি না
//     const recipient = await User.findById(receiverId);
//     const sender = await User.findById(senderId);

//     if (!recipient || !sender) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (recipient.blockedUsers.includes(senderId) || sender.blockedUsers.includes(receiverId)) {
//       return res.status(403).json({ message: "You cannot send messages to this user because of blocking." });
//     }

//     let attachmentUrls = [];
//     if (req.files && req.files.length > 0) {
//       attachmentUrls = req.files.map((file) => file.path);
//     }

//     const newMessage = await Message.create({
//       conversationId,
//       sender: senderId,
//       text: text || "",
//       attachments: attachmentUrls,
//       replyTo: replyTo || null,
//       seenBy: [senderId],
//     });

//     // কনভার্সেশনের লাস্ট মেসেজ, আনরিড কাউন্ট এবং updatedAt আপডেট করা
// // কনভার্সেশনের লাস্ট মেসেজ এবং unreadCounts আপডেট করা
//     const conversation = await Conversation.findById(conversationId);
//     if (conversation) {
//       conversation.lastMessage = newMessage._id;
//       conversation.updatedAt = Date.now();
      
//       if (!conversation.unreadCounts) {
//         conversation.unreadCounts = new Map();
//       }
      
//       // বর্তমান প্রাপক যদি এই চ্যাটটি ওপেন করে রাখে, তবে আমরা কাউন্ট বাড়াবো না বা 0 রাখব
//       // (যেহেতু ফ্রন্টএন্ড থেকে ওপেন থাকলেই markAsRead কল হয়)
//       const currentCount = conversation.unreadCounts.get(receiverId.toString()) || 0;
      
//       // যদি রিসিভার চ্যাটবক্সে না থাকে কেবল তখনই কাউন্ট ১ বাড়বে
//       conversation.unreadCounts.set(receiverId.toString(), currentCount + 1);
      
//       conversation.hiddenBy = conversation.hiddenBy.filter(
//         id => id.toString() !== receiverId.toString()
//       );

//       await conversation.save();
//     }    
//     const populatedMessage = await Message.findById(newMessage._id)
//       .populate('sender', 'name profilePic')
//       .populate({
//         path: 'replyTo',
//         populate: { path: 'sender', select: 'name' }
//       });

//     res.status(201).json(populatedMessage);
//   } catch (error) {
//     console.error("Error in sendMessage:", error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // ২. মেসেজ রিঅ্যাকশন যোগ বা আপডেট করা
// export const addReaction = async (req, res) => {
//   try {
//     const { messageId } = req.params;
//     const { emoji } = req.body;
//     const userId = req.user._id;

//     const message = await Message.findById(messageId);
//     if (!message) return res.status(404).json({ message: 'Message not found' });

//     const existingReactionIndex = message.reactions.findIndex(
//       (r) => r.user.toString() === userId.toString()
//     );

//     if (existingReactionIndex > -1) {
//       if (message.reactions[existingReactionIndex].emoji === emoji) {
//         message.reactions.splice(existingReactionIndex, 1);
//       } else {
//         message.reactions[existingReactionIndex].emoji = emoji;
//       }
//     } else {
//       message.reactions.push({ user: userId, emoji });
//     }

//     await message.save();
//     const updatedMessage = await Message.findById(messageId).populate('sender', 'name profilePic');
//     res.status(200).json(updatedMessage);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // ৩. মেসেজ ডিলিট করা (Soft Delete)
// export const deleteMessage = async (req, res) => {
//   try {
//     const { messageId } = req.params;
//     const message = await Message.findById(messageId);

//     if (!message) {
//       return res.status(404).json({ message: 'Message not found' });
//     }

//     if (message.attachments && message.attachments.length > 0) {
//       for (const fileUrl of message.attachments) {
//         const parts = fileUrl.split('/');
//         const fileName = parts[parts.length - 1].split('.')[0];
//         const folderName = parts[parts.length - 2];
//         const publicId = `${folderName}/${fileName}`;

//         await cloudinary.uploader.destroy(publicId);
//       }
//     }

//     message.text = "This message was deleted";
//     message.attachments = [];
//     message.reactions = [];
//     await message.save();

//     const updatedMessage = await Message.findById(messageId)
//       .populate('sender', 'name profilePic')
//       .populate({
//         path: 'replyTo',
//         populate: { path: 'sender', select: 'name' }
//       });

//     res.status(200).json(updatedMessage);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // ৪. মেসেজ ফেচ করা
// export const getMessages = async (req, res) => {
//   try {
//     const { conversationId } = req.params;
//     const messages = await Message.find({ conversationId })
//       .populate('sender', 'name profilePic')
//       .populate({
//         path: 'replyTo',
//         populate: { path: 'sender', select: 'name' }
//       })
//       .sort({ createdAt: 1 });

//     res.status(200).json(messages);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // ৫. মেসেজগুলোকে 'Seen' হিসেবে মার্ক করার কন্ট্রোলার
// export const markMessagesAsSeen = async (req, res) => {
//   try {
//     const { conversationId } = req.params;
//     const userId = req.user._id;

//     await Message.updateMany(
//       {
//         conversationId,
//         sender: { $ne: userId },
//         seenBy: { $ne: userId },
//       },
//       {
//         $push: { seenBy: userId },
//       }
//     );

//     res.status(200).json({ message: "Messages marked as seen" });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // ৬. চ্যাট ওপেন করলে আনরিড কাউন্ট শূন্য (0) করার কন্ট্রোলার
// export const markChatAsRead = async (req, res) => {
//   try {
//     const { conversationId } = req.params;
//     const userId = req.user._id.toString();

//     const conversation = await Conversation.findById(conversationId);
//     if (conversation) {
//       if (!conversation.unreadCounts) {
//         conversation.unreadCounts = new Map();
//       }
//       conversation.unreadCounts.set(userId, 0);
//       await conversation.save();
//     }

//     res.status(200).json({ message: "Chat marked as read" });
//   } catch (error) {
//     console.error("Error in markChatAsRead:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };



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

    // কনভার্সেশনের লাস্ট মেসেজ, আনরিড কাউন্ট এবং updatedAt আপডেট করা
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      conversation.lastMessage = newMessage._id;
      conversation.updatedAt = Date.now();
      
      if (!conversation.unreadCounts) {
        conversation.unreadCounts = new Map();
      }
      
      const currentCount = conversation.unreadCounts.get(receiverId.toString()) || 0;
      conversation.unreadCounts.set(receiverId.toString(), currentCount + 1);
      
      // 🔥 অত্যন্ত গুরুত্বপূর্ণ: মেসেজ আদান-প্রদান হলে সেন্ডার এবং রিসিভার উভয়েরই হাইড লিস্ট থেকে 
      // কনভার্সেশনটি রিমুভ করে দেওয়া, যাতে দুজনের চ্যাট লিস্টেই এটি স্বয়ংক্রিয়ভাবে ফিরে আসে।
      if (conversation.hiddenBy && conversation.hiddenBy.length > 0) {
        conversation.hiddenBy = conversation.hiddenBy.filter(
          id => id.toString() !== senderId.toString() && id.toString() !== receiverId.toString()
        );
      }

      await conversation.save();
    }    

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

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === userId.toString()
    );

    if (existingReactionIndex > -1) {
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();
    const updatedMessage = await Message.findById(messageId).populate('sender', 'name profilePic');
    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ৩. মেসেজ ডিলিট করা (Soft Delete)
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.attachments && message.attachments.length > 0) {
      for (const fileUrl of message.attachments) {
        const parts = fileUrl.split('/');
        const fileName = parts[parts.length - 1].split('.')[0];
        const folderName = parts[parts.length - 2];
        const publicId = `${folderName}/${fileName}`;

        await cloudinary.uploader.destroy(publicId);
      }
    }

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

// ৫. মেসেজগুলোকে 'Seen' হিসেবে মার্ক করার কন্ট্রোলার
export const markMessagesAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        seenBy: { $ne: userId },
      },
      {
        $push: { seenBy: userId },
      }
    );

    res.status(200).json({ message: "Messages marked as seen" });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ৬. চ্যাট ওপেন করলে আনরিড কাউন্ট শূন্য (0) করার কন্ট্রোলার
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};