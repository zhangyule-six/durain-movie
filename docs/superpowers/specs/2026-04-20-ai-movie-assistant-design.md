# AI 对话式影视推荐助手 — 设计规格

## 概述

在 durain-movie 项目中构建一个 AI 对话式影视推荐助手，采用 Agent + Function Calling 架构，基于 DeepSeek + 多源工具调用（WMDB/猫眼/本地库），以悬浮聊天窗口形式为用户提供智能影片推荐。

## 功能定义

用户在页面右下角点击悬浮气泡，展开 AI 聊天窗口，用自然语言描述想看的电影（如"推荐一部适合下雨天看的治愈电影"），AI Agent 通过 Function Calling 自主调用多个搜索工具（WMDB、猫眼、本地库），检索匹配影片，结合 DeepSeek 大模型生成个性化推荐和理由，以流式打字机效果呈现，推荐中嵌入可点击的影片卡片。

## 核心架构决策

### 为什么选择 Agent + Function Calling 而非纯 RAG

当前本地 MongoDB 影片数据较少（仅用户浏览过的影片通过 ensure 入库），纯向量搜索覆盖面不足。Agent 架构让 LLM 主动调用 WMDB/猫眼等外部搜索 API，不受本地数据量限制。

### 技术选型

- **LLM**: DeepSeek（OpenAI 兼容格式 API），通过抽象层支持切换
- **Agent 模式**: Function Calling（Tool Use）
- **数据源**: WMDB API + 猫眼 API（复用已有爬虫模块）+ 本地 MongoDB
- **流式传输**: SSE (Server-Sent Events)
- **前端组件**: Vue 3 Composition API + Naive UI + Tailwind

## 模块设计

### 1. AI Tool 定义

每个 Tool 导出 `definition`（OpenAI JSON Schema）和 `execute(params)` 函数，复用已有爬虫模块。

| Tool | 功能 | 复用模块 |
|------|------|----------|
| `search-wmdb` | 按关键词搜索影片（简介、评分、演员） | `crawler/sources/wmdb.js` |
| `search-maoyan` | 猫眼关键词搜索 | `crawler/sources/maoyan.js` |
| `get-top-rated` | 高分榜单 | `crawler/sources/maoyan.js` |
| `get-now-showing` | 正在热映 | `crawler/sources/maoyan.js` |
| `get-coming-soon` | 即将上映 | `crawler/sources/maoyan.js` |
| `ensure-movie` | 推荐影片写入本地库 | `movie.controller.js` |

### 2. Agent 服务层

ReAct 循环：LLM 思考 → 决定调用工具 → 获取结果 → 反馈给 LLM → 继续思考或输出。单轮工具调用循环上限 5 次。

文件结构：
- `backend/src/ai/llm.service.js` — 封装 openai SDK
- `backend/src/ai/agent.service.js` — Agent 核心循环
- `backend/src/ai/prompt-templates.js` — System Prompt 模板
- `backend/src/ai/tools/` — Tool 定义目录

### 3. API 设计

- `POST /api/ai/chat` — SSE 流式对话
- `GET /api/ai/conversations` — 对话列表
- `GET /api/ai/conversations/:id` — 对话历史
- `DELETE /api/ai/conversations/:id` — 删除对话

SSE 事件类型：`token` / `tool_call` / `movie_ref` / `done` / `error`

### 4. 对话管理

Conversation Schema：`userId`, `title`, `messages[]`（含 role, content, movieRefs, createdAt）。上下文窗口最近 10 轮（20 条消息）。标题在首次回复后自动生成。

### 5. 前端聊天组件

悬浮气泡 + 聊天窗口（~400x600px），支持：
- 流式打字机效果
- 影片推荐卡片（海报+标题+评分，可跳转详情）
- 工具调用状态提示
- 历史对话管理
- 停止生成
- Enter 发送 / Shift+Enter 换行

### 6. 错误处理与安全

- 频率限制：每用户每分钟 10 次
- 输入长度限制：500 字
- API Key 仅存后端 `.env`
- 30s 超时保护
- 工具调用失败时 Agent 降级到可用数据源

## 环境变量

```
DEEPSEEK_API_KEY=sk-xxx
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

## 依赖

- 后端：`openai`（兼容格式调用 DeepSeek）
- 前端：`marked`（Markdown 渲染 AI 回复）

## 渐进增强（第二阶段）

当本地影片库积累到一定规模后，追加 Embedding + Atlas Vector Search 作为 Agent 的额外搜索 Tool。
