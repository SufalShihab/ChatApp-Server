// import User from '../models/User.js';

// // ১. সাইডবারের জন্য ইউজার ফেচ করার কন্ট্রোলার
// export const getUsersForSidebar = async (req, res) => {
//   try {
//     const loggedInUserId = req.user._id;
//     // নিজের আইডি বাদ দিয়ে অন্য সব ইউজারদের খোঁজা
//     const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
//     res.status(200).json(filteredUsers);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // ২. প্রফাইল পিকচার আপডেট করার কন্ট্রোলার
// export const updateProfilePic = async (req, res) => {
//   try {
//     const { userId, profilePic } = req.body;

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { profilePic },
//       { new: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({ message: "User not found!" });
//     }

//     res.status(200).json({
//       message: "Profile picture updated successfully!",
//       user: {
//         _id: updatedUser._id,
//         name: updatedUser.name,
//         username: updatedUser.username,
//         email: updatedUser.email,
//         phone: updatedUser.phone,
//         dob: updatedUser.dob,
//         gender: updatedUser.gender,
//         profilePic: updatedUser.profilePic,
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


// // কাউকে ব্লক বা আনব্লক করা
// export const toggleBlockUser = async (req, res) => {
//   try {
//     const { userIdToBlock } = req.params;
//     const currentUserId = req.user._id;

//     if (currentUserId.toString() === userIdToBlock) {
//       return res.status(400).json({ message: "You cannot block yourself" });
//     }

//     const currentUser = await User.findById(currentUserId);
//     const isBlocked = currentUser.blockedUsers.includes(userIdToBlock);

//     if (isBlocked) {
//       // আনব্লক করা
//       currentUser.blockedUsers = currentUser.blockedUsers.filter(
//         (id) => id.toString() !== userIdToBlock
//       );
//       await currentUser.save();
//       return res.status(200).json({ message: "User unblocked successfully", blocked: false });
//     } else {
//       // ব্লক করা
//       currentUser.blockedUsers.push(userIdToBlock);
//       await currentUser.save();
//       return res.status(200).json({ message: "User blocked successfully", blocked: true });
//     }
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // ৩. নির্দিষ্ট ইউজারের প্রফাইল বা ব্লক লিস্ট ফেচ করার কন্ট্রোলার
// export const getUserProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id).select('-password');
//     if (!user) {
//       return res.status(404).json({ message: "User not found!" });
//     }
//     res.status(200).json(user);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

import User from '../models/User.js';

// ১. সাইডবারের জন্য ইউজার ফেচ করার কন্ট্রোলার
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ২. প্রফাইল পিকচার আপডেট করার কন্ট্রোলার
export const updateProfilePic = async (req, res) => {
  try {
    const { userId, profilePic } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.status(200).json({
      message: "Profile picture updated successfully!",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        dob: updatedUser.dob,
        gender: updatedUser.gender,
        profilePic: updatedUser.profilePic,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ৩. কাউকে ব্লক বা আনব্লক করার কন্ট্রোলার (সংশোধিত ও নিখুঁত)
// কাউকে ব্লক বা আনব্লক করার কন্ট্রোলার (সরাসরি findByIdAndUpdate দিয়ে আপডেট করা হলো)
export const toggleBlockUser = async (req, res) => {
  try {
    const { userIdToBlock } = req.params;
    const currentUserId = req.user._id;

    if (currentUserId.toString() === userIdToBlock) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const isBlocked = currentUser.blockedUsers.some(
      (id) => id.toString() === userIdToBlock
    );

    let updatedUser;
    if (isBlocked) {
      // আনব্লক করার জন্য পুল (pull) ব্যবহার করে সরাসরি ডাটাবেজ থেকে রিমুভ করা
      updatedUser = await User.findByIdAndUpdate(
        currentUserId,
        { $pull: { blockedUsers: userIdToBlock } },
        { new: true }
      );
      return res.status(200).json({ message: "User unblocked successfully", blocked: false, blockedUsers: updatedUser.blockedUsers });
    } else {
      // ব্লক করার জন্যaddToSet ব্যবহার করে ডুপ্লিকেট এড়ানো এবং নিশ্চিতভাবে যোগ করা
      updatedUser = await User.findByIdAndUpdate(
        currentUserId,
        { $addToSet: { blockedUsers: userIdToBlock } },
        { new: true }
      );
      return res.status(200).json({ message: "User blocked successfully", blocked: true, blockedUsers: updatedUser.blockedUsers });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// ৪. নির্দিষ্ট ইউজারের প্রফাইল বা ব্লক লিস্ট ফেচ করার কন্ট্রোলার
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};