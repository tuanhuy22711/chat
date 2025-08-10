import { useState, useEffect } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { X, Users, Search, Check } from "lucide-react";
import Avatar from "./Avatar";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const { createGroup, isCreatingGroup } = useGroupStore();
  const { users, getUsers } = useChatStore();
  const { t } = useLanguageStore();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    memberIds: [],
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      getUsers();
    }
  }, [isOpen, getUsers]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        description: "",
        memberIds: [],
      });
      setSearchTerm("");
    }
  }, [isOpen]);

  const filteredUsers = users.filter((user) =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    if (formData.memberIds.length === 0) {
      return;
    }

    try {
      await createGroup(formData);
      onClose();
    } catch (error) {
      // Error is handled in the store
    }
  };

  const toggleMember = (userId) => {
    setFormData((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter((id) => id !== userId)
        : [...prev.memberIds, userId],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users size={24} />
            {t("groups.createGroup")}
          </h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-6 space-y-4">
            {/* Group Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  {t("groups.groupName")} *
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter group name..."
                maxLength={50}
                required
              />
            </div>

            {/* Description */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  {t("groups.groupDescription")}
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Enter group description..."
                maxLength={200}
                rows={3}
              />
            </div>

            {/* Members Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  {t("groups.selectMembers")} * ({formData.memberIds.length} selected)
                </span>
              </label>
              
              {/* Search Users */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" size={18} />
                <input
                  type="text"
                  className="input input-bordered w-full pl-10"
                  placeholder={t("chat.searchUsers")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Users List */}
              <div className="border border-base-300 rounded-lg max-h-48 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-base-content/60">
                    {t("chat.noUsersFound")}
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredUsers.map((user) => {
                      const isSelected = formData.memberIds.includes(user._id);
                      
                      return (
                        <div
                          key={user._id}
                          onClick={() => toggleMember(user._id)}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                            hover:bg-base-200
                            ${isSelected ? "bg-primary/10" : ""}
                          `}
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

                          {isSelected && (
                            <Check size={20} className="text-primary" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-base-300">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={isCreatingGroup}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                isCreatingGroup ||
                !formData.name.trim() ||
                formData.memberIds.length === 0
              }
            >
              {isCreatingGroup ? t("groups.creating") : t("groups.createButton")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
