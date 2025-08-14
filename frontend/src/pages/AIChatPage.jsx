import { useState, useEffect, useRef } from "react";
import { useAIChatStore } from "../store/useAIChatStore";
import { Send, Bot, User, Plus, Trash2, Settings, Zap } from "lucide-react";
import { formatRelativeTime } from "../lib/utils";
import MessageContent from "../components/MessageContent";
import toast from "react-hot-toast";

const AIChatPage = () => {
  const {
    sessions,
    currentSession,
    messages,
    models,
    usageStats,
    isLoading,
    isSending,
    getSessions,
    getMessages,
    sendMessage,
    createNewSession,
    deleteSession,
    getModels,
    getUsageStats,
    setCurrentSession,
    clearCurrentSession,
    subscribeToAIUpdates,
    unsubscribeFromAIUpdates,
  } = useAIChatStore();

  const [messageText, setMessageText] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo");
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    getSessions();
    getModels();
    getUsageStats();
    subscribeToAIUpdates();

    return () => {
      unsubscribeFromAIUpdates();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || isSending) return;

    const message = messageText;
    setMessageText("");

    let sessionId = currentSession;
    if (!sessionId) {
      sessionId = await createNewSession();
    }

    if (sessionId) {
      await sendMessage(sessionId, message, selectedModel);
    }
  };

  const handleSessionSelect = async (sessionId) => {
    setCurrentSession(sessionId);
    await getMessages(sessionId);
  };

  const handleNewChat = async () => {
    const sessionId = await createNewSession();
    if (sessionId) {
      clearCurrentSession();
      setCurrentSession(sessionId);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat session?")) {
      await deleteSession(sessionId);
    }
  };

  const getModelInfo = (modelId) => {
    return models.find(m => m.id === modelId) || models[0];
  };

  return (
    <div className="min-h-screen bg-base-200 flex">
      {/* Sidebar */}
      <div className="w-80 bg-base-100 border-r border-base-300 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-base-300">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              AI Assistant
            </h1>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn btn-ghost btn-sm"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-4 p-3 bg-base-200 rounded-lg">
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">AI Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="select select-bordered select-sm w-full"
                >
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Usage Stats */}
              {usageStats && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Today's Usage:</span>
                    <span>{usageStats.today.messages} messages</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Cost:</span>
                    <span>${usageStats.today.cost}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="btn btn-primary btn-sm w-full mb-4"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                onClick={() => handleSessionSelect(session.sessionId)}
                className={`p-3 rounded-lg cursor-pointer group transition-colors ${
                  currentSession === session.sessionId
                    ? "bg-primary text-primary-content"
                    : "bg-base-200 hover:bg-base-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">
                      {session.title || "New Chat"}
                    </h3>
                    <p className="text-xs opacity-70 truncate">
                      {session.lastMessage?.content || "No messages yet"}
                    </p>
                    <div className="text-xs opacity-50 mt-1">
                      {formatRelativeTime(session.updatedAt)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(session.sessionId, e)}
                    className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-base-300 bg-base-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">
                    {sessions.find(s => s.sessionId === currentSession)?.title || "AI Chat"}
                  </h2>
                  <div className="text-sm text-base-content/70 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    {getModelInfo(selectedModel)?.name || selectedModel}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary-content" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[85%] p-4 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary text-primary-content"
                        : "bg-base-100 border border-base-300 shadow-sm"
                    }`}
                  >
                    <MessageContent 
                      content={message.content} 
                      isAI={message.role === "assistant"} 
                    />
                    <div className="text-xs opacity-70 mt-3 flex items-center justify-between">
                      <span>{formatRelativeTime(message.timestamp)}</span>
                      {message.role === "assistant" && message.tokens && (
                        <span className="text-xs bg-base-200 px-2 py-1 rounded">
                          {message.tokens} tokens
                        </span>
                      )}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <div className="w-8 h-8 bg-base-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-base-content" />
                    </div>
                  )}
                </div>
              ))}
              
              {isSending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-primary-content" />
                  </div>
                  <div className="bg-base-100 border border-base-300 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="loading loading-dots loading-sm"></div>
                      <span className="text-sm text-base-content/70">
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-base-300 bg-base-100">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Ask AI anything..."
                  className="input input-bordered flex-1"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || isSending}
                  className="btn btn-primary"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          // No chat selected
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bot className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Welcome to AI Assistant</h2>
              <p className="text-base-content/70 mb-6">
                Select a chat session or create a new one to start chatting with AI
              </p>
              <button
                onClick={handleNewChat}
                className="btn btn-primary"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4" />
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatPage;
