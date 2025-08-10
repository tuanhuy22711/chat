import { useEffect } from "react";
import { useNotificationStore } from "../store/useNotificationStore";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Check, CheckCheck, X, MessageCircle, FileText, Heart, MessageSquare, UserPlus } from "lucide-react";
import Avatar from "../components/Avatar";
import { formatRelativeTime } from "../lib/utils";

const NotificationsPage = () => {
  const navigate = useNavigate();
  
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    currentPage,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    getNotifications(1);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "message":
        return <MessageCircle size={20} className="text-blue-500" />;
      case "post":
        return <FileText size={20} className="text-green-500" />;
      case "reaction":
        return <Heart size={20} className="text-red-500" />;
      case "comment":
        return <MessageSquare size={20} className="text-purple-500" />;
      case "follow":
        return <UserPlus size={20} className="text-orange-500" />;
      default:
        return <Bell size={20} className="text-gray-500" />;
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case "message":
        if (notification.data.userId) {
          navigate(`/profile/${notification.data.userId}`);
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
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      getNotifications(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 shadow-sm sticky top-16 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="btn btn-ghost btn-circle"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-base-content">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-base-content/70">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="btn btn-primary btn-sm"
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-base-100 rounded-lg shadow-sm">
          {isLoading && notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          ) : notifications.length > 0 ? (
            <div>
              {notifications.map((notification, index) => (
                <div
                  key={notification._id}
                  className={`border-b border-base-200 last:border-b-0 hover:bg-base-200 transition-colors ${
                    !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                >
                  <div className="p-4 flex items-start gap-4 group">
                    {/* Sender Avatar */}
                    <Avatar
                      src={notification.sender?.profilePic}
                      name={notification.sender?.fullName}
                      size="size-12"
                    />

                    {/* Content */}
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {getNotificationIcon(notification.type)}
                        <span className="font-semibold text-base-content">
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      
                      <p className="text-base-content/80 mb-2">
                        {notification.message}
                      </p>
                      
                      <p className="text-sm text-base-content/60">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          className="btn btn-ghost btn-sm"
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        className="btn btn-ghost btn-sm text-error hover:bg-error/10"
                        title="Delete notification"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Load More */}
              {hasMore && (
                <div className="p-4 text-center border-t border-base-200">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="btn btn-outline btn-sm"
                  >
                    {isLoading ? (
                      <>
                        <div className="loading loading-spinner loading-sm"></div>
                        Loading...
                      </>
                    ) : (
                      "Load more"
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Bell size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-base-content mb-2">
                No notifications yet
              </h3>
              <p className="text-base-content/60">
                When you receive messages or posts, they'll appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
