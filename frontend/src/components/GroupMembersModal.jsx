import { useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { X, UserPlus, Crown, User, Search } from "lucide-react";
import Avatar from "./Avatar";

const GroupMembersModal = ({ isOpen, onClose, group }) => {
  const { addGroupMember } = useGroupStore();
  const { authUser } = useAuthStore();
  const { users } = useChatStore();
  const { t } = useLanguageStore();
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen || !group) return null;

  const isUserAdmin = group.creator._id === authUser._id;
  
  // Get users who are not already in the group
  const availableUsers = users.filter(user => 
    !group.members.some(member => member.user._id === user._id)
  );

  const filteredAvailableUsers = availableUsers.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMember = async (userId) => {
    try {
      await addGroupMember(group._id, userId);
      setShowAddMember(false);
      setSearchTerm("");
    } catch (error) {
      // Error handled in store
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <h2 className="text-xl font-semibold">
            {group.name} - {group.members.length} {t("groups.members")}
          </h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!showAddMember ? (
            <>
              {/* Add Member Button */}
              {isUserAdmin && (
                <div className="p-4 border-b border-base-300">
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="btn btn-primary btn-sm w-full"
                  >
                    <UserPlus size={16} />
                    {t("groups.addMember")}
                  </button>
                </div>
              )}

              {/* Members List */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {group.members.map((member) => {
                    const isCreator = member.user._id === group.creator._id;
                    const isCurrentUser = member.user._id === authUser._id;
                    
                    return (
                      <div
                        key={member.user._id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-base-200/50"
                      >
                        <Avatar
                          src={member.user.profilePic}
                          name={member.user.fullName}
                          size="size-12"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">
                            {member.user.fullName}
                            {isCurrentUser && (
                              <span className="text-sm text-primary ml-1">
                                ({t("groups.you")})
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-base-content/60 truncate">
                            {member.user.email}
                          </p>
                        </div>

                        {/* Role Badge */}
                        <div className="flex items-center gap-2">
                          {isCreator ? (
                            <div className="badge badge-primary gap-1">
                              <Crown size={12} />
                              {t("groups.admin")}
                            </div>
                          ) : (
                            <div className="badge badge-ghost gap-1">
                              <User size={12} />
                              {t("groups.member")}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Add Member Section */}
              <div className="p-4 border-b border-base-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">{t("groups.addMember")}</h3>
                  <button
                    onClick={() => {
                      setShowAddMember(false);
                      setSearchTerm("");
                    }}
                    className="btn btn-ghost btn-sm"
                  >
                    {t("common.cancel")}
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" size={18} />
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10"
                    placeholder={t("chat.searchUsers")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Available Users List */}
              <div className="flex-1 overflow-y-auto p-4">
                {filteredAvailableUsers.length === 0 ? (
                  <div className="text-center text-base-content/60 py-8">
                    {availableUsers.length === 0 
                      ? "All users are already members"
                      : t("chat.noUsersFound")
                    }
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAvailableUsers.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200/50 transition-colors"
                      >
                        <Avatar
                          src={user.profilePic}
                          name={user.fullName}
                          size="size-10"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{user.fullName}</h4>
                          <p className="text-sm text-base-content/60 truncate">
                            {user.email}
                          </p>
                        </div>

                        <button
                          onClick={() => handleAddMember(user._id)}
                          className="btn btn-primary btn-sm"
                        >
                          <UserPlus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupMembersModal;
