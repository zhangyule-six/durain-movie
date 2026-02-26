import express from "express";
import {
  login,
  logout,
  signup,
  updateProfile,
  checkAuth,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

//先检查用户是否登录protectRoute，再更新资料
router.put("/update", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

export default router;
