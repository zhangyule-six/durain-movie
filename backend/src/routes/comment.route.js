import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createComment,
  listReviewComments,
  toggleLikeComment,
} from "../controllers/comment.controller.js";

const router = express.Router();

router.post("/", protectRoute, createComment);
router.get("/review/:reviewId", listReviewComments);
router.post("/:commentId/like", protectRoute, toggleLikeComment);

export default router;

