import { useEffect, useCallback } from "react";
import { usePostStore } from "../store/usePostStore";
import { useLanguageStore } from "../store/useLanguageStore";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import { RefreshCw } from "lucide-react";

const NewsfeedPage = () => {
  const {
    posts,
    isLoading,
    hasMore,
    currentPage,
    getPosts,
    subscribeToPostUpdates,
    unsubscribeFromPostUpdates,
  } = usePostStore();
  const { t } = useLanguageStore();

  useEffect(() => {
    // Load initial posts
    getPosts(1);
    
    // Subscribe to real-time updates
    subscribeToPostUpdates();

    return () => {
      unsubscribeFromPostUpdates();
    };
  }, [getPosts, subscribeToPostUpdates, unsubscribeFromPostUpdates]);

  const loadMorePosts = useCallback(() => {
    if (!isLoading && hasMore) {
      getPosts(currentPage + 1);
    }
  }, [isLoading, hasMore, currentPage, getPosts]);

  const handleRefresh = () => {
    getPosts(1);
  };

  if (isLoading && posts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-base-100 rounded-lg shadow-md p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-base-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-base-300 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-base-300 rounded w-24"></div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-base-300 rounded"></div>
                <div className="h-4 bg-base-300 rounded w-3/4"></div>
              </div>
              <div className="h-48 bg-base-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("posts.newsfeed") || "Newsfeed"}</h1>
        <button
          onClick={handleRefresh}
          className="btn btn-ghost btn-circle"
          disabled={isLoading}
        >
          <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Create Post */}
      <CreatePost />

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={loadMorePosts}
            disabled={isLoading}
            className="btn btn-outline"
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {t("common.loading") || "Loading..."}
              </>
            ) : (
              t("posts.loadMore") || "Load More"
            )}
          </button>
        </div>
      )}

      {/* No more posts */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center mt-6 py-4">
          <p className="text-base-content/60">
            {t("posts.noMorePosts") || "You've reached the end!"}
          </p>
        </div>
      )}

      {/* No posts */}
      {posts.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-semibold mb-2">
            {t("posts.noPosts") || "No posts yet"}
          </h2>
          <p className="text-base-content/60">
            {t("posts.createFirstPost") || "Be the first to share something!"}
          </p>
        </div>
      )}
    </div>
  );
};

export default NewsfeedPage;
