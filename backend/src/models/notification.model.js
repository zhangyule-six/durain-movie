import mongoose from "mongoose";
const notificationSchema = new mongoose.Schema(
  {
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String, enum: ["like", "comment", "follow", "system"], required: true },
    // 指向对应的实体（影评 / 评论 / 用户 / 系统）
    refId: { type: mongoose.Schema.Types.ObjectId },
    refType: {
      type: String,
      enum: ["review", "comment", "user", "system"],
      required: true,
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;