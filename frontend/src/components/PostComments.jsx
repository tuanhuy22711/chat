import { useState } from "react";
import { usePostStore } from "../store/usePostStore";
import { useAuthStore } from "../store/useAuthStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { formatRelativeTime } from "../lib/utils";
import Avatar from "./Avatar";
import { Send, Reply } from "lucide-react";

const PostComments = ({ post }) => {
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const { addComment } = usePostStore();
  const { authUser } = useAuthStore();
  const { t } = useLanguageStore();

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await addComment(post._id, newComment.trim());
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleAddReply = async (parentCommentId) => {
    if (!replyText.trim()) return;

    try {
      await addComment(post._id, replyText.trim(), parentCommentId);
      setReplyText("");
      setReplyTo(null);
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  const handleKeyPress = (e, isReply = false) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isReply) {
        handleAddReply(replyTo);
      } else {
        handleAddComment();
      }
    }
  };

  // Get top-level comments (not replies)
  const topLevelComments = post.comments?.filter(comment => !comment.parentComment) || [];

  // Get replies for a specific comment
  const getReplies = (commentId) => {
    return post.comments?.filter(comment => comment.parentComment === commentId) || [];
  };

  const renderComment = (comment, isReply = false) => (
    <div key={comment._id} className={`flex gap-3 ${isReply ? 'ml-8' : ''}`}>
      <Avatar
        src={comment.user?.profilePic}
        name={comment.user?.fullName}
        size="size-8"
      />
      
      <div className="flex-1">
        <div className="bg-base-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.user?.fullName}</span>
            <span className="text-xs text-base-content/60">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm">{comment.text}</p>
        </div>
        
        {!isReply && (
          <button
            onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
            className="text-xs text-base-content/60 hover:text-base-content mt-1 flex items-center gap-1"
          >
            <Reply size={12} />
            {t("posts.reply") || "Reply"}
          </button>
        )}

        {/* Reply Input */}
        {replyTo === comment._id && (
          <div className="flex gap-2 mt-2">
            <Avatar
              src={authUser?.profilePic}
              name={authUser?.fullName}
              size="size-6"
            />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, true)}
                placeholder={t("posts.writeReply") || "Write a reply..."}
                className="flex-1 input input-sm bg-base-200 border-none"
              />
              <button
                onClick={() => handleAddReply(comment._id)}
                disabled={!replyText.trim()}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Render replies */}
        {!isReply && getReplies(comment._id).map(reply => renderComment(reply, true))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Add Comment */}
      <div className="flex gap-3">
        <Avatar
          src={authUser?.profilePic}
          name={authUser?.fullName}
          size="size-8"
        />
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t("posts.writeComment") || "Write a comment..."}
            className="flex-1 input input-sm bg-base-200 border-none"
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {topLevelComments.map(comment => renderComment(comment))}
      </div>

      {topLevelComments.length === 0 && (
        <p className="text-center text-base-content/60 py-4">
          {t("posts.noComments") || "No comments yet. Be the first to comment!"}
        </p>
      )}
    </div>
  );
};

export default PostComments;
