import express from "express";
import {
  protectRoute,
  adminOnly,
} from "../middleware/auth.middleware.js";
import {
  getStats,
  getUsers,
  updateUserRole,
  getMovies,
  updateMovie,
  deleteMovie,
  getReviews,
  deleteReview,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(protectRoute, adminOnly);

router.get("/stats", getStats);

router.get("/users", getUsers);
router.put("/users/:id", updateUserRole);

router.get("/movies", getMovies);
router.put("/movies/:id", updateMovie);
router.delete("/movies/:id", deleteMovie);

router.get("/reviews", getReviews);
router.delete("/reviews/:id", deleteReview);

export default router;
