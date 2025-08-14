import mongoose from "mongoose";

const aiChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sessionId: {
    type: String,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  messages: [{
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  metadata: {
    model: {
      type: String,
      default: "gpt-3.5-turbo",
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    cost: {
      type: Number,
      default: 0,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { 
  timestamps: true 
});

// Index for better performance
aiChatSchema.index({ userId: 1, sessionId: 1 });
aiChatSchema.index({ userId: 1, createdAt: -1 });

const AIChat = mongoose.model("AIChat", aiChatSchema);

export default AIChat;
