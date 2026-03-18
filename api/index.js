import app from "../backend/src/app.js";
import { connectDB } from "../backend/src/lib/db.js";

export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    console.error("Vercel function init error:", err);
    return res.status(500).json({
      message: err?.message || "Serverless function init failed",
    });
  }
}

