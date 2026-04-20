import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  chatStream,
  getConversations,
  getConversation,
  deleteConversation,
} from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/chat", protectRoute, rateLimit(10), chatStream);
router.get("/conversations", protectRoute, getConversations);
router.get("/conversations/:id", protectRoute, getConversation);
router.delete("/conversations/:id", protectRoute, deleteConversation);

export default router;
