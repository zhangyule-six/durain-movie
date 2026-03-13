const commentSchema = new mongoose.Schema(
  {
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      required: true,
      index: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    // 二级回复逻辑
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    }, // 如果是回复某条评论
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    }, // 被回复的人
  },
  { timestamps: true },
);

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;