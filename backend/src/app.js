import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";

import authRoutes from "./routes/auth.route.js";

import path from "path";
const app = express();
const server = http.createServer(app);

dotenv.config();
const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(express.json()); //使得可用json
app.use(cookieParser()); //解析cookie

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html")); //在生产环境下，所有未匹配的路由都返回index.html
  });
} //express.static中间件来托管dist下html，js，css等静态资源文件

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

server.listen(PORT, () => {
  console.log("server is running on port " + PORT);
  connectDB();
});
