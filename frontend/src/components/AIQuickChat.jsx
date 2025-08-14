import { Bot } from "lucide-react";
import { Link } from "react-router-dom";

const AIQuickChat = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 w-80 h-96 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <span className="font-semibold">AI Assistant</span>
          </div>
          <div className="flex gap-2">
            <Link
              to="/ai-chat"
              className="btn btn-ghost btn-xs"
              onClick={onClose}
            >
              Expand
            </Link>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Quick Chat Content */}
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="text-center">
            <Bot className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-sm text-base-content/70 mb-3">
              Quick chat with AI Assistant
            </p>
            <Link
              to="/ai-chat"
              className="btn btn-primary btn-sm"
              onClick={onClose}
            >
              Start Chatting
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIQuickChat;
