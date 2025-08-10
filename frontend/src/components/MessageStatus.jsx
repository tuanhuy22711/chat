import { Check, CheckCheck } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const MessageStatus = ({ message, groupMembers }) => {
  const { authUser } = useAuthStore();
  
  // Only show status for messages sent by current user
  const senderId = message.senderId._id || message.senderId;
  if (senderId !== authUser._id) {
    return null;
  }

  const getStatusIcon = () => {
    if (message.messageType === "group") {
      // For group messages, show if at least one person has read it
      const readCount = message.readBy?.length || 0;
      const totalMembers = groupMembers?.length || 0;
      
      if (readCount > 0 && readCount < totalMembers - 1) {
        // Some have read (excluding sender)
        return <CheckCheck size={16} className="text-blue-500" />;
      } else if (readCount >= totalMembers - 1) {
        // All have read (excluding sender)
        return <CheckCheck size={16} className="text-blue-500" />;
      } else {
        // Delivered but not read
        return <CheckCheck size={16} className="text-gray-400" />;
      }
    } else {
      // For private messages
      switch (message.status) {
        case "read":
          return <CheckCheck size={16} className="text-blue-500" />;
        case "delivered":
          return <CheckCheck size={16} className="text-gray-400" />;
        case "sent":
        default:
          return <Check size={16} className="text-gray-400" />;
      }
    }
  };

  return (
    <div className="flex items-center justify-end mt-1">
      {getStatusIcon()}
    </div>
  );
};

export default MessageStatus;
