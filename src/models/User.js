import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: { type: String },
  gender: { type: String },
  phone: { type: String },
  profilePic: { type: String, default: "" },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}]
}, { timestamps: true });

export default mongoose.model('User', UserSchema);