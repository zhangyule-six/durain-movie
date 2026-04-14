import mongoose from "mongoose";
import Group from "../models/group.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import { emitMessageToGroup } from "../socket/index.js";

function toObjectId(id) {
  return new mongoose.Types.ObjectId(id);
}

export const listGroups = async (req, res) => {
  try {
    const keyword = String(req.query.q || "").trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const query = keyword
      ? {
          $or: [
            { name: { $regex: keyword, $options: "i" } },
            { description: { $regex: keyword, $options: "i" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      Group.find(query)
        .sort({ memberCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("owner", "username avatar"),
      Group.countDocuments(query),
    ]);

    const myId = req.user?._id?.toString();
    const mapped = items.map((item) => ({
      ...item.toObject(),
      joined: myId ? item.members.some((uid) => uid.toString() === myId) : false,
    }));

    res.json({ items: mapped, pagination: { page, limit, total } });
  } catch (error) {
    console.error("Error in listGroups:", error);
    res.status(500).json({ message: "获取小组列表失败" });
  }
};

export const listMyGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const items = await Group.find({ members: userId })
      .sort({ createdAt: -1 })
      .populate("owner", "username avatar")
      .select("_id name description owner memberCount maxMembers tags createdAt");

    res.json({ items });
  } catch (error) {
    console.error("Error in listMyGroups:", error);
    res.status(500).json({ message: "获取我的小组失败" });
  }
};

export const createGroup = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const description = String(req.body?.description || "").trim();
    const tags = Array.isArray(req.body?.tags)
      ? req.body.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 8)
      : [];
    if (!name || name.length < 2 || name.length > 40) {
      return res.status(400).json({ message: "小组名称长度需在2-40之间" });
    }

    const exists = await Group.findOne({ name }).select("_id");
    if (exists) {
      return res.status(409).json({ message: "小组名称已存在" });
    }

    const group = await Group.create({
      name,
      description,
      owner: req.user._id,
      members: [req.user._id],
      memberCount: 1,
      maxMembers: 99,
      tags,
      isPublic: true,
    });

    const populated = await group.populate("owner", "username avatar");
    res.status(201).json(populated);
  } catch (error) {
    console.error("Error in createGroup:", error);
    res.status(500).json({ message: "创建小组失败" });
  }
};

export const getGroupDetail = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId)
      .populate("owner", "username avatar")
      .populate("members", "username avatar");
    if (!group) return res.status(404).json({ message: "小组不存在" });

    const myId = req.user?._id?.toString();
    const joined = myId ? group.members.some((m) => m._id.toString() === myId) : false;
    res.json({
      ...group.toObject(),
      joined,
      membersPreview: group.members.slice(0, 20),
    });
  } catch (error) {
    console.error("Error in getGroupDetail:", error);
    res.status(500).json({ message: "获取小组详情失败" });
  }
};

export const joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const updated = await Group.findOneAndUpdate(
      {
        _id: groupId,
        members: { $ne: userId },
        memberCount: { $lt: 99 },
      },
      {
        $addToSet: { members: userId },
        $inc: { memberCount: 1 },
      },
      { new: true },
    ).populate("owner", "username avatar");

    if (!updated) {
      const group = await Group.findById(groupId).select("memberCount members");
      if (!group) return res.status(404).json({ message: "小组不存在" });
      if (group.members.some((id) => id.toString() === userId.toString())) {
        return res.json({ ...group.toObject(), joined: true });
      }
      if (group.memberCount >= 99) {
        return res.status(409).json({ message: "小组人数已满（99人）" });
      }
      return res.status(400).json({ message: "加入小组失败" });
    }

    res.json({ ...updated.toObject(), joined: true });
  } catch (error) {
    console.error("Error in joinGroup:", error);
    res.status(500).json({ message: "加入小组失败" });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId).select("owner members memberCount");
    if (!group) return res.status(404).json({ message: "小组不存在" });
    if (group.owner.toString() === userId.toString()) {
      return res.status(400).json({ message: "群主暂不支持退群" });
    }
    if (!group.members.some((id) => id.toString() === userId.toString())) {
      return res.status(400).json({ message: "你不在该小组中" });
    }

    await Group.updateOne(
      { _id: groupId },
      { $pull: { members: userId }, $inc: { memberCount: -1 } },
    );
    res.json({ message: "已退出小组" });
  } catch (error) {
    console.error("Error in leaveGroup:", error);
    res.status(500).json({ message: "退出小组失败" });
  }
};

export const listGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const isMember = await Group.exists({ _id: groupId, members: userId });
    if (!isMember) return res.status(403).json({ message: "仅成员可查看群消息" });

    const [items, total] = await Promise.all([
      GroupMessage.find({ group: groupId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "username avatar"),
      GroupMessage.countDocuments({ group: groupId }),
    ]);

    res.json({
      items: items.reverse(),
      pagination: { page, limit, total },
    });
  } catch (error) {
    console.error("Error in listGroupMessages:", error);
    res.status(500).json({ message: "获取群消息失败" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const content = String(req.body?.content || "").trim();
    if (!content) return res.status(400).json({ message: "消息内容不能为空" });
    if (content.length > 1000) {
      return res.status(400).json({ message: "消息长度不能超过1000" });
    }

    const isMember = await Group.exists({ _id: groupId, members: userId });
    if (!isMember) return res.status(403).json({ message: "仅成员可发送群消息" });

    const created = await GroupMessage.create({
      group: toObjectId(groupId),
      sender: userId,
      content,
      messageType: "text",
      readBy: [userId],
    });
    const populated = await created.populate("sender", "username avatar");
    await emitMessageToGroup(groupId, populated);
    res.status(201).json(populated);
  } catch (error) {
    console.error("Error in sendGroupMessage:", error);
    res.status(500).json({ message: "发送群消息失败" });
  }
};
