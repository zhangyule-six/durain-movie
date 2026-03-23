# Durian-Movie（个人影视与影评分享系统）

一个基于 **Vue 3 + Vite** 的前端项目，配套 **Node.js（Express）+ MongoDB** 后端，支持影视浏览、影评/评论、收藏、通知等功能。

本 README 面向「在 GitHub 拉取代码后如何本地运行」的场景编写。

## 技术栈

- **前端**：Vue 3、Vite、TypeScript、Pinia、Naive UI、Tailwind CSS
- **后端**：Node.js、Express、Mongoose、JWT、Cloudinary（图片上传）
- **数据库**：MongoDB

## 目录结构

- `frontend/`：前端工程（Vite）
- `backend/`：后端工程（Express）
- `vercel.json`：Vercel 部署/重写配置（生产环境同域 `/api`）

## 环境要求

- **Node.js**：建议 >= 20（`frontend/package.json` 的 engines：`^20.19.0 || >=22.12.0`）
- **pnpm**：建议 10.x（仓库内已声明 `packageManager`）
- **MongoDB**：本地/云端均可（需要连接串）

> Windows 用户建议使用 PowerShell / Windows Terminal。

## 本地运行（开发环境）

开发环境下，前端会将 API 请求打到 `http://localhost:5001`（见 `frontend/src/api/http.ts`）。

### 1) 启动后端

进入后端目录并安装依赖：

```bash
cd backend
pnpm install
```

在 `backend/` 下创建 `.env`（与 `backend/package.json` 同级），至少包含：

```env
MONGODB_URI=mongodb://127.0.0.1:27017/durian-movie
JWT_SECRET=please_change_me_to_a_long_random_string
PORT=5001
NODE_ENV=development

# 可选：Cloudinary（如涉及图片上传/头像等功能，建议配置）
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

启动后端（热更新）：

```bash
pnpm dev
```

后端默认监听：`http://localhost:5001`

### 2) 启动前端

新开一个终端，进入前端目录并安装依赖：

```bash
cd frontend
pnpm install
```

启动前端：

```bash
pnpm dev
```

Vite 默认地址通常是：`http://localhost:5173`

## 电影数据来源（采集入库）

项目支持把三方 JSON 数据**采集并写入 MongoDB**。当前接口行为如下：

- `/api/movie/wmdb/search`：**只读 MongoDB**，请求时不会触发 WMDB 采集；需要先运行 `pnpm run crawl:movies -- --task wmdb:search ...` 灌库。
- `/api/movie/maoyan/*`：**每次请求直连猫眼上游接口**，保证榜单/搜索的排序语义；**响应不落库**（猫眼数据不通过接口写入 MongoDB）。若仅需库内 WMDB 形态数据，请使用 `wmdb:search` 采集；猫眼 CLI 采集为可选离线脚本。

### 采集命令

先确保 MongoDB 可用，且 `backend/.env` 已配置 `MONGODB_URI`。

```bash
cd backend

# 猫眼高分榜入库（默认 limit=50）
pnpm run crawl:movies -- --task maoyan:topRated --limit 50

# 猫眼在映列表入库
pnpm run crawl:movies -- --task maoyan:onInfoList --limit 50

# 猫眼搜索入库（需要 keyword）
pnpm run crawl:movies -- --task maoyan:search --keyword "周星驰" --ci 1 --limit 50

# WMDB 搜索入库（需要 q，可选 actor/year/lang/skip）
# `--limit` 最大约 5000；大于 100 时脚本会自动按 skip 分页请求 WMDB（上游单次约 100 条）
pnpm run crawl:movies -- --task wmdb:search --q "我" --limit 300
```

## 构建与预览

```bash
cd frontend
pnpm build
pnpm preview
```

## 常见问题（FAQ）

### 1) 前端请求失败 / 跨域

- 确认后端端口为 **5001**
- 后端 CORS 在 `backend/src/app.js` 已允许 `http://localhost:5173`

### 2) 提示 `MONGODB_URI 未配置`

- 确认 `backend/.env` 存在且在 `backend/` 目录下执行命令（dotenv 从当前工作目录加载）

### 3) 采集后接口仍然没数据

- 先跑一次采集命令确认 MongoDB 中 `movies` 集合已有数据
- 再访问接口：
  - WMDB：`/api/movie/wmdb/search?q=...`
  - 猫眼：通常无需灌库即可返回最新榜单（如想离线缓存再跑对应 `maoyan:*` 采集命令）

## 部署提示（Vercel）

生产环境下前端会用同域相对路径请求 `/api/...`（见 `frontend/src/api/http.ts`），配合 `vercel.json` 的重写规则转发到函数端。

