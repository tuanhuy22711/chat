import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useLanguageStore } from "../store/useLanguageStore";
import Avatar from "../components/Avatar";
import AvatarPicker from "../components/AvatarPicker";
import { Camera, Mail, User, Palette, MapPin, Link as LinkIcon, Edit3, Save, X } from "lucide-react";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const { t } = useLanguageStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    location: authUser?.location || "",
    website: authUser?.website || "",
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleAvatarSelect = async (avatarUrl) => {
    setSelectedImg(avatarUrl);
    await updateProfile({ profilePic: avatarUrl });
    setShowAvatarPicker(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: authUser?.fullName || "",
      bio: authUser?.bio || "",
      location: authUser?.location || "",
      website: authUser?.website || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold ">{t("profile.title")}</h1>
            <p className="mt-2">{t("profile.subtitle")}</p>
          </div>

          {/* avatar upload section */}

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar 
                src={selectedImg || authUser.profilePic}
                name={authUser.fullName}
                size="size-32"
                className="border-4"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="btn btn-sm btn-outline"
                type="button"
              >
                <Palette size={16} />
                {t("profile.chooseAvatar")}
              </button>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? t("profile.updating") : t("profile.uploadOwn")}
            </p>
          </div>

          {/* Avatar Picker */}
          {showAvatarPicker && (
            <AvatarPicker
              userName={authUser.fullName}
              onSelect={handleAvatarSelect}
              currentAvatar={selectedImg || authUser.profilePic}
            />
          )}

          <div className="space-y-6">
            {/* Edit Button */}
            <div className="flex justify-end">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary btn-sm"
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isUpdatingProfile}
                    className="btn btn-primary btn-sm"
                  >
                    <Save size={16} />
                    {isUpdatingProfile ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn btn-outline btn-sm"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.email}</p>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Bio
              </div>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  className="textarea textarea-bordered w-full"
                  placeholder="Tell us about yourself..."
                  rows="3"
                  maxLength="500"
                />
              ) : (
                <p className="px-4 py-2.5 bg-base-200 rounded-lg border min-h-[80px]">
                  {authUser?.bio || "No bio added yet"}
                </p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="Where are you from?"
                  maxLength="100"
                />
              ) : (
                <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                  {authUser?.location || "No location added"}
                </p>
              )}
            </div>

            {/* Website */}
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Website
              </div>
              {isEditing ? (
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="https://your-website.com"
                  maxLength="200"
                />
              ) : (
                <div className="px-4 py-2.5 bg-base-200 rounded-lg border">
                  {authUser?.website ? (
                    <a
                      href={authUser.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {authUser.website}
                    </a>
                  ) : (
                    "No website added"
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium  mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
