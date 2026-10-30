import User from '../models/User.js';

// ১. সাইডবারের জন্য ইউজার ফেচ করার কন্ট্রোলার
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    // নিজের আইডি বাদ দিয়ে অন্য সব ইউজারদের খোঁজা
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