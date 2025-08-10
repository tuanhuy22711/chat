import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import Avatar from "./Avatar";
import MessageStatus from "./MessageStatus";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    markMessagesAsRead,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const prevMessagesLength = useRef(0);

  useEffect(() => {
    getMessages(selectedUser._id);
    markMessagesAsRead(selectedUser._id);

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages, markMessagesAsRead]);

  useEffect(() => {
    // Scroll when messages change - new messages added or initial load
    if (messageEndRef.current) {
      // If it's initial load (was 0) or new messages added, scroll
      if (prevMessagesLength.current === 0 || messages.length > prevMessagesLength.current) {
        messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[70vh]">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${(message.senderId._id || message.senderId) === authUser._id ? "chat-end" : "chat-start"}`}
          >
            <div className=" chat-image avatar">
              <Avatar 
                src={
                  (message.senderId._id || message.senderId) === authUser._id
                    ? authUser.profilePic
                    : selectedUser.profilePic
                }
                name={
                  (message.senderId._id || message.senderId) === authUser._id
                    ? authUser.fullName
                    : selectedUser.fullName
                }
                size="size-10"
              />
            </div>
            <div className="chat-header mb-1">
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
            </div>
            <MessageStatus message={message} />
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
