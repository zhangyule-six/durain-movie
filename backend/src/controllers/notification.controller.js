import Notification from "../models/notification.model.js";
import Comment from "../models/comments.model.js";
import Review from "../models/review.model.js";

// 获取当前用户的通知列表
export const listNotifications = async (req, res) => {
  try {
    const unreadOnly = String(req.query.unreadOnly) === "true";

    const query = { receiver: req.user._id };
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate("sender", "username avatar")
      .lean();

    const result = await Promise.all(
      notifications.map(async (n) => {
        const item = { ...n };
        if (n.refType === "comment" && n.refId) {
          const comment = await Comment.findById(n.refId)
            .select("content parentComment review")
            .populate("parentComment", "content")
            .populate("review", "content")
            .lean();
          item.refContent = comment?.content ?? "";
          if (n.type === "comment" && comment) {
            item.refTargetContent =
              comment.parentComment?.content ?? comment.review?.content ?? "";
          }
        } else if (n.refType === "review" && n.refId) {
          const review = await Review.findById(n.refId).select("content").lean();
          item.refContent = review?.content ?? "";
        }
        return item;
      })
    );

    res.json(result);
  } catch (err) {
    console.error("Error in listNotifications:", err);
    res.status(500).json({ message: "获取通知列表失败" });
  }
};

// 单条通知标记为已读
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, receiver: req.user._id },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ message: "通知不存在" });
    }

    res.json(notification);
  } catch (err) {
    console.error("Error in markNotificationRead:", err);
    res.status(500).json({ message: "标记通知已读失败" });
  }
};

// 单条通知标记为未读
export const markNotificationUnread = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, receiver: req.user._id },
      { isRead: false },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ message: "通知不存在" });
    }

    res.json(notification);
  } catch (err) {
    console.error("Error in markNotificationUnread:", err);
    res.status(500).json({ message: "标记通知未读失败" });
  }
};

// 一键全部标记为已读（可选）
export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ receiver: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    console.error("Error in markAllNotificationsRead:", err);
    res.status(500).json({ message: "批量标记通知已读失败" });
  }
};

