import mongoose from "mongoose";

const urlSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Please provide a valid URL'
      }
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    shortUrl: {
      type: String,
      required: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null, 
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      title: String,
      description: String,
      domain: String,
      createdVia: {
        type: String,
        enum: ['web', 'api', 'mobile'],
        default: 'web'
      }
    }
  },
  { timestamps: true }
);

// Index for expiration
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate short code
urlSchema.statics.generateShortCode = function(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

urlSchema.statics.findAvailableShortCode = async function() {
  let shortCode;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    shortCode = this.generateShortCode();
    const existing = await this.findOne({ shortCode, isActive: true });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {

    shortCode = this.generateShortCode(8);
  }

  return shortCode;
};

const ShortUrl = mongoose.model("ShortUrl", urlSchema);

export default ShortUrl;
