import { X, Phone, Video } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Avatar from "./Avatar";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers, socket, authUser } = useAuthStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/profile/${selectedUser._id}`);
  };

  const handleVideoCall = () => {
    if (selectedUser && socket && authUser) {
      // Generate unique call ID based on both users
      const callId = [selectedUser._id, authUser._id].sort().join("-");
      const callUrl = `${window.location.origin}/call/${callId}`;

      // Send message with call link
      socket.emit("sendMessage", {
        receiverId: selectedUser._id,
        text: `🎥 I've started a video call. Join me here: ${callUrl}`,
      });
      
      toast.success("Video call link sent successfully!");
    }
  };

  const handleVoiceCall = () => {
    if (selectedUser && socket && authUser) {
      // Generate unique call ID based on both users
      const callId = [selectedUser._id, authUser._id].sort().join("-");
      const callUrl = `${window.location.origin}/call/${callId}`;

      // Send message with call link
      socket.emit("sendMessage", {
        receiverId: selectedUser._id,
        text: `📞 I've started a voice call. Join me here: ${callUrl}`,
      });
      
      toast.success("Voice call link sent successfully!");
    }
  };

  return (
    <div className="p-2 sm:p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-base-200 rounded-lg p-1 sm:p-2 transition-colors flex-1 min-w-0"
          onClick={handleViewProfile}
        >
          {/* Avatar */}
          <Avatar 
            src={selectedUser.profilePic}
            name={selectedUser.fullName}
            size="size-8 sm:size-10"
          />

          {/* User info */}
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm sm:text-base truncate">{selectedUser.fullName}</h3>
            <p className="text-xs sm:text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? t("chat.online") : t("chat.offline")}
            </p>
          </div>
        </div>

        {/* Call buttons and close button */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Voice call button */}
          <button
            onClick={handleVoiceCall}
            disabled={!onlineUsers.includes(selectedUser._id)}
            className="p-1.5 sm:p-2 hover:bg-base-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Voice call"
          >
            <Phone size={16} className="sm:w-5 sm:h-5" />
          </button>

          {/* Video call button */}
          <button
            onClick={handleVideoCall}
            disabled={!onlineUsers.includes(selectedUser._id)}
            className="p-1.5 sm:p-2 hover:bg-base-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Video call"
          >
            <Video size={16} className="sm:w-5 sm:h-5" />
          </button>

          {/* Close button */}
          <button 
            onClick={() => setSelectedUser(null)}
            className="p-1.5 sm:p-2 hover:bg-base-200 rounded-lg transition-colors"
          >
            <X size={16} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
