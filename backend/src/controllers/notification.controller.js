import Notification from "../models/notification.model.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

// Get user notifications
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "fullName profilePic")
      .populate("data.messageId")
      .populate("data.postId")
      .populate("data.userId", "fullName profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.status(200).json({
      notifications,
      unreadCount,
      currentPage: page,
      hasMore: notifications.length === limit,
    });
  } catch (error) {
    console.error("Error in getNotifications: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error("Error in markAsRead: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error in markAllAsRead: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error in deleteNotification: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Error in getUnreadCount: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Helper function to create notification
export const createNotification = async (data) => {
  try {
    const { recipient, sender, type, title, message, data: notificationData } = data;

    // Don't send notification to yourself
    if (recipient.toString() === sender.toString()) {
      return;
    }

    const notification = new Notification({
      recipient,
      sender,
      type,
      title,
      message,
      data: notificationData || {},
    });

    await notification.save();

    // Populate the notification before sending
    const populatedNotification = await Notification.findById(notification._id)
      .populate("sender", "fullName profilePic")
      .populate("data.messageId")
      .populate("data.postId")
      .populate("data.userId", "fullName profilePic");

    // Send real-time notification
    const receiverSocketId = getReceiverSocketId(recipient);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newNotification", populatedNotification);
    }

    return populatedNotification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};
