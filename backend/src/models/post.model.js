import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["like", "love", "laugh", "wow", "sad", "angry"],
    default: "like",
  },
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
    maxlength: 500,
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: null,
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
  }],
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    text: {
      type: String,
      maxlength: 2000,
    },
    images: [{
      type: String,
    }],
    videos: [{
      type: String,
    }],
    attachments: [{
      filename: String,
      url: String,
      fileType: String,
      fileSize: Number,
    }],
  },
  privacy: {
    type: String,
    enum: ["public", "friends", "private"],
    default: "public",
  },
  reactions: [reactionSchema],
  comments: [commentSchema],
  shares: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    sharedAt: {
      type: Date,
      default: Date.now,
    },
    originalPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  }],
  isPinned: {
    type: Boolean,
    default: false,
  },
  pinnedAt: {
    type: Date,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  editedAt: {
    type: Date,
  },
  originalPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    default: null, // For reposts/shares
  },
  postType: {
    type: String,
    enum: ["original", "shared", "repost"],
    default: "original",
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for reaction counts
postSchema.virtual("reactionCounts").get(function() {
  const counts = {
    like: 0,
    love: 0,
    laugh: 0,
    wow: 0,
    sad: 0,
    angry: 0,
    total: 0
  };
  
  this.reactions.forEach(reaction => {
    counts[reaction.type]++;
    counts.total++;
  });
  
  return counts;
});

// Virtual for comment count
postSchema.virtual("commentCount").get(function() {
  return this.comments.filter(comment => !comment.parentComment).length;
});

// Virtual for share count
postSchema.virtual("shareCount").get(function() {
  return this.shares.length;
});

// Index for better performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ privacy: 1, createdAt: -1 });
postSchema.index({ isPinned: 1, pinnedAt: -1 });

const Post = mongoose.model("Post", postSchema);

export default Post;
