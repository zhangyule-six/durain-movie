import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createReview,
  listMovieReviews,
  getReviewDetail,
  toggleLikeReview,
  listHotReviews,
} from "../controllers/review.controller.js";

const router = express.Router();

router.post("/", protectRoute, createReview);
router.get("/movie/:movieId", listMovieReviews);
router.get("/hot", listHotReviews);
router.get("/:reviewId", getReviewDetail);
router.post("/:reviewId/like", protectRoute, toggleLikeReview);

export default router;

