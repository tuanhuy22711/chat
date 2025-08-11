import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { createNotification } from "./notification.controller.js";
import { cache, CACHE_KEYS, CACHE_TTL } from "../lib/redis.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    
    // Try to get from cache first
    const cacheKey = CACHE_KEYS.USERS_SIDEBAR(loggedInUserId);
    const cachedUsers = await cache.get(cacheKey);
    
    if (cachedUsers) {
      console.log(`✅ Cache HIT: Users sidebar for ${loggedInUserId}`);
      return res.status(200).json(cachedUsers);
    }

    console.log(`❌ Cache MISS: Users sidebar for ${loggedInUserId}`);
    
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    // Cache for 5 minutes
    await cache.set(cacheKey, filteredUsers, CACHE_TTL.MEDIUM);

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Generate cache key for messages between these two users
    const cacheKey = CACHE_KEYS.MESSAGES(myId, userToChatId);
    const cachedMessages = await cache.get(cacheKey);
    
    if (cachedMessages) {
      console.log(`✅ Cache HIT: Messages between ${myId} and ${userToChatId}`);
      return res.status(200).json(cachedMessages);
    }

    console.log(`❌ Cache MISS: Messages between ${myId} and ${userToChatId}`);

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).populate("senderId", "fullName profilePic");

    // Cache messages for 2 minutes (short TTL since messages change frequently)
    await cache.set(cacheKey, messages, CACHE_TTL.SHORT * 2);

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      messageType: "private",
    });

    await newMessage.save();

    // Populate sender info for consistent data structure
    const populatedMessage = await Message.findById(newMessage._id).populate("senderId", "fullName profilePic");

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", populatedMessage);
    }

    // Create notification for new message
    await createNotification({
      recipient: receiverId,
      sender: senderId,
      type: "message",
      title: "New Message",
      message: `${req.user.fullName} sent you a message`,
      data: {
        messageId: newMessage._id,
        userId: senderId,
        conversationType: "direct",
      },
    });

    // Invalidate messages cache for both users
    const messagesCacheKey = CACHE_KEYS.MESSAGES(senderId, receiverId);
    await cache.del(messagesCacheKey);
    
    // Invalidate notifications cache for receiver
    await cache.del(CACHE_KEYS.NOTIFICATIONS(receiverId));

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark private messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const userId = req.user._id;

    // Update messages from other user as read
    const result = await Message.updateMany(
      {
        senderId: otherUserId,
        receiverId: userId,
        messageType: "private",
        status: { $ne: "read" }
      },
      {
        status: "read"
      }
    );

    // If messages were updated, notify the sender via socket
    if (result.modifiedCount > 0) {
      const senderSocketId = getReceiverSocketId(otherUserId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesMarkedAsRead", {
          conversationWith: userId,
          readBy: userId
        });
      }
    }

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.log("Error in markMessagesAsRead controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
