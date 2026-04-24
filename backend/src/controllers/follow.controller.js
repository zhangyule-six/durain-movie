import Follow from "../models/follow.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    if (followerId.toString() === userId) {
      return res.status(400).json({ message: "不能关注自己" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const existing = await Follow.findOne({ follower: followerId, following: userId });
    if (existing) {
      return res.status(409).json({ message: "已关注该用户" });
    }

    await Follow.create({ follower: followerId, following: userId });

    await Promise.all([
      User.findByIdAndUpdate(followerId, { $inc: { "stats.following": 1 } }),
      User.findByIdAndUpdate(userId, { $inc: { "stats.followers": 1 } }),
    ]);

    await Notification.create({
      receiver: userId,
      sender: followerId,
      type: "follow",
      refId: followerId,
      refType: "user",
    });

    res.status(201).json({ message: "关注成功" });
  } catch (err) {
    console.error("Error in followUser:", err);
    res.status(500).json({ message: "关注失败" });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    const follow = await Follow.findOneAndDelete({ follower: followerId, following: userId });
    if (!follow) {
      return res.status(404).json({ message: "未关注该用户" });
    }

    await Promise.all([
      User.findByIdAndUpdate(followerId, { $inc: { "stats.following": -1 } }),
      User.findByIdAndUpdate(userId, { $inc: { "stats.followers": -1 } }),
    ]);

    res.status(200).json({ message: "已取消关注" });
  } catch (err) {
    console.error("Error in unfollowUser:", err);
    res.status(500).json({ message: "取消关注失败" });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Follow.find({ following: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("follower", "username avatar bio"),
      Follow.countDocuments({ following: userId }),
    ]);

    res.json({
      items: items.map((f) => f.follower),
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error("Error in getFollowers:", err);
    res.status(500).json({ message: "获取粉丝列表失败" });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Follow.find({ follower: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("following", "username avatar bio"),
      Follow.countDocuments({ follower: userId }),
    ]);

    res.json({
      items: items.map((f) => f.following),
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error("Error in getFollowing:", err);
    res.status(500).json({ message: "获取关注列表失败" });
  }
};

export const checkFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    const existing = await Follow.findOne({ follower: followerId, following: userId });
    res.json({ isFollowing: !!existing });
  } catch (err) {
    console.error("Error in checkFollowing:", err);
    res.status(500).json({ message: "查询关注状态失败" });
  }
};
