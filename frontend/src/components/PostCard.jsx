import { useState } from "react";
import { usePostStore } from "../store/usePostStore";
import { useAuthStore } from "../store/useAuthStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { useNavigate } from "react-router-dom";
import { formatRelativeTime } from "../lib/utils";
import Avatar from "./Avatar";
import PostReactions from "./PostReactions";
import PostComments from "./PostComments";
import {
  MoreHorizontal,
  Edit3,
  Trash2,
  Pin,
  PinOff,
  Share,
  Globe,
  Users,
  Lock,
  MessageCircle,
  Share2,
} from "lucide-react";

const PostCard = ({ post }) => {
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.content.text || "");

  const { editPost, deletePost, togglePinPost, sharePost } = usePostStore();
  const { authUser } = useAuthStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();

  const isAuthor = post.author._id === authUser._id;
  const isSharedPost = post.postType === "shared";

  const getPrivacyIcon = () => {
    switch (post.privacy) {
      case "public":
        return <Globe size={14} className="text-green-500" />;
      case "friends":
        return <Users size={14} className="text-blue-500" />;
      case "private":
        return <Lock size={14} className="text-gray-500" />;
      default:
        return <Globe size={14} className="text-green-500" />;
    }
  };

  const handleEdit = async () => {
    if (editText.trim() === post.content.text) {
      setIsEditing(false);
      return;
    }

    try {
      await editPost(post._id, { text: editText.trim() });
      setIsEditing(false);
      setShowMenu(false);
    } catch (error) {
      console.error("Error editing post:", error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(t("posts.confirmDelete") || "Are you sure you want to delete this post?")) {
      try {
        await deletePost(post._id);
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  const handlePin = async () => {
    try {
      await togglePinPost(post._id);
      setShowMenu(false);
    } catch (error) {
      console.error("Error pinning post:", error);
    }
  };

  const handleShare = async () => {
    const shareText = prompt(t("posts.sharePrompt") || "Add a comment to your share (optional):");
    if (shareText !== null) {
      try {
        await sharePost(post._id, shareText);
        setShowMenu(false);
      } catch (error) {
        console.error("Error sharing post:", error);
      }
    }
  };

  const renderOriginalPost = (originalPost) => {
    if (!originalPost) return null;

    return (
      <div className="border border-base-300 rounded-lg p-3 mt-3">
        <div className="flex items-center gap-2 mb-2">
          <Avatar
            src={originalPost.author?.profilePic}
            name={originalPost.author?.fullName}
            size="size-8"
          />
          <div>
            <p className="font-medium text-sm">{originalPost.author?.fullName}</p>
            <div className="flex items-center gap-1 text-xs text-base-content/60">
              <span>{formatRelativeTime(originalPost.createdAt)}</span>
              {getPrivacyIcon()}
            </div>
          </div>
        </div>

        {originalPost.content.text && (
          <p className="text-sm mb-2">{originalPost.content.text}</p>
        )}

        {/* Original post media */}
        {originalPost.content.images?.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            {originalPost.content.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Post image ${index + 1}`}
                className="w-full h-32 object-cover rounded-md"
              />
            ))}
          </div>
        )}

        {originalPost.content.videos?.length > 0 && (
          <div className="mb-2">
            {originalPost.content.videos.map((video, index) => (
              <video
                key={index}
                src={video}
                controls
                className="w-full h-48 object-cover rounded-md"
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-md p-4 mb-4">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/profile/${post.author._id}`)}
            className="hover:opacity-80 transition-opacity"
          >
            <Avatar
              src={post.author.profilePic}
              name={post.author.fullName}
              size="size-10"
            />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/profile/${post.author._id}`)}
                className="font-medium hover:underline"
              >
                {post.author.fullName}
              </button>
              {post.isPinned && (
                <Pin size={14} className="text-primary" />
              )}
              {isSharedPost && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {t("posts.shared") || "Shared"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-base-content/60">
              <span>{formatRelativeTime(post.createdAt)}</span>
              {getPrivacyIcon()}
              {post.isEdited && (
                <span className="text-xs">({t("posts.edited") || "Edited"})</span>
              )}
            </div>
          </div>
        </div>

        {/* Menu Button */}
        {isAuthor && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <MoreHorizontal size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 bg-base-100 border border-base-300 rounded-lg shadow-lg z-10 w-48">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-base-200"
                >
                  <Edit3 size={16} />
                  {t("posts.edit") || "Edit"}
                </button>
                <button
                  onClick={handlePin}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-base-200"
                >
                  {post.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                  {post.isPinned ? (t("posts.unpin") || "Unpin") : (t("posts.pin") || "Pin")}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-base-200 text-red-500"
                >
                  <Trash2 size={16} />
                  {t("posts.delete") || "Delete"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-4">
        {isEditing ? (
          <div>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 border border-base-300 rounded-lg resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="btn btn-ghost btn-sm"
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button onClick={handleEdit} className="btn btn-primary btn-sm">
                {t("common.save") || "Save"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {post.content.text && <p className="mb-3">{post.content.text}</p>}

            {/* Shared post content */}
            {isSharedPost && renderOriginalPost(post.originalPost)}

            {/* Current post media (only for non-shared posts) */}
            {!isSharedPost && (
              <>
                {post.content.images?.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {post.content.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Post image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {post.content.videos?.length > 0 && (
                  <div className="mb-3">
                    {post.content.videos.map((video, index) => (
                      <video
                        key={index}
                        src={video}
                        controls
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Post Stats */}
      <div className="flex items-center justify-between py-2 border-t border-b border-base-300 mb-3">
        <PostReactions post={post} />
        <div className="flex items-center gap-4 text-sm text-base-content/60">
          <span>{post.commentCount || 0} {t("posts.comments") || "comments"}</span>
          <span>{post.shareCount || 0} {t("posts.shares") || "shares"}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-around py-2 border-b border-base-300 mb-3">
        <PostReactions post={post} showButtons />
        
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-base-200 transition-colors"
        >
          <MessageCircle size={18} />
          {t("posts.comment") || "Comment"}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-base-200 transition-colors"
        >
          <Share2 size={18} />
          {t("posts.share") || "Share"}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && <PostComments post={post} />}
    </div>
  );
};

export default PostCard;
