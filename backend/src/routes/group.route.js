import express from "express";
import { optionalAuth, protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getGroupDetail,
  joinGroup,
  leaveGroup,
  listMyGroups,
  listGroupMessages,
  listGroups,
  sendGroupMessage,
} from "../controllers/group.controller.js";

const router = express.Router();

router.get("/", optionalAuth, listGroups);
router.get("/mine", protectRoute, listMyGroups);
router.post("/", protectRoute, createGroup);
router.get("/:groupId", protectRoute, getGroupDetail);
router.post("/:groupId/join", protectRoute, joinGroup);
router.post("/:groupId/leave", protectRoute, leaveGroup);
router.get("/:groupId/messages", protectRoute, listGroupMessages);
router.post("/:groupId/messages", protectRoute, sendGroupMessage);

export default router;
