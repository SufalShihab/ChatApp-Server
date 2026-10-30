import FriendRequest from '../models/FriendRequest.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// ১. ফ্রেন্ড রিকোয়েস্ট পাঠানো
export const sendFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user._id;

    if (senderId.toString() === recipientId) {
      return res.status(400).json({ message: "You cannot send a friend request to yourself." });
    }

    // চেক করা আগে থেকে কোনো রিকোয়েস্ট আছে কি না
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, recipient: recipientId },
        { sender: recipientId, recipient: senderId }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ message: "A friend request already exists or you are already connected." });
    }

    const newRequest = new FriendRequest({
      sender: senderId,
      recipient: recipientId,
      status: 'pending'
    });

    await newRequest.save();
    res.status(201).json({ message: "Friend request sent successfully!" });
  } catch (error) {
    console.error("Error in sendFriendRequest:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ২. ইউজারের নিকট আসা পেন্ডিং নোটিফিকেশন/রিকোয়েস্টগুলো ফেচ করা
export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await FriendRequest.find({
      recipient: userId,
      status: 'pending'
    }).populate('sender', 'name username profilePic email');

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error in getFriendRequests:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ৩. ফ্রেন্ড রিকোয়েস্ট অ্যাকসেপ্ট করা, অটো চ্যাট ক্রিয়েট করা এবং পার্মানেন্ট নোটিফিকেশন সেভ করা
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await FriendRequest.findById(requestId).populate('sender', 'name');
    if (!request) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    request.status = 'accepted';
    await request.save();

    // ১ম ব্যক্তির (sender) জন্য পার্মানেন্ট নোটিফিকেশন তৈরি করা
    const existingNotification = await Notification.findOne({
      recipient: request.sender._id,
      sender: request.recipient,
      type: 'request_accepted'
    });

    if (!existingNotification) {
      const newNotification = new Notification({
        recipient: request.sender._id, // যিনি রিকোয়েস্ট পাঠিয়েছিলেন
        sender: request.recipient,     // যিনি এক্সেপ্ট করলেন
        type: 'request_accepted',
        message: `accepted your friend request.`
      });
      await newNotification.save();
    }

    // চেক করা ইতিমধ্যে দুজনের মধ্যে কোনো কনভার্সেশন আছে কি না
    let chat = await Conversation.findOne({
      isGroupChat: false,
      users: { $all: [request.sender._id, request.recipient] }
    });

    // না থাকলে নতুন কনভার্সেশন ক্রিয়েট করা
    if (!chat) {
      chat = new Conversation({
        chatName: "Direct Chat",
        isGroupChat: false,
        users: [request.sender._id, request.recipient]
      });
      await chat.save();
    }

    res.status(200).json({ 
      message: "Friend request accepted successfully!", 
      chat,
      sender: request.sender._id,
      recipient: request.recipient
    });
  } catch (error) {
    console.error("Error in acceptFriendRequest:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ৪. ফ্রেন্ড রিকোয়েস্ট ডিলিট বা রিজেক্ট করা
export const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    await FriendRequest.findByIdAndDelete(requestId);
    res.status(200).json({ message: "Friend request removed." });
  } catch (error) {
    console.error("Error in rejectFriendRequest:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ৫. ইউজারের কনফার্মড ফ্রেন্ড লিস্ট ফেচ করা
export const getMyFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    const friendships = await FriendRequest.find({
      status: 'accepted',
      $or: [{ sender: userId }, { recipient: userId }]
    }).populate('sender recipient', 'name username profilePic email');

    const friends = friendships.map(friend => {
      if (friend.sender._id.toString() === userId.toString()) {
        return friend.recipient;
      } else {
        return friend.sender;
      }
    });

    res.status(200).json(friends);
  } catch (error) {
    console.error("Error in getMyFriends:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ৬. ইউজারের পার্মানেন্ট নোটিফিকেশনগুলো ফেচ করা
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'name username profilePic')
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error in getUserNotifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};