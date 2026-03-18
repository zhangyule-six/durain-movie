import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import Review from "../models/review.model.js";
import Favorite from "../models/favorite.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }
    //hash password，此处使用bcryptjs进行密码加密
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // 查询用户名/邮箱是否已存在
    const [existingByEmail, existingByUsername] = await Promise.all([
      User.findOne({ email }),
      User.findOne({ username }),
    ]);

    if (existingByEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }
    if (existingByUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    //哈希密码
    const salt = await bcrypt.genSalt(10); //方法返回一个promise/生成hash
    const hashedPassword = await bcrypt.hash(password, salt); //password和salt结合生成不可逆hash

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      //生成jwt token
      const token = generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        bio: newUser.bio,
        role: newUser.role,
        stats: newUser.stats,
        token,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (err) {
    console.log("Error in signup:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password); //比较明文密码和哈希密码

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      stats: user.stats,
      token,
    });
  } catch (err) {
    console.log("Error in login:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.log("Error in logout:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const { username, bio } = req.body || {};
    // 兼容旧字段 profilePic（前端若还在用）
    const avatarInput = req.body.avatar ?? req.body.profilePic;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let hasChange = false;

    // 更新用户名（需检查唯一性）
    if (typeof username === "string" && username.trim() && username.trim() !== user.username) {
      const existing = await User.findOne({
        username: username.trim(),
        _id: { $ne: userId },
      });
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      user.username = username.trim();
      hasChange = true;
    }

    // 更新个性签名
    if (typeof bio === "string") {
      user.bio = bio.trim().slice(0, 100);
      hasChange = true;
    }

    // 更新头像（Base64 / 远程 URL）
    if (avatarInput) {
      const uploadResponse = await cloudinary.uploader.upload(avatarInput);
      user.avatar = uploadResponse.secure_url;
      hasChange = true;
    }

    if (!hasChange) {
      return res.status(400).json({ message: "No changes provided" });
    }

    await user.save();

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      stats: user.stats,
    });
  } catch (err) {
    console.log("Error in updateProfile:", err);
    res.status(500).json({ message: err?.message || "Server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (err) {
    console.log("Error in checkAuth:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 获取当前用户的影评列表（我的评价）
export const listMyReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Review.find({ author: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "username avatar")
        .populate("movie", "title poster genres releaseDate"),
      Review.countDocuments({ author: userId }),
    ]);

    const list = items.map((r) => {
      const movie = r.movie && typeof r.movie === "object" ? r.movie : null;
      return {
        _id: r._id,
        movieId: r.movie?._id,
        movieName: movie?.title ?? "未知影片",
        score: r.score,
        content: r.content,
        likeCount: r.likeCount,
        commentCount: r.commentCount,
        createdAt: r.createdAt,
        poster: movie?.poster,
        genres: movie?.genres,
        releaseDate: movie?.releaseDate,
      };
    });

    res.json({
      items: list,
      pagination: { page, limit, total },
    });
  } catch (err) {
    console.log("Error in listMyReviews:", err);
    res.status(500).json({ message: "获取我的评价失败" });
  }
};

// 获取当前用户的收藏列表（我的收藏）
export const listMyFavorites = async (req, res) => {
  try {
    const userId = req.user._id;

    const favorites = await Favorite.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("movie", "title poster genres releaseDate");

    const list = favorites
      .filter((f) => f.movie)
      .map((f) => {
        const m = f.movie;
        const year = m.releaseDate ? new Date(m.releaseDate).getFullYear() : "";
        const genres = Array.isArray(m.genres) ? m.genres.join(" / ") : "";
        return {
          _id: f._id,
          movieId: m._id,
          movieName: m.title ?? "未知影片",
          poster: m.poster ?? "",
          info: [year, genres].filter(Boolean).join(" · ") || "—",
          genres: m.genres,
          releaseDate: m.releaseDate,
        };
      });

    res.json({ items: list });
  } catch (err) {
    console.log("Error in listMyFavorites:", err);
    res.status(500).json({ message: "获取我的收藏失败" });
  }
};

// 添加收藏
export const addFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { movieId } = req.body;

    if (!movieId) {
      return res.status(400).json({ message: "缺少 movieId" });
    }

    const existing = await Favorite.findOne({ user: userId, movie: movieId });
    if (existing) {
      return res.status(200).json({ message: "已在收藏中", _id: existing._id });
    }

    const fav = await Favorite.create({ user: userId, movie: movieId });
    const populated = await fav.populate("movie", "title poster genres releaseDate");
    const m = populated.movie;
    const year = m?.releaseDate ? new Date(m.releaseDate).getFullYear() : "";
    const genres = Array.isArray(m?.genres) ? m.genres.join(" / ") : "";

    res.status(201).json({
      _id: populated._id,
      movieId: m?._id,
      movieName: m?.title ?? "未知影片",
      poster: m?.poster ?? "",
      info: [year, genres].filter(Boolean).join(" · ") || "—",
    });
  } catch (err) {
    console.log("Error in addFavorite:", err);
    res.status(500).json({ message: "添加收藏失败" });
  }
};

// 取消收藏
export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { movieId } = req.params;

    if (!movieId) {
      return res.status(400).json({ message: "缺少 movieId" });
    }

    await Favorite.findOneAndDelete({ user: userId, movie: movieId });
    res.status(200).json({ message: "已取消收藏" });
  } catch (err) {
    console.log("Error in removeFavorite:", err);
    res.status(500).json({ message: "取消收藏失败" });
  }
};
