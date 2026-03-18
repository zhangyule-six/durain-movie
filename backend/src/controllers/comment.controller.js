import Comment from "../models/comments.model.js";
import Review from "../models/review.model.js";
import Notification from "../models/notification.model.js";

// 发表评论 / 回复
export const createComment = async (req, res) => {
  try {
    const { reviewId, content, parentCommentId, replyToUserId } = req.body;

    if (!reviewId || !content) {
      return res.status(400).json({ message: "reviewId、content 为必填" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "影评不存在" });
    }

    const doc = await Comment.create({
      review: reviewId,
      author: req.user._id,
      content,
      parentComment: parentCommentId || null,
      replyToUser: replyToUserId || null,
    });

    review.commentCount += 1;
    await review.save();

    const populated = await doc.populate([
      { path: "author", select: "username avatar" },
      { path: "replyToUser", select: "username avatar" },
    ]);

    // 通知逻辑：refId 存新评论的 _id，便于展示回复者说的内容
    const sender = req.user._id;
    // 一级评论：通知影评作者
    if (!parentCommentId) {
      if (review.author.toString() !== sender.toString()) {
        await Notification.create({
          receiver: review.author,
          sender,
          type: "comment",
          refId: doc._id,
          refType: "comment",
        });
      }
    } else if (replyToUserId && replyToUserId !== sender.toString()) {
      // 回复评论：通知被回复的用户
      await Notification.create({
        receiver: replyToUserId,
        sender,
        type: "comment",
        refId: doc._id,
        refType: "comment",
      });
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("Error in createComment:", err);
    res.status(500).json({ message: "创建评论失败" });
  }
};

// 获取某条影评下的评论树
export const listReviewComments = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const comments = await Comment.find({ review: reviewId })
      .sort({ createdAt: 1 })
      .populate([
        { path: "author", select: "username avatar" },
        { path: "replyToUser", select: "username avatar" },
      ]);

    const map = new Map();
    const roots = [];

    comments.forEach((c) => {
      const obj = c.toObject();
      obj.children = [];
      map.set(String(c._id), obj);
    });

    map.forEach((value) => {
      if (value.parentComment) {
        const parent = map.get(String(value.parentComment));
        if (parent) {
          parent.children.push(value);
        } else {
          roots.push(value);
        }
      } else {
        roots.push(value);
      }
    });

    res.json(roots);
  } catch (err) {
    console.error("Error in listReviewComments:", err);
    res.status(500).json({ message: "获取评论列表失败" });
  }
};

// 点赞 / 取消点赞评论
export const toggleLikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { action } = req.body || {};
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "评论不存在" });
    }

    const alreadyLiked = comment.likes.some((id) => id.toString() === userId.toString());
    let newLikeState = alreadyLiked;

    if (action === "like" || (!action && !alreadyLiked)) {
      if (!alreadyLiked) {
        comment.likes.push(userId);
        comment.likeCount += 1;
        newLikeState = true;

        if (comment.author.toString() !== userId.toString()) {
          await Notification.create({
            receiver: comment.author,
            sender: userId,
            type: "like",
            refId: comment._id,
            refType: "comment",
          });
        }
      }
    } else if (action === "unlike" || (!action && alreadyLiked)) {
      if (alreadyLiked) {
        comment.likes = comment.likes.filter((id) => id.toString() !== userId.toString());
        comment.likeCount = Math.max(0, comment.likeCount - 1);
        newLikeState = false;
      }
    }

    await comment.save();

    res.json({
      likeCount: comment.likeCount,
      liked: newLikeState,
    });
  } catch (err) {
    console.error("Error in toggleLikeComment:", err);
    res.status(500).json({ message: "更新评论点赞状态失败" });
  }
};

