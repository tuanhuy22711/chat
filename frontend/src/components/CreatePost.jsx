import { useState } from "react";
import { usePostStore } from "../store/usePostStore";
import { useAuthStore } from "../store/useAuthStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { ImageIcon, VideoIcon, FileIcon, Globe, Users, Lock, Send } from "lucide-react";
import Avatar from "./Avatar";
import toast from "react-hot-toast";

const CreatePost = () => {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [privacy, setPrivacy] = useState("public");
  const [isExpanded, setIsExpanded] = useState(false);

  const { createPost, isCreating } = usePostStore();
  const { authUser } = useAuthStore();
  const { t } = useLanguageStore();

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        // Check file size (max 10MB for images)
        if (file.size > 10 * 1024 * 1024) {
          toast.error("Image file size must be less than 10MB");
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          setImages((prev) => [...prev, e.target.result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (file.type.startsWith("video/")) {
        // Check file size (max 100MB for videos)
        if (file.size > 100 * 1024 * 1024) {
          toast.error("Video file size must be less than 100MB");
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          setVideos((prev) => [...prev, e.target.result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!text.trim() && images.length === 0 && videos.length === 0) {
      return;
    }

    try {
      await createPost({
        text: text.trim(),
        images,
        videos,
        privacy,
      });

      // Reset form
      setText("");
      setImages([]);
      setVideos([]);
      setPrivacy("public");
      setIsExpanded(false);
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const getPrivacyIcon = () => {
    switch (privacy) {
      case "public":
        return <Globe size={16} className="text-green-500" />;
      case "friends":
        return <Users size={16} className="text-blue-500" />;
      case "private":
        return <Lock size={16} className="text-gray-500" />;
      default:
        return <Globe size={16} className="text-green-500" />;
    }
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-md p-4 mb-6">
      <div className="flex gap-3">
        <Avatar
          src={authUser?.profilePic}
          name={authUser?.fullName}
          size="size-10"
        />
        
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("posts.whatsOnYourMind") || "What's on your mind?"}
            className="w-full resize-none border-none outline-none bg-base-200 rounded-lg p-3 min-h-[50px] text-base-content placeholder-base-content/60"
            rows={isExpanded ? 4 : 2}
            onFocus={() => setIsExpanded(true)}
          />

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Video Previews */}
          {videos.length > 0 && (
            <div className="grid grid-cols-1 gap-2 mt-3">
              {videos.map((video, index) => (
                <div key={index} className="relative">
                  <video
                    src={video}
                    controls
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeVideo(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {isExpanded && (
            <div className="flex items-center justify-between mt-4">
              {/* Media buttons */}
              <div className="flex gap-2">
                <label className="btn btn-ghost btn-sm">
                  <ImageIcon size={18} className="text-green-500" />
                  {t("posts.addPhoto") || "Photo"}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                <label className="btn btn-ghost btn-sm">
                  <VideoIcon size={18} className="text-blue-500" />
                  {t("posts.addVideo") || "Video"}
                  <input
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Privacy selector */}
              <div className="flex items-center gap-2">
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value)}
                  className="select select-sm bg-base-200"
                >
                  <option value="public">{t("posts.public") || "Public"}</option>
                  <option value="friends">{t("posts.friends") || "Friends"}</option>
                  <option value="private">{t("posts.private") || "Private"}</option>
                </select>
                {getPrivacyIcon()}
              </div>
            </div>
          )}

          {isExpanded && (
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSubmit}
                disabled={isCreating || (!text.trim() && images.length === 0 && videos.length === 0)}
                className="btn btn-primary btn-sm"
              >
                {isCreating ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <Send size={16} />
                    {t("posts.post") || "Post"}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
