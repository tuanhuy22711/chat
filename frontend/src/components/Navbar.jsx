import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useLanguageStore } from "../store/useLanguageStore";
import LanguageSelector from "./LanguageSelector";
import NotificationDropdown from "./NotificationDropdown";
import { LogOut, MessageSquare, Settings, User, FileText, Bot } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { t } = useLanguageStore();

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
    backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-2 sm:px-4 h-14 sm:h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link to="/" className="flex items-center gap-2 sm:gap-2.5 hover:opacity-80 transition-all">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <h1 className="text-base sm:text-lg font-bold">Chat App</h1>
            </Link>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>
            
            {/* Notifications */}
            {authUser && <NotificationDropdown />}
            
            <Link
              to={"/newsfeed"}
              className="btn btn-sm gap-1 sm:gap-2 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{t("nav.newsfeed") || "Newsfeed"}</span>
            </Link>
            
            <Link
              to={"/ai-chat"}
              className="btn btn-sm gap-1 sm:gap-2 transition-colors"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">AI Chat</span>
            </Link>
            
            <Link
              to={"/settings"}
              className="btn btn-sm gap-1 sm:gap-2 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{t("nav.settings")}</span>
            </Link>

            {authUser && (
              <>
                <Link to={"/profile"} className="btn btn-sm gap-1 sm:gap-2">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{t("nav.profile")}</span>
                </Link>

                <button className="flex gap-1 sm:gap-2 items-center btn btn-sm" onClick={logout}>
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{t("nav.logout")}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
