import Review from "../models/review.model.js";
import Movie from "../models/movie.model.js";
import Notification from "../models/notification.model.js";
import mongoose from "mongoose";

// 重新统计并更新某部电影的评分信息
async function recalcMovieRating(movieId) {
  try {
    const stats = await Review.aggregate([
      { $match: { movie: typeof movieId === "string" ? new mongoose.Types.ObjectId(movieId) : movieId } },
      {
        $group: {
          _id: null,
          avg: { $avg: "$score" },
          count: { $sum: 1 },
        },
      },
    ]);

    let avg = 0;
    let count = 0;

    if (stats && stats.length > 0) {
      count = stats[0].count || 0;
      const rawAvg = stats[0].avg || 0;
      // 保留一位小数
      avg = Math.round(rawAvg * 10) / 10;
    }

    await Movie.findByIdAndUpdate(
      movieId,
      {
        $set: {
          "rating.average": avg,
          "rating.count": count,
        },
      },
      { new: false },
    );
  } catch (err) {
    console.error("Error in recalcMovieRating:", err);
  }
}

// 发布影评
export const createReview = async (req, res) => {
  try {
    const { movieId, score, content, images, tags } = req.body;

    if (!movieId || !score || !content) {
      return res.status(400).json({ message: "movieId、score、content 为必填" });
    }

    const review = await Review.create({
      author: req.user._id,
      movie: movieId,
      score,
      content,
      images: images || [],
      tags: tags || [],
    });

    // 影评创建成功后，重新统计并更新对应电影的评分信息
    await recalcMovieRating(movieId);

    const populated = await review.populate("author", "username avatar");

    res.status(201).json(populated);
  } catch (err) {
    console.error("Error in createReview:", err);
    res.status(500).json({ message: "创建影评失败" });
  }
};

// 获取某部电影下的影评列表
export const listMovieReviews = async (req, res) => {
  try {
    const { movieId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    const query = { movie: movieId, isPublic: true };

    const [items, total] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "username avatar"),
      Review.countDocuments(query),
    ]);

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
      },
    });
  } catch (err) {
    console.error("Error in listMovieReviews:", err);
    res.status(500).json({ message: "获取影评列表失败" });
  }
};

// 获取单条影评详情
export const getReviewDetail = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId).populate("author", "username avatar");
    if (!review) {
      return res.status(404).json({ message: "影评不存在" });
    }

    res.json(review);
  } catch (err) {
    console.error("Error in getReviewDetail:", err);
    res.status(500).json({ message: "获取影评详情失败" });
  }
};

// 点赞 / 取消点赞影评
export const toggleLikeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { action } = req.body || {};
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "影评不存在" });
    }

    const alreadyLiked = review.likes.some((id) => id.toString() === userId.toString());
    let newLikeState = alreadyLiked;

    if (action === "like" || (!action && !alreadyLiked)) {
      if (!alreadyLiked) {
        review.likes.push(userId);
        review.likeCount += 1;
        newLikeState = true;

        if (review.author.toString() !== userId.toString()) {
          await Notification.create({
            receiver: review.author,
            sender: userId,
            type: "like",
            refId: review._id,
            refType: "review",
          });
        }
      }
    } else if (action === "unlike" || (!action && alreadyLiked)) {
      if (alreadyLiked) {
        review.likes = review.likes.filter((id) => id.toString() !== userId.toString());
        review.likeCount = Math.max(0, review.likeCount - 1);
        newLikeState = false;
      }
    }

    await review.save();

    res.json({
      likeCount: review.likeCount,
      liked: newLikeState,
    });
  } catch (err) {
    console.error("Error in toggleLikeReview:", err);
    res.status(500).json({ message: "更新影评点赞状态失败" });
  }
};

// 获取全站热门影评列表
export const listHotReviews = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const reviews = await Review.find({ isPublic: true })
      .sort({ likeCount: -1, commentCount: -1, createdAt: -1 })
      .limit(limit)
      .populate("author", "username avatar")
      .populate("movie", "title poster");

    const items = reviews.map((r) => {
      const movie = r.movie && typeof r.movie === "object" ? r.movie : null;
      return {
        _id: r._id,
        author: r.author,
        score: r.score,
        content: r.content,
        likeCount: r.likeCount,
        commentCount: r.commentCount,
        createdAt: r.createdAt,
        movie: movie
          ? {
              id: movie._id,
              name: movie.title,
              image: movie.poster,
            }
          : null,
      };
    });

    res.json(items);
  } catch (err) {
    console.error("Error in listHotReviews:", err);
    res.status(500).json({ message: "获取热门影评失败" });
  }
};


