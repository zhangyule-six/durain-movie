import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    memberCount: {
      type: Number,
      default: 1,
      min: 1,
      max: 99,
    },
    maxMembers: {
      type: Number,
      default: 99,
      max: 99,
    },
    tags: [{ type: String, trim: true }],
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true },
);

groupSchema.index({ name: 1 }, { unique: true });
groupSchema.index({ memberCount: -1, createdAt: -1 });

const Group = mongoose.model("Group", groupSchema);

export default Group;
