import { useState } from "react";
import { usePostStore } from "../store/usePostStore";
import { useAuthStore } from "../store/useAuthStore";
import { Heart, Laugh, Frown, ThumbsUp, Angry, Zap } from "lucide-react";

const PostReactions = ({ post, showButtons = false }) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const { addReaction, removeReaction } = usePostStore();
  const { authUser } = useAuthStore();

  const reactionIcons = {
    like: { icon: ThumbsUp, color: "text-blue-500", bgColor: "bg-blue-500" },
    love: { icon: Heart, color: "text-red-500", bgColor: "bg-red-500" },
    laugh: { icon: Laugh, color: "text-yellow-500", bgColor: "bg-yellow-500" },
    wow: { icon: Zap, color: "text-purple-500", bgColor: "bg-purple-500" },
    sad: { icon: Frown, color: "text-gray-500", bgColor: "bg-gray-500" },
    angry: { icon: Angry, color: "text-orange-500", bgColor: "bg-orange-500" },
  };

  // Get user's current reaction
  const userReaction = post.reactions?.find(
    (reaction) => reaction.user._id === authUser._id
  );

  const handleReaction = async (reactionType) => {
    if (userReaction?.type === reactionType) {
      // Remove reaction if same type
      await removeReaction(post._id);
    } else {
      // Add or change reaction
      await addReaction(post._id, reactionType);
    }
    setShowReactionPicker(false);
  };

  const getTopReactions = () => {
    const counts = post.reactionCounts || {};
    return Object.entries(counts)
      .filter(([type, count]) => type !== "total" && count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  };

  if (showButtons) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowReactionPicker(!showReactionPicker)}
          onMouseEnter={() => setShowReactionPicker(true)}
          onMouseLeave={() => setShowReactionPicker(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            userReaction
              ? `${reactionIcons[userReaction.type]?.color} bg-base-200`
              : "hover:bg-base-200"
          }`}
        >
          {userReaction ? (
            <>
              {(() => {
                const ReactionIcon = reactionIcons[userReaction.type]?.icon || ThumbsUp;
                return <ReactionIcon size={18} />;
              })()}
              <span className="capitalize">{userReaction.type}</span>
            </>
          ) : (
            <>
              <ThumbsUp size={18} />
              <span>Like</span>
            </>
          )}
        </button>

        {/* Reaction Picker */}
        {showReactionPicker && (
          <div
            className="absolute bottom-full left-0 mb-2 bg-base-100 border border-base-300 rounded-full shadow-lg p-2 flex gap-1 z-10"
            onMouseEnter={() => setShowReactionPicker(true)}
            onMouseLeave={() => setShowReactionPicker(false)}
          >
            {Object.entries(reactionIcons).map(([type, { icon: Icon, color }]) => (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                className={`p-2 rounded-full hover:scale-125 transition-transform ${color}`}
                title={type}
              >
                <Icon size={20} />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Display reaction counts
  const topReactions = getTopReactions();
  const totalReactions = post.reactionCounts?.total || 0;

  if (totalReactions === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Reaction Icons */}
      <div className="flex -space-x-1">
        {topReactions.map(([type]) => {
          const { icon: Icon, bgColor } = reactionIcons[type];
          return (
            <div
              key={type}
              className={`w-5 h-5 ${bgColor} rounded-full flex items-center justify-center border border-white`}
            >
              <Icon size={12} className="text-white" />
            </div>
          );
        })}
      </div>

      {/* Reaction Count */}
      <span className="text-sm text-base-content/60">
        {totalReactions}
      </span>
    </div>
  );
};

export default PostReactions;
