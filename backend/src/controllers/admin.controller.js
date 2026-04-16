import User from "../models/user.model.js";
import Movie from "../models/movie.model.js";
import Review from "../models/review.model.js";

export const getStats = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [userCount, movieCount, reviewCount, recentUsers, recentReviews] =
      await Promise.all([
        User.countDocuments(),
        Movie.countDocuments(),
        Review.countDocuments(),
        User.aggregate([
          { $match: { createdAt: { $gte: sevenDaysAgo } } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Review.aggregate([
          { $match: { createdAt: { $gte: sevenDaysAgo } } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    res.json({
      userCount,
      movieCount,
      reviewCount,
      recentUsers,
      recentReviews,
    });
  } catch (err) {
    console.error("Error in getStats:", err);
    res.status(500).json({ message: "获取统计数据失败" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;
    const q = req.query.q?.trim();

    const filter = {};
    if (q) {
      filter.$or = [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({ items, pagination: { page, limit, total } });
  } catch (err) {
    console.error("Error in getUsers:", err);
    res.status(500).json({ message: "获取用户列表失败" });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "无效的角色值" });
    }

    if (req.user._id.toString() === id) {
      return res.status(403).json({ message: "不能修改自己的角色" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error in updateUserRole:", err);
    res.status(500).json({ message: "更新用户角色失败" });
  }
};

export const getMovies = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;
    const q = req.query.q?.trim();

    const filter = {};
    if (q) {
      filter.title = { $regex: q, $options: "i" };
    }

    const [items, total] = await Promise.all([
      Movie.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Movie.countDocuments(filter),
    ]);

    res.json({ items, pagination: { page, limit, total } });
  } catch (err) {
    console.error("Error in getMovies:", err);
    res.status(500).json({ message: "获取电影列表失败" });
  }
};

export const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = [
      "title",
      "originalTitle",
      "poster",
      "backdrop",
      "summary",
      "genres",
      "duration",
      "country",
      "filmLanguage",
      "cast",
      "releaseDate",
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const movie = await Movie.findByIdAndUpdate(id, updates, { new: true });
    if (!movie) {
      return res.status(404).json({ message: "电影不存在" });
    }

    res.json(movie);
  } catch (err) {
    console.error("Error in updateMovie:", err);
    res.status(500).json({ message: "更新电影信息失败" });
  }
};

export const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;

    const movie = await Movie.findByIdAndDelete(id);
    if (!movie) {
      return res.status(404).json({ message: "电影不存在" });
    }

    await Review.deleteMany({ movie: id });

    res.json({ message: "电影及关联评论已删除" });
  } catch (err) {
    console.error("Error in deleteMovie:", err);
    res.status(500).json({ message: "删除电影失败" });
  }
};

export const getReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Review.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "username avatar")
        .populate("movie", "title poster"),
      Review.countDocuments(),
    ]);

    res.json({ items, pagination: { page, limit, total } });
  } catch (err) {
    console.error("Error in getReviews:", err);
    res.status(500).json({ message: "获取评论列表失败" });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return res.status(404).json({ message: "评论不存在" });
    }

    res.json({ message: "评论已删除" });
  } catch (err) {
    console.error("Error in deleteReview:", err);
    res.status(500).json({ message: "删除评论失败" });
  }
};
