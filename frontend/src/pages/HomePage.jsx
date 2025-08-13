import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useLanguageStore } from "../store/useLanguageStore";

import Sidebar from "../components/Sidebar";
import GroupSidebar from "../components/GroupSidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { selectedGroup } = useGroupStore();
  const { t } = useLanguageStore();
  const [activeTab, setActiveTab] = useState("users"); // "users" or "groups"

  const renderMainContent = () => {
    if (activeTab === "users") {
      return !selectedUser ? <NoChatSelected /> : <ChatContainer />;
    } else {
      return !selectedGroup ? <NoChatSelected /> : <GroupChatContainer />;
    }
  };

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-4 sm:pt-20 px-2 sm:px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-2rem)] sm:h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg">
            {/* Sidebar with tabs - hide on mobile when chat is selected */}
            <div className={`
              w-full sm:w-80 border-r border-base-300 flex flex-col
              ${(selectedUser || selectedGroup) ? 'hidden sm:flex' : 'flex'}
            `}>
              {/* Tab buttons */}
              <div className="p-2 sm:p-4 border-b border-base-300">
                <div className="flex bg-base-200 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab("users")}
                    className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                      activeTab === "users"
                        ? "bg-primary text-primary-content"
                        : "text-base-content/60 hover:text-base-content"
                    }`}
                  >
                    {t("nav.directMessages")}
                  </button>
                  <button
                    onClick={() => setActiveTab("groups")}
                    className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                      activeTab === "groups"
                        ? "bg-primary text-primary-content"
                        : "text-base-content/60 hover:text-base-content"
                    }`}
                  >
                    {t("groups.groups")}
                  </button>
                </div>
              </div>

              {/* Sidebar content */}
              <div className="flex-1">
                {activeTab === "users" ? <Sidebar /> : <GroupSidebar />}
              </div>
            </div>

            {/* Main chat area - show full width on mobile when chat is selected */}
            <div className={`
              flex-1
              ${(selectedUser || selectedGroup) ? 'flex' : 'hidden sm:flex'}
            `}>
              {renderMainContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
