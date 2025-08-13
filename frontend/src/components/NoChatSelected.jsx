import { MessageSquare } from "lucide-react";
import { useLanguageStore } from "../store/useLanguageStore";

const NoChatSelected = () => {
  const { t } = useLanguageStore();
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-8 sm:p-16 bg-base-100/50">
      <div className="max-w-md text-center space-y-4 sm:space-y-6">
        {/* Icon Display */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center
             justify-center animate-bounce"
            >
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-primary " />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-xl sm:text-2xl font-bold">{t("chat.noChatSelected")}</h2>
        <p className="text-sm sm:text-base text-base-content/60">
          {t("chat.selectConversation")}
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;
