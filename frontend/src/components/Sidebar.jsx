import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { useNavigate } from "react-router-dom";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import Avatar from "./Avatar";
import { Users, User } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium">{t("nav.directMessages")}</span>
        </div>
        {/* TODO: Online filter toggle */}
        <div className="mt-3 flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">{t("chat.showOnlineOnly")}</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineUsers.length - 1} {t("chat.online").toLowerCase()})</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => (
          <div
            key={user._id}
            className={`
              w-full p-3 flex items-center gap-3 group
              hover:bg-base-300 transition-colors
              ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
            `}
          >
            <button
              onClick={() => setSelectedUser(user)}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <div className="relative">
                <Avatar 
                  src={user.profilePic}
                  name={user.fullName}
                  size="size-12"
                />
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-zinc-900"
                  />
                )}
              </div>

              {/* User info */}
              <div className="text-left min-w-0">
                <div className="font-medium truncate">{user.fullName}</div>
                <div className="text-sm text-zinc-400">
                  {onlineUsers.includes(user._id) ? t("chat.online") : t("chat.offline")}
                </div>
              </div>
            </button>
            
            {/* View Profile Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${user._id}`);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-base-200 rounded-full"
              title="View Profile"
            >
              <User size={16} />
            </button>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">{t("chat.noUsersFound")}</div>
        )}
      </div>
    </div>
  );
};
export default Sidebar;
