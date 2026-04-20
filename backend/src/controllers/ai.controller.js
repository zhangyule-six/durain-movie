import Conversation from "../models/conversation.model.js";
import { runAgent, generateTitle } from "../ai/agent.service.js";

const MAX_CONTEXT_MESSAGES = 20;
const MAX_INPUT_LENGTH = 500;
const REQUEST_TIMEOUT_MS = 60000;

function sendSSE(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function chatStream(req, res) {
  const userId = req.user._id;
  const { message, conversationId } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ message: "缺少消息内容" });
  }

  if (message.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ message: `消息不能超过 ${MAX_INPUT_LENGTH} 字` });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const timeout = setTimeout(() => {
    sendSSE(res, "error", { message: "请求超时，请重试" });
    res.end();
  }, REQUEST_TIMEOUT_MS);

  try {
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, userId });
    }
    if (!conversation) {
      conversation = new Conversation({ userId, messages: [] });
    }

    const historyMessages = conversation.messages
      .slice(-MAX_CONTEXT_MESSAGES)
      .map((m) => ({ role: m.role, content: m.content }));

    conversation.messages.push({ role: "user", content: message, movieRefs: [] });

    const result = await runAgent(historyMessages, message, {
      onToken(content) {
        sendSSE(res, "token", { content });
      },
      onToolCall(data) {
        sendSSE(res, "tool_call", data);
      },
      onMovieRef(ref) {
        sendSSE(res, "movie_ref", ref);
      },
      onDone() {},
      onError(err) {
        sendSSE(res, "error", { message: err.message || "AI 服务异常" });
      },
    });

    conversation.messages.push({
      role: "assistant",
      content: result.content,
      movieRefs: result.movieRefs || [],
    });

    if (conversation.title === "新对话" && conversation.messages.length >= 2) {
      try {
        conversation.title = await generateTitle(
          conversation.messages.slice(0, 4).map((m) => ({ role: m.role, content: m.content })),
        );
      } catch {
        conversation.title = message.slice(0, 20);
      }
    }

    await conversation.save();

    sendSSE(res, "done", {
      conversationId: conversation._id,
      title: conversation.title,
    });
  } catch (err) {
    console.error("AI chat error:", err);
    sendSSE(res, "error", { message: err.message || "AI 服务异常" });
  } finally {
    clearTimeout(timeout);
    res.end();
  }
}

export async function getConversations(req, res) {
  try {
    const conversations = await Conversation.find({ userId: req.user._id })
      .select("title createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
    return res.json(conversations);
  } catch (err) {
    return res.status(500).json({ message: err.message || "获取对话列表失败" });
  }
}

export async function getConversation(req, res) {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!conversation) {
      return res.status(404).json({ message: "对话不存在" });
    }

    return res.json(conversation);
  } catch (err) {
    return res.status(500).json({ message: err.message || "获取对话详情失败" });
  }
}

export async function deleteConversation(req, res) {
  try {
    const result = await Conversation.deleteOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "对话不存在" });
    }

    return res.json({ message: "已删除" });
  } catch (err) {
    return res.status(500).json({ message: err.message || "删除对话失败" });
  }
}
