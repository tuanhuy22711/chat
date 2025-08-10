import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { useChatStore } from "../store/useChatStore";
import { ArrowLeft, MessageCircle, UserPlus, UserMinus, Calendar, Mail, MapPin, Link as LinkIcon } from "lucide-react";
import Avatar from "../components/Avatar";
import PostCard from "../components/PostCard";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { setSelectedUser } = useChatStore();
  const { t } = useLanguageStore();
  
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    fetchUserPosts();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/auth/profile/${userId}`);
      setUser(response.data);
      
      // Check if current user is following this user
      // This would require a followers system in the backend
      // For now, we'll just set it to false
      setIsFollowing(false);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to load user profile");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      const response = await axiosInstance.get(`/posts/user/${userId}`);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      toast.error("Failed to load user posts");
    } finally {
      setPostsLoading(false);
    }
  };

  const handleStartChat = async () => {
    // Set the selected user for chat
    setSelectedUser(user);
    
    // Navigate to home page to open chat
    navigate("/");
    
    // Optional: You could also pre-load messages here
    // const { getMessages } = useChatStore.getState();
    // await getMessages(user._id);
  };

  const handleFollowToggle = async () => {
    try {
      // This would require implementing follow/unfollow functionality
      // For now, just toggle the state locally
      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? "Unfollowed user" : "Following user");
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Failed to update follow status");
    }
  };

  const formatJoinDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-base-content mb-2">User not found</h2>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = authUser?._id === user._id;

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-ghost btn-circle"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-base-content">{user.fullName}</h1>
              <p className="text-sm text-base-content/70">@{user.email.split('@')[0]}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-base-100 rounded-lg shadow-sm p-6">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-shrink-0">
              <Avatar
                src={user.profilePic}
                alt={user.fullName}
                size="xl"
                className="w-24 h-24 md:w-32 md:h-32"
              />
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-base-content mb-2">
                    {user.fullName}
                  </h2>
                  <div className="flex items-center gap-2 text-base-content/70 mb-2">
                    <Mail size={16} />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-base-content/70">
                    <Calendar size={16} />
                    <span>Joined {formatJoinDate(user.createdAt)}</span>
                  </div>
                </div>
                
                {!isOwnProfile && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleStartChat}
                      className="btn btn-primary"
                    >
                      <MessageCircle size={18} />
                      Message
                    </button>
                    <button
                      onClick={handleFollowToggle}
                      className={`btn ${isFollowing ? 'btn-outline' : 'btn-secondary'}`}
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus size={18} />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus size={18} />
                          Follow
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio Section */}
          {user.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-base-content mb-2">Bio</h3>
              <p className="text-base-content/80">{user.bio}</p>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.location && (
              <div className="flex items-center gap-2 text-base-content/70">
                <MapPin size={16} />
                <span>{user.location}</span>
              </div>
            )}
            {user.website && (
              <div className="flex items-center gap-2 text-base-content/70">
                <LinkIcon size={16} />
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  {user.website}
                </a>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-6 pt-6 border-t border-base-300">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-base-content">{posts.length}</div>
                <div className="text-sm text-base-content/70">Posts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-base-content">0</div>
                <div className="text-sm text-base-content/70">Followers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-base-content">0</div>
                <div className="text-sm text-base-content/70">Following</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Posts Section */}
        <div className="bg-base-100 rounded-lg shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold text-base-content mb-4">
            {isOwnProfile ? "Your Posts" : `${user.fullName}'s Posts`}
          </h3>
          
          {postsLoading ? (
            <div className="text-center py-8">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-base-content/60">
              <p>{isOwnProfile ? "You haven't posted anything yet" : "No posts yet"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
