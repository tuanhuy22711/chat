import { useState, useEffect, useRef } from "react";
import { useNotificationStore } from "../store/useNotificationStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useNavigate } from "react-router-dom";
import { Bell, X, Check, CheckCheck, MessageCircle, FileText, Heart, MessageSquare, UserPlus } from "lucide-react";
import Avatar from "./Avatar";
import { formatRelativeTime } from "../lib/utils";
import toast from "react-hot-toast";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  const {
    notifications,
    unreadCount,
    isLoading,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    subscribeToNotifications,
    unsubscribeFromNotifications,
  } = useNotificationStore();
  
  const { setSelectedUser } = useChatStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    if (authUser) {
      getNotifications();
      getUnreadCount();
      subscribeToNotifications();
    }

    return () => {
      unsubscribeFromNotifications();
    };
  }, [authUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "message":
        return <MessageCircle size={16} className="text-blue-500" />;
      case "post":
        return <FileText size={16} className="text-green-500" />;
      case "reaction":
        return <Heart size={16} className="text-red-500" />;
      case "comment":
        return <MessageSquare size={16} className="text-purple-500" />;
      case "follow":
        return <UserPlus size={16} className="text-orange-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case "message":
        // For direct messages, use sender info from notification
        if (notification.data.userId && notification.sender) {
          // Navigate to chat and set selected user using sender info
          navigate("/");
          setSelectedUser({
            _id: notification.sender._id,
            fullName: notification.sender.fullName,
            profilePic: notification.sender.profilePic
          });
        } else if (notification.data.conversationType === "group") {
          // For group messages, just navigate to chat page for now
          navigate("/");
          toast.info("Group chat feature is being developed");
        }
        break;
      case "post":
        if (notification.data.postId) {
          navigate("/newsfeed");
        }
        break;
      default:
        break;
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-circle relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-base-100 rounded-lg shadow-lg border border-base-300 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-base-300 flex items-center justify-between">
            <h3 className="font-semibold text-base-content">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="btn btn-ghost btn-xs"
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-xs"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="loading loading-spinner loading-sm"></div>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 border-b border-base-200 hover:bg-base-200 cursor-pointer transition-colors ${
                    !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Sender Avatar */}
                    <Avatar
                      src={notification.sender?.profilePic}
                      name={notification.sender?.fullName}
                      size="size-8"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getNotificationIcon(notification.type)}
                        <span className="font-medium text-sm text-base-content truncate">
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      
                      <p className="text-xs text-base-content/70 mb-1">
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-base-content/50">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDeleteNotification(notification._id, e)}
                      className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete notification"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-base-content/60">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-base-300 text-center">
              <button
                onClick={() => {
                  navigate("/notifications");
                  setIsOpen(false);
                }}
                className="text-sm text-primary hover:underline"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
