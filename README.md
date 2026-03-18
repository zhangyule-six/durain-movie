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

- **Node.js**：建议 \(>= 20\)（`frontend/package.json` 的 engines：`^20.19.0 || >=22.12.0`）
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
# 必填：MongoDB 连接串
MONGODB_URI=mongodb://127.0.0.1:27017/durian-movie

# 必填：JWT 密钥（随便写一个长点的随机字符串）
JWT_SECRET=please_change_me_to_a_long_random_string

# 可选：服务端口（默认 5001）
PORT=5001

# 可选：环境（开发环境可不写）
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

## 构建与预览

### 前端构建

```bash
cd frontend
pnpm build
pnpm preview
```

### 代码质量

```bash
cd frontend
pnpm lint
pnpm type-check
```

## 常见问题（FAQ）

### 1) 前端请求失败 / 跨域

- 请确认后端已启动且端口为 **5001**
- 前端开发环境会请求 `http://localhost:5001`，后端已对 `http://localhost:5173` 做了 CORS 允许（见 `backend/src/app.js`）

### 2) 提示 `MONGODB_URI 未配置`

- 说明 `backend/.env` 未创建或未被读取
- 确保你是在 `backend/` 目录里执行 `pnpm dev`（dotenv 默认从当前工作目录加载 `.env`）

### 3) Cloudinary 相关报错

- 如果你使用了涉及图片上传的功能，请补齐 `CLOUDINARY_*` 三个变量
- 如果你暂时不需要图片上传功能，可先不配（但触发相关接口时可能会失败）

## 部署提示（Vercel）

生产环境下，前端会使用同域相对路径请求 `/api/...`（见 `frontend/src/api/http.ts`），配合 `vercel.json` 的重写规则将请求转发到 Serverless Function。
