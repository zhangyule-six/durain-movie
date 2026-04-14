import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Group from "../models/group.model.js";
import GroupMessage from "../models/groupMessage.model.js";

let ioInstance = null;
const userSocketCount = new Map();

function parseCookie(cookies = "") {
  return cookies.split(";").reduce((acc, item) => {
    const [key, ...rest] = item.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("=") || "");
    return acc;
  }, {});
}

function normalizeToken(raw) {
  if (!raw || typeof raw !== "string") return null;
  return raw.replace(/^Bearer\s+/i, "").trim();
}

async function resolveUserFromSocket(socket) {
  const authToken = normalizeToken(socket.handshake.auth?.token);
  const bearer = normalizeToken(socket.handshake.headers?.authorization);
  const cookieJwt = parseCookie(socket.handshake.headers?.cookie || "").jwt;
  const token = authToken || bearer || cookieJwt;
  if (!token) return null;

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!decoded?.id) return null;
  return User.findById(decoded.id).select("_id username avatar");
}

function toGroupRoom(groupId) {
  return `group:${groupId}`;
}

function updateOnlineCounter(userId, delta) {
  const current = userSocketCount.get(userId) || 0;
  const next = Math.max(0, current + delta);
  if (next === 0) {
    userSocketCount.delete(userId);
    return 0;
  }
  userSocketCount.set(userId, next);
  return next;
}

async function emitGroupOnlineCount(groupId) {
  if (!ioInstance) return;
  const group = await Group.findById(groupId).select("members");
  if (!group) return;
  const online = group.members.reduce((count, uid) => {
    return count + (userSocketCount.has(uid.toString()) ? 1 : 0);
  }, 0);

  ioInstance.to(toGroupRoom(groupId)).emit("group:presence", {
    groupId: String(groupId),
    onlineCount: online,
  });
}

export function initSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? ["http://localhost:8080", "http://localhost"]
          : "http://localhost:5173",
      credentials: true,
    },
  });

  ioInstance.use(async (socket, next) => {
    try {
      const user = await resolveUserFromSocket(socket);
      if (!user) return next(new Error("Unauthorized"));
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    updateOnlineCounter(userId, 1);

    socket.on("group:join", async ({ groupId }) => {
      if (!groupId) return;
      const group = await Group.findOne({
        _id: groupId,
        members: socket.user._id,
      }).select("_id");
      if (!group) {
        socket.emit("group:error", { message: "你还不是该小组成员" });
        return;
      }
      await socket.join(toGroupRoom(groupId));
      await emitGroupOnlineCount(groupId);
    });

    socket.on("group:leave", async ({ groupId }) => {
      if (!groupId) return;
      await socket.leave(toGroupRoom(groupId));
      await emitGroupOnlineCount(groupId);
    });

    socket.on("message:send", async ({ groupId, content }) => {
      try {
        const trimmed = typeof content === "string" ? content.trim() : "";
        if (!groupId || !trimmed) return;
        if (trimmed.length > 1000) {
          socket.emit("group:error", { message: "消息长度不能超过1000" });
          return;
        }

        const group = await Group.findOne({
          _id: groupId,
          members: socket.user._id,
        }).select("_id");
        if (!group) {
          socket.emit("group:error", { message: "你还不是该小组成员" });
          return;
        }

        const message = await GroupMessage.create({
          group: groupId,
          sender: socket.user._id,
          content: trimmed,
          messageType: "text",
          readBy: [socket.user._id],
        });
        const populated = await message.populate("sender", "username avatar");
        ioInstance.to(toGroupRoom(groupId)).emit("message:new", populated);
      } catch (error) {
        socket.emit("group:error", { message: "发送消息失败" });
      }
    });

    socket.on("disconnect", async () => {
      updateOnlineCounter(userId, -1);
    });
  });

  return ioInstance;
}

export function getIO() {
  return ioInstance;
}

export async function emitMessageToGroup(groupId, messageDoc) {
  if (!ioInstance) return;
  ioInstance.to(toGroupRoom(groupId)).emit("message:new", messageDoc);
}
