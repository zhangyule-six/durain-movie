import mongoose from "mongoose";
const reviewSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
      index: true,
    },
    score: { type: Number, required: true, min: 1, max: 10 }, // 用户给电影打的分
    content: { type: String, required: true, minlength: 1},
    images: [String], // 影评配图（Cloudinary URL）
    tags: [String],
    // 社交互动
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // 存储点赞用户ID，方便前端判断“我是否点赞”
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: true }, // 是否公开，支持私密日记
  },
  { timestamps: true },
);

// 复合索引：优化“查看某部电影下的最新影评”查询
reviewSchema.index({ movie: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;