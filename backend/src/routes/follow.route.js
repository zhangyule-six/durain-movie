import express from "express";
import { protectRoute, optionalAuth } from "../middleware/auth.middleware.js";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowing,
} from "../controllers/follow.controller.js";

const router = express.Router();

router.post("/:userId/follow", protectRoute, followUser);
router.delete("/:userId/follow", protectRoute, unfollowUser);
router.get("/:userId/followers", optionalAuth, getFollowers);
router.get("/:userId/following", optionalAuth, getFollowing);
router.get("/:userId/is-following", protectRoute, checkFollowing);

export default router;
