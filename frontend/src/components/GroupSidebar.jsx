import { useEffect, useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { Users, Plus, Search } from "lucide-react";
import Avatar from "./Avatar";
import CreateGroupModal from "./CreateGroupModal";

const GroupSidebar = () => {
  const { groups, selectedGroup, setSelectedGroup, getGroups, isGroupsLoading } = useGroupStore();
  const { authUser } = useAuthStore();
  const { t } = useLanguageStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    getGroups();
  }, [getGroups]);

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isGroupsLoading) {
    return (
      <div className="w-full lg:w-72 border-r border-base-300 flex flex-col">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t("groups.title")}</h2>
            <div className="skeleton w-10 h-10 rounded-full"></div>
          </div>
          <div className="skeleton h-10 w-full mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="skeleton w-12 h-12 rounded-full"></div>
                <div className="flex-1">
                  <div className="skeleton h-4 w-24 mb-2"></div>
                  <div className="skeleton h-3 w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full lg:w-72 border-r border-base-300 flex flex-col">
        <div className="p-4 border-b border-base-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users size={20} />
              {t("groups.title")}
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" size={18} />
            <input
              type="text"
              placeholder={t("chat.searchUsers")}
              className="input input-bordered w-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto">
          {filteredGroups.length === 0 ? (
            <div className="p-6 text-center">
              <Users size={48} className="mx-auto text-base-content/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">{t("groups.noGroups")}</h3>
              <p className="text-base-content/60 text-sm mb-4">
                {t("groups.joinFirstGroup")}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} />
                {t("groups.createGroup")}
              </button>
            </div>
          ) : (
            <div className="p-2">
              {filteredGroups.map((group) => {
                const memberCount = group.members.length;
                const isSelected = selectedGroup?._id === group._id;
                
                return (
                  <button
                    key={group._id}
                    onClick={() => setSelectedGroup(group)}
                    className={`
                      w-full p-3 flex items-center gap-3 rounded-lg transition-colors mb-1
                      hover:bg-base-200
                      ${isSelected ? "bg-base-200 ring-1 ring-primary/20" : ""}
                    `}
                  >
                    <div className="relative">
                      <Avatar
                        src={group.groupPic}
                        name={group.name}
                        size="size-12"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-primary text-primary-content text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {memberCount}
                      </div>
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <h3 className="font-medium truncate">{group.name}</h3>
                      <p className="text-sm text-base-content/60 truncate">
                        {memberCount} {t("groups.members")}
                      </p>
                    </div>

                    {/* Admin badge */}
                    {group.creator._id === authUser._id && (
                      <div className="badge badge-primary badge-sm">
                        {t("groups.admin")}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </>
  );
};

export default GroupSidebar;
