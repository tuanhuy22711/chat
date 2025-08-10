import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { createNotification } from "./notification.controller.js";

// Get all groups for current user
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({
      "members.user": userId,
    })
      .populate("members.user", "fullName email profilePic")
      .populate("creator", "fullName email profilePic")
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getUserGroups: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, memberIds, isPrivate } = req.body;
    const creatorId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Group name is required" });
    }

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ error: "At least one member is required" });
    }

    // Check if all member IDs are valid users
    const validUsers = await User.find({ _id: { $in: memberIds } });
    if (validUsers.length !== memberIds.length) {
      return res.status(400).json({ error: "One or more invalid user IDs" });
    }

    // Create members array with creator as admin
    const members = [
      {
        user: creatorId,
        role: "admin",
      },
      ...memberIds
        .filter((id) => id.toString() !== creatorId.toString())
        .map((id) => ({
          user: id,
          role: "member",
        })),
    ];

    const newGroup = new Group({
      name: name.trim(),
      description: description?.trim() || "",
      creator: creatorId,
      members,
      isPrivate: isPrivate || false,
    });

    await newGroup.save();

    // Populate the group before sending response
    const populatedGroup = await Group.findById(newGroup._id)
      .populate("members.user", "fullName email profilePic")
      .populate("creator", "fullName email profilePic");

    // Notify all group members via socket
    members.forEach((member) => {
      const socketId = getReceiverSocketId(member.user.toString());
      if (socketId) {
        io.to(socketId).emit("newGroup", populatedGroup);
      }
    });

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Error in createGroup: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get group messages
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isMember = group.members.some(
      (member) => member.user.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    const messages = await Message.find({
      groupId: groupId,
      messageType: "group",
    })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send message to group
export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isMember = group.members.some(
      (member) => member.user.toString() === senderId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      groupId,
      text,
      image: imageUrl,
      messageType: "group",
    });

    await newMessage.save();

    // Populate sender info
    const populatedMessage = await Message.findById(newMessage._id).populate(
      "senderId",
      "fullName profilePic"
    );

    // Send to all group members via socket and create notifications
    const notificationPromises = [];
    
    group.members.forEach((member) => {
      const memberId = member.user.toString();
      
      // Skip sender
      if (memberId !== senderId.toString()) {
        const socketId = getReceiverSocketId(memberId);
        if (socketId) {
          io.to(socketId).emit("newGroupMessage", populatedMessage);
        }
        
        // Create notification for each member (except sender)
        notificationPromises.push(
          createNotification({
            recipient: memberId,
            sender: senderId,
            type: "message",
            title: "New Group Message",
            message: `${populatedMessage.senderId.fullName} sent a message in ${group.name}`,
            data: {
              groupId: groupId,
              messageId: newMessage._id,
              conversationType: "group"
            },
          })
        );
      }
    });
    
    // Execute all notifications
    await Promise.all(notificationPromises);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add member to group
export const addGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const requesterId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if requester is admin
    const requesterMember = group.members.find(
      (member) => member.user.toString() === requesterId.toString()
    );

    if (!requesterMember || requesterMember.role !== "admin") {
      return res.status(403).json({ error: "Only admins can add members" });
    }

    // Check if user already exists in group
    const existingMember = group.members.find(
      (member) => member.user.toString() === userId
    );

    if (existingMember) {
      return res.status(400).json({ error: "User is already a member" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Add member
    group.members.push({
      user: userId,
      role: "member",
    });

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members.user", "fullName email profilePic")
      .populate("creator", "fullName email profilePic");

    // Notify all group members
    group.members.forEach((member) => {
      const socketId = getReceiverSocketId(member.user.toString());
      if (socketId) {
        io.to(socketId).emit("groupUpdated", updatedGroup);
      }
    });

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in addGroupMember: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Leave group
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Remove user from members
    group.members = group.members.filter(
      (member) => member.user.toString() !== userId.toString()
    );

    // If creator leaves, make another admin or delete group if no members left
    if (group.creator.toString() === userId.toString()) {
      if (group.members.length === 0) {
        await Group.findByIdAndDelete(groupId);
        return res.status(200).json({ message: "Group deleted" });
      } else {
        // Make first member the new creator and admin
        group.creator = group.members[0].user;
        group.members[0].role = "admin";
      }
    }

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members.user", "fullName email profilePic")
      .populate("creator", "fullName email profilePic");

    // Notify remaining members
    group.members.forEach((member) => {
      const socketId = getReceiverSocketId(member.user.toString());
      if (socketId) {
        io.to(socketId).emit("groupUpdated", updatedGroup);
      }
    });

    res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    console.error("Error in leaveGroup: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark group messages as read
export const markGroupMessagesAsRead = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isMember = group.members.some(
      (member) => member.user.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // Update messages that user hasn't read yet
    const result = await Message.updateMany(
      {
        groupId: groupId,
        messageType: "group",
        senderId: { $ne: userId }, // Don't mark own messages as read
        "readBy.user": { $ne: userId } // Haven't been read by this user
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );

    // If messages were updated, emit socket event to notify other group members
    if (result.modifiedCount > 0) {
      // Get user info
      const user = await User.findById(userId).select("fullName profilePic");
      
      // Notify all group members about read status update
      group.members.forEach((member) => {
        const socketId = getReceiverSocketId(member.user.toString());
        if (socketId && member.user.toString() !== userId.toString()) {
          io.to(socketId).emit("messagesMarkedAsRead", {
            groupId: groupId,
            userId: userId,
            user: user,
            readAt: new Date()
          });
        }
      });
    }

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error in markGroupMessagesAsRead: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
