import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false, minlength: 6 },
    email: { type: String, required: true, unique: true, trim: true },
    avatar: { type: String, default: "https://cdn.example.com/default.png" },
    bio: { type: String, maxlength: 100, default: "这个人很懒，什么都没留下" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    stats: {
      following: { type: Number, default: 0 },
      followers: { type: Number, default: 0 },
      reviews: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
