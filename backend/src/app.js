import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import authRoutes from "./routes/user.route.js";
import movieRoutes from "./routes/movie.route.js";
import reviewRoutes from "./routes/review.route.js";
import commentRoutes from "./routes/comment.route.js";
import notificationRoutes from "./routes/notification.route.js";

dotenv.config();

const app = express();
const __dirname = path.resolve();

// 数据库连接在入口（本地 server / Vercel 函数）中建立，避免导入时副作用导致函数崩溃

app.use(express.json()); //使得可用json
app.use(cookieParser()); //解析cookie

// 静态资源托管仅用于传统“单体”部署场景。
// 在 Vercel 上前端由独立构建托管，且 Serverless Functions 不包含 frontend/dist，
// 如果在这里用 app.get('*') 兜底会错误吞掉 /api/* 并导致 sendFile 失败引发函数崩溃。
const isVercel = !!process.env.VERCEL;
if (process.env.NODE_ENV === "production" && !isVercel) {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  // 只兜底非 /api 路径，避免覆盖 API 路由
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self';",
  );
  next();
});

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["http://localhost:8080", "http://localhost"]
        : "http://localhost:5173",
    credentials: true,
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/movie", movieRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);

export default app;
