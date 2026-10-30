import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// সাইন আপ / আইডি তৈরি
// সাইন আপ / আইডি তৈরি
export const register = async (req, res) => {
  try {
    const { name, username, email, password, dob, gender, phone } = req.body;

    // আলাদাভাবে ইমেল চেক
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "এই ইমেল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট খোলা হয়েছে!" });
    }

    // আলাদাভাবে ইউজারনেম চেক
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "এই ইউজারনেমটি ইতিমধ্যে ব্যবহৃত হচ্ছে, অন্য একটি দিন!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
      dob,
      gender,
      phone,
    });

    const savedUser = await newUser.save();
    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        _id: savedUser._id,
        name: savedUser.name,
        username: savedUser.username,
        email: savedUser.email,
        dob: savedUser.dob,
        gender: savedUser.gender,
        phone: savedUser.phone,
        profilePic: savedUser.profilePic,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// লগইন ফাংশন
// লগইন ফাংশন (শর্ত অনুযায়ী: ১,২ অথবা ৩,২)
export const login = async (req, res) => {
  try {
    const { identifier, username, password } = req.body; 
    // identifier = ফোন অথবা ইমেল (১), password = পাসওয়ার্ড (২), username = অপশনাল ইউজার নাম (৩)

    let user;

    // শর্ত ১ ও ২: ফোন অথবা ইমেল এবং পাসওয়ার্ড দিয়ে চেক
    if (identifier && identifier.trim() !== "") {
      user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
    } 
    // শর্ত ৩ ও ২: ইউজারনেম এবং পাসওয়ার্ড দিয়ে চেক
    else if (username && username.trim() !== "") {
      user = await User.findOne({ username });
    } else {
      return res.status(400).json({ message: "দয়া করে ইমেল/ফোন অথবা ইউজারনেম দিন!" });
    }

    if (!user) {
      return res.status(400).json({ message: "এই তথ্যের সাথে কোনো অ্যাকাউন্ট খুঁজে পাওয়া যায়নি!" });
    }

    // পাসওয়ার্ড মিলছে কিনা চেক করা
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "পাসওয়ার্ড সঠিক নয়!" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '7d' });

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        profilePic: user.profilePic,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};