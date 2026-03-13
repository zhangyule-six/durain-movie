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
    type: { type: String, enum: ["like", "comment", "follow", "system"] },
    refId: { type: mongoose.Schema.Types.ObjectId }, // 指向对应的影评或评论ID
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;