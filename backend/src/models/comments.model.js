import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      required: true,
      index: true,
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    // 多级回复逻辑：父评论
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    // 被回复的用户（通常等于父评论作者）
    replyToUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // 点赞信息
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likeCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// 复合索引：优化“查看某条影评下的评论列表”
commentSchema.index({ review: 1, createdAt: 1 });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;