import { useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { X, Users, Settings, UserPlus, LogOut } from "lucide-react";
import Avatar from "./Avatar";
import GroupMembersModal from "./GroupMembersModal";

const GroupChatHeader = () => {
  const { selectedGroup, setSelectedGroup, leaveGroup } = useGroupStore();
  const { authUser } = useAuthStore();
  const { t } = useLanguageStore();
  const [showMembersModal, setShowMembersModal] = useState(false);

  if (!selectedGroup) return null;

  const isAdmin = selectedGroup.creator._id === authUser._id;
  const memberCount = selectedGroup.members.length;

  const handleLeaveGroup = async () => {
    if (window.confirm(t("groups.leaveGroup") + "?")) {
      await leaveGroup(selectedGroup._id);
    }
  };

  return (
    <>
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Group Avatar */}
            <Avatar
              src={selectedGroup.groupPic}
              name={selectedGroup.name}
              size="size-10"
            />

            {/* Group Info */}
            <div>
              <h3 className="font-medium">{selectedGroup.name}</h3>
              <button
                onClick={() => setShowMembersModal(true)}
                className="text-sm text-base-content/70 hover:text-primary transition-colors"
              >
                {memberCount} {t("groups.members")}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Members button */}
            <button
              onClick={() => setShowMembersModal(true)}
              className="btn btn-ghost btn-sm btn-circle"
              title={t("groups.members")}
            >
              <Users size={18} />
            </button>

            {/* Leave group button */}
            <button
              onClick={handleLeaveGroup}
              className="btn btn-ghost btn-sm btn-circle text-error hover:bg-error/10"
              title={t("groups.leaveGroup")}
            >
              <LogOut size={18} />
            </button>

            {/* Close button */}
            <button
              onClick={() => setSelectedGroup(null)}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Group Description */}
        {selectedGroup.description && (
          <div className="mt-2">
            <p className="text-sm text-base-content/60 line-clamp-2">
              {selectedGroup.description}
            </p>
          </div>
        )}
      </div>

      {/* Members Modal */}
      {showMembersModal && (
        <GroupMembersModal
          isOpen={showMembersModal}
          onClose={() => setShowMembersModal(false)}
          group={selectedGroup}
        />
      )}
    </>
  );
};

export default GroupChatHeader;
