import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getUserGroups,
  createGroup,
  getGroupMessages,
  sendGroupMessage,
  addGroupMember,
  leaveGroup,
  markGroupMessagesAsRead,
} from "../controllers/group.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUserGroups);
router.post("/create", protectRoute, createGroup);
router.get("/:groupId/messages", protectRoute, getGroupMessages);
router.post("/:groupId/messages", protectRoute, sendGroupMessage);
router.post("/:groupId/members", protectRoute, addGroupMember);
router.delete("/:groupId/leave", protectRoute, leaveGroup);
router.post("/:groupId/read", protectRoute, markGroupMessagesAsRead);

export default router;
