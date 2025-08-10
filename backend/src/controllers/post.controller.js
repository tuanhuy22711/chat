import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io, getReceiverSocketId } from "../lib/socket.js";
import { createNotification } from "./notification.controller.js";

// Get newsfeed posts
export const getNewsfeed = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get posts from user and their friends (simplified for now - just public posts)
    const posts = await Post.find({
      $or: [
        { author: userId },
        { privacy: "public" }
      ]
    })
    .populate("author", "fullName profilePic")
    .populate("reactions.user", "fullName profilePic")
    .populate("comments.user", "fullName profilePic")
    .populate("shares.user", "fullName profilePic")
    .populate("originalPost")
    .sort({ isPinned: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

    res.status(200).json({
      posts,
      currentPage: page,
      hasMore: posts.length === limit
    });
  } catch (error) {
    console.error("Error in getNewsfeed: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get user posts
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get posts from specific user
    const query = { author: userId };
    
    // If not viewing own profile, only show public posts
    if (userId !== currentUserId.toString()) {
      query.privacy = "public";
    }

    const posts = await Post.find(query)
      .populate("author", "fullName profilePic")
      .populate("reactions.user", "fullName profilePic")
      .populate("comments.user", "fullName profilePic")
      .populate("shares.user", "fullName profilePic")
      .populate("originalPost")
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      posts,
      currentPage: page,
      hasMore: posts.length === limit
    });
  } catch (error) {
    console.error("Error in getUserPosts: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create new post
export const createPost = async (req, res) => {
  try {
    const { text, images, videos, privacy = "public" } = req.body;
    const authorId = req.user._id;

    if (!text && (!images || images.length === 0) && (!videos || videos.length === 0)) {
      return res.status(400).json({ error: "Post must have text, images, or videos" });
    }

    let imageUrls = [];
    let videoUrls = [];

    // Upload images to cloudinary
    if (images && images.length > 0) {
      for (const image of images) {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          resource_type: "image"
        });
        imageUrls.push(uploadResponse.secure_url);
      }
    }

    // Upload videos to cloudinary
    if (videos && videos.length > 0) {
      for (const video of videos) {
        const uploadResponse = await cloudinary.uploader.upload(video, {
          resource_type: "video"
        });
        videoUrls.push(uploadResponse.secure_url);
      }
    }

    const newPost = new Post({
      author: authorId,
      content: {
        text,
        images: imageUrls,
        videos: videoUrls,
      },
      privacy,
    });

    await newPost.save();

    // Populate the post before sending response
    const populatedPost = await Post.findById(newPost._id)
      .populate("author", "fullName profilePic")
      .populate("reactions.user", "fullName profilePic")
      .populate("comments.user", "fullName profilePic");

    // Emit to all connected users except the author (for public posts)
    if (privacy === "public") {
      // Broadcast to all users except the author
      io.emit("newPost", populatedPost);
      
      // Create notifications for all users except the author
      // In a real app, you'd want to only notify friends/followers
      const allUsers = await User.find({ _id: { $ne: authorId } }, '_id');
      
      // Create notifications for a limited number of users to avoid spam
      // In production, you'd implement a proper follower system
      const notificationPromises = allUsers.slice(0, 10).map(user => 
        createNotification({
          recipient: user._id,
          sender: authorId,
          type: "post",
          title: "New Post",
          message: `${populatedPost.author.fullName} shared a new post`,
          data: {
            postId: newPost._id,
            userId: authorId,
          },
        })
      );
      
      await Promise.all(notificationPromises);
    }

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error("Error in createPost: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Edit post
export const editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text, privacy } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user is the author
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only edit your own posts" });
    }

    // Update post
    post.content.text = text || post.content.text;
    post.privacy = privacy || post.privacy;
    post.isEdited = true;
    post.editedAt = new Date();

    await post.save();

    const populatedPost = await Post.findById(postId)
      .populate("author", "fullName profilePic")
      .populate("reactions.user", "fullName profilePic")
      .populate("comments.user", "fullName profilePic");

    // Emit update to all users
    io.emit("postUpdated", populatedPost);

    res.status(200).json(populatedPost);
  } catch (error) {
    console.error("Error in editPost: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete post
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user is the author
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only delete your own posts" });
    }

    await Post.findByIdAndDelete(postId);

    // Emit deletion to all users
    io.emit("postDeleted", postId);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error in deletePost: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add reaction to post
export const addReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const { type = "like" } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user already reacted
    const existingReactionIndex = post.reactions.findIndex(
      reaction => reaction.user.toString() === userId.toString()
    );

    if (existingReactionIndex !== -1) {
      // Update existing reaction
      post.reactions[existingReactionIndex].type = type;
    } else {
      // Add new reaction
      post.reactions.push({ user: userId, type });
    }

    await post.save();

    const populatedPost = await Post.findById(postId)
      .populate("author", "fullName profilePic")
      .populate("reactions.user", "fullName profilePic");

    // Emit reaction update
    io.emit("postReactionUpdated", {
      postId,
      reactions: populatedPost.reactions,
      reactionCounts: populatedPost.reactionCounts
    });

    res.status(200).json(populatedPost);
  } catch (error) {
    console.error("Error in addReaction: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Remove reaction from post
export const removeReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Remove user's reaction
    post.reactions = post.reactions.filter(
      reaction => reaction.user.toString() !== userId.toString()
    );

    await post.save();

    const populatedPost = await Post.findById(postId)
      .populate("reactions.user", "fullName profilePic");

    // Emit reaction update
    io.emit("postReactionUpdated", {
      postId,
      reactions: populatedPost.reactions,
      reactionCounts: populatedPost.reactionCounts
    });

    res.status(200).json(populatedPost);
  } catch (error) {
    console.error("Error in removeReaction: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add comment to post
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text, parentCommentId } = req.body;
    const userId = req.user._id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const newComment = {
      user: userId,
      text: text.trim(),
      parentComment: parentCommentId || null,
    };

    post.comments.push(newComment);
    await post.save();

    const populatedPost = await Post.findById(postId)
      .populate("comments.user", "fullName profilePic");

    // Emit comment update
    io.emit("postCommentAdded", {
      postId,
      comments: populatedPost.comments,
      commentCount: populatedPost.commentCount
    });

    res.status(200).json(populatedPost);
  } catch (error) {
    console.error("Error in addComment: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Pin/Unpin post
export const togglePinPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user is the author
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only pin your own posts" });
    }

    post.isPinned = !post.isPinned;
    post.pinnedAt = post.isPinned ? new Date() : null;

    await post.save();

    const populatedPost = await Post.findById(postId)
      .populate("author", "fullName profilePic");

    // Emit pin update
    io.emit("postPinUpdated", populatedPost);

    res.status(200).json(populatedPost);
  } catch (error) {
    console.error("Error in togglePinPost: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Share post
export const sharePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const originalPost = await Post.findById(postId);
    if (!originalPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Create new shared post
    const sharedPost = new Post({
      author: userId,
      content: {
        text: text || "",
      },
      originalPost: postId,
      postType: "shared",
      privacy: "public",
    });

    await sharedPost.save();

    // Add share to original post
    originalPost.shares.push({
      user: userId,
      sharedAt: new Date(),
      originalPost: postId,
    });

    await originalPost.save();

    const populatedSharedPost = await Post.findById(sharedPost._id)
      .populate("author", "fullName profilePic")
      .populate("originalPost")
      .populate({
        path: "originalPost",
        populate: {
          path: "author",
          select: "fullName profilePic"
        }
      });

    // Emit new shared post
    io.emit("newPost", populatedSharedPost);

    res.status(201).json(populatedSharedPost);
  } catch (error) {
    console.error("Error in sharePost: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
