import express from "express";
import {
  login,
  logout,
  signup,
  updateProfile,
  checkAuth,
  listMyReviews,
  listMyFavorites,
  addFavorite,
  removeFavorite,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update", protectRoute, updateProfile);
router.get("/check", protectRoute, checkAuth);

// 我的评价、我的收藏（需登录）
router.get("/reviews", protectRoute, listMyReviews);
router.get("/favorites", protectRoute, listMyFavorites);
router.post("/favorites", protectRoute, addFavorite);
router.delete("/favorites/:movieId", protectRoute, removeFavorite);

export default router;
