import { useEffect, useRef } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { useLanguageStore } from "../store/useLanguageStore";
import GroupChatHeader from "./GroupChatHeader";
import GroupMessageInput from "./GroupMessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageStatus from "./MessageStatus";
import Avatar from "./Avatar";
import { formatMessageTime } from "../lib/utils";
import { Users } from "lucide-react";

const GroupChatContainer = () => {
  const {
    groupMessages,
    getGroupMessages,
    selectedGroup,
    isGroupMessagesLoading,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
    markGroupMessagesAsRead,
  } = useGroupStore();
  const { authUser } = useAuthStore();
  const { t } = useLanguageStore();
  const messageEndRef = useRef(null);
  const prevMessagesLength = useRef(0);

  useEffect(() => {
    if (selectedGroup) {
      getGroupMessages(selectedGroup._id);
      // Mark messages as read when opening the chat
      markGroupMessagesAsRead(selectedGroup._id);
    }
  }, [selectedGroup, getGroupMessages, markGroupMessagesAsRead]);

  useEffect(() => {
    subscribeToGroupMessages();
    return () => unsubscribeFromGroupMessages();
  }, [subscribeToGroupMessages, unsubscribeFromGroupMessages]);

  useEffect(() => {
    // Scroll when messages change - new messages added or initial load
    if (messageEndRef.current) {
      // If it's initial load (was 0) or new messages added, scroll
      if (prevMessagesLength.current === 0 || groupMessages.length > prevMessagesLength.current) {
        messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
    prevMessagesLength.current = groupMessages.length;
  }, [groupMessages]);

  if (!selectedGroup) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 bg-base-100/50">
        <div className="max-w-md text-center space-y-6">
          <div className="flex justify-center gap-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-bounce">
                <Users className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold">{t("groups.noGroups")}</h2>
          <p className="text-base-content/60">{t("groups.joinFirstGroup")}</p>
        </div>
      </div>
    );
  }

  if (isGroupMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <GroupChatHeader />
        <div className="flex-1 p-4">
          <div className="space-y-4">
            {[...Array(3)].map((_, idx) => (
              <MessageSkeleton key={idx} />
            ))}
          </div>
        </div>
        <GroupMessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <GroupChatHeader />

      <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[70vh]">
        {groupMessages.map((message, index) => (
          <div
            key={message._id}
            className={`chat ${message.senderId._id === authUser._id ? "chat-end" : "chat-start"}`}
          >
            <div className="chat-image avatar">
              <Avatar
                src={message.senderId.profilePic}
                name={message.senderId.fullName}
                size="size-10"
              />
            </div>
            
            <div className="chat-header mb-1">
              <span className="text-sm font-medium">
                {message.senderId._id === authUser._id
                  ? t("groups.you")
                  : message.senderId.fullName
                }
              </span>
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>

            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
              <MessageStatus 
                message={message} 
                groupMembers={selectedGroup?.members} 
              />
            </div>
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>

      <GroupMessageInput />
    </div>
  );
};

export default GroupChatContainer;
