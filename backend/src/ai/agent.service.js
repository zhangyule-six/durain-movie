import { chatStream, chat } from "./llm.service.js";
import { toolDefinitions, executeTool } from "./tools/index.js";
import { SYSTEM_PROMPT, TITLE_PROMPT } from "./prompt-templates.js";

const MAX_TOOL_ROUNDS = 5;
const TOOL_TIMEOUT_MS = 15000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("工具调用超时")), ms),
    ),
  ]);
}

/**
 * 运行 Agent 循环，通过 SSE 回调推送事件。
 * @param {Array} conversationMessages - 历史消息数组
 * @param {string} userMessage - 用户当前消息
 * @param {object} callbacks - { onToken, onToolCall, onMovieRef, onDone, onError }
 */
export async function runAgent(conversationMessages, userMessage, callbacks) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationMessages,
    { role: "user", content: userMessage },
  ];

  let toolRounds = 0;
  let fullContent = "";
  const movieRefs = [];

  while (toolRounds <= MAX_TOOL_ROUNDS) {
    const stream = await chatStream(messages, { tools: toolDefinitions });

    let currentContent = "";
    let toolCalls = [];

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      const finishReason = chunk.choices[0]?.finish_reason;

      if (delta?.content) {
        currentContent += delta.content;
        callbacks.onToken?.(delta.content);
      }

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          if (!toolCalls[idx]) {
            toolCalls[idx] = { id: tc.id || "", name: "", arguments: "" };
          }
          if (tc.id) toolCalls[idx].id = tc.id;
          if (tc.function?.name) toolCalls[idx].name = tc.function.name;
          if (tc.function?.arguments) toolCalls[idx].arguments += tc.function.arguments;
        }
      }

      if (finishReason === "stop") {
        fullContent += currentContent;
        const refs = extractMovieRefs(currentContent);
        for (const ref of refs) {
          if (!movieRefs.find((r) => r.title === ref.title)) {
            movieRefs.push(ref);
            callbacks.onMovieRef?.(ref);
          }
        }
        callbacks.onDone?.({ content: fullContent, movieRefs });
        return { content: fullContent, movieRefs };
      }

      if (finishReason === "tool_calls") {
        break;
      }
    }

    if (!toolCalls.length) {
      fullContent += currentContent;
      callbacks.onDone?.({ content: fullContent, movieRefs });
      return { content: fullContent, movieRefs };
    }

    toolRounds++;

    messages.push({
      role: "assistant",
      content: currentContent || null,
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: "function",
        function: { name: tc.name, arguments: tc.arguments },
      })),
    });

    for (const tc of toolCalls) {
      callbacks.onToolCall?.({
        tool: tc.name,
        status: "calling",
        args: safeParseArgs(tc.arguments),
      });

      let result;
      try {
        result = await withTimeout(executeTool(tc.name, tc.arguments), TOOL_TIMEOUT_MS);
        callbacks.onToolCall?.({
          tool: tc.name,
          status: "done",
          resultCount: Array.isArray(result) ? result.length : 1,
        });
      } catch (err) {
        result = { error: err.message || "工具调用失败" };
        callbacks.onToolCall?.({
          tool: tc.name,
          status: "error",
          error: err.message,
        });
      }

      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });

      if (tc.name === "ensure_movie" && result?.movieId) {
        const ref = { movieId: result.movieId, title: result.title, poster: result.poster };
        if (!movieRefs.find((r) => r.movieId === ref.movieId)) {
          movieRefs.push(ref);
          callbacks.onMovieRef?.(ref);
        }
      }
    }
  }

  callbacks.onDone?.({ content: fullContent, movieRefs });
  return { content: fullContent, movieRefs };
}

export async function generateTitle(messages) {
  const titleMessages = [
    { role: "system", content: TITLE_PROMPT },
    ...messages.slice(0, 4),
  ];
  const reply = await chat(titleMessages);
  return reply?.content?.trim()?.slice(0, 30) || "新对话";
}

function extractMovieRefs(text) {
  const regex = /\[movie:(.+?)\]/g;
  const refs = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    refs.push({ title: match[1].trim() });
  }
  return refs;
}

function safeParseArgs(str) {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}
