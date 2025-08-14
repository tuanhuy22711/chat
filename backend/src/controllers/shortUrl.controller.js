import ShortUrl from "../models/shortUrl.model.js";
import { cache, CACHE_KEYS, CACHE_TTL } from "../lib/redis.js";
import { metrics } from "../middleware/metrics.middleware.js";

// Shorten URL
export const shortenUrl = async (req, res) => {
  try {
    const userId = req.user._id;
    const { originalUrl, customCode, expiresIn } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: "URL là bắt buộc" });
    }

    // Validate URL
    try {
      new URL(originalUrl);
    } catch (error) {
      return res.status(400).json({ error: "URL không hợp lệ" });
    }

    // Check if URL already exists for this user
    const existingUrl = await ShortUrl.findOne({ 
      originalUrl, 
      userId, 
      isActive: true 
    });

    if (existingUrl) {
      return res.status(200).json({
        shortUrl: existingUrl.shortUrl,
        shortCode: existingUrl.shortCode,
        originalUrl: existingUrl.originalUrl,
        clicks: existingUrl.clicks,
        createdAt: existingUrl.createdAt,
        expiresAt: existingUrl.expiresAt,
      });
    }

    // Generate or use custom short code
    let shortCode;
    if (customCode) {
      // Check if custom code is available
      const existing = await ShortUrl.findOne({ shortCode: customCode, isActive: true });
      if (existing) {
        return res.status(400).json({ error: "Mã rút gọn này đã được sử dụng" });
      }
      shortCode = customCode;
    } else {
      shortCode = await ShortUrl.findAvailableShortCode();
    }

    // Set expiration
    let expiresAt = null;
    if (expiresIn) {
      const now = new Date();
      switch (expiresIn) {
        case '1h':
          expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
          break;
        case '1d':
          expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case '7d':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    // Extract metadata from URL
    const urlObj = new URL(originalUrl);
    const metadata = {
      domain: urlObj.hostname,
      createdVia: 'web'
    };

    // Try to fetch page title and description
    try {
      const response = await fetch(originalUrl, {
        method: 'GET',
        timeout: 5000,
        headers: {
          'User-Agent': 'ChatApp-LinkShortener/1.0'
        }
      });

      if (response.ok) {
        const html = await response.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const descMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\'][^>]*>/i);
        
        if (titleMatch) metadata.title = titleMatch[1].trim().substring(0, 200);
        if (descMatch) metadata.description = descMatch[1].trim().substring(0, 300);
      }
    } catch (error) {
      console.log('Could not fetch metadata for URL:', originalUrl);
    }

    const shortUrl = `${process.env.BASE_URL || 'http://localhost:5001'}/s/${shortCode}`;

    const newShortUrl = new ShortUrl({
      originalUrl,
      shortCode,
      shortUrl,
      userId,
      expiresAt,
      metadata,
    });

    await newShortUrl.save();

    // Update metrics
    metrics.messagesSent.inc({ type: 'url_shortened' });

    res.status(201).json({
      shortUrl: newShortUrl.shortUrl,
      shortCode: newShortUrl.shortCode,
      originalUrl: newShortUrl.originalUrl,
      clicks: newShortUrl.clicks,
      createdAt: newShortUrl.createdAt,
      expiresAt: newShortUrl.expiresAt,
      metadata: newShortUrl.metadata,
    });
  } catch (error) {
    console.error("Error in shortenUrl:", error.message);
    res.status(500).json({ error: "Lỗi server nội bộ" });
  }
};

// Redirect to original URL
export const redirectUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Try cache first
    const cacheKey = CACHE_KEYS.SHORT_URL(shortCode);
    let cachedUrl = await cache.get(cacheKey);

    if (!cachedUrl) {
      const shortUrl = await ShortUrl.findOne({ 
        shortCode, 
        isActive: true,
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      });

      if (!shortUrl) {
        return res.status(404).json({ error: "Link không tồn tại hoặc đã hết hạn" });
      }

      cachedUrl = shortUrl.originalUrl;
      // Cache for 1 hour
      await cache.set(cacheKey, cachedUrl, CACHE_TTL.LONG);
    }

    // Increment click count (async, don't wait)
    ShortUrl.findOneAndUpdate(
      { shortCode, isActive: true },
      { $inc: { clicks: 1 } }
    ).exec();

    // Update metrics
    metrics.messagesReceived.inc({ type: 'url_clicked' });

    res.redirect(301, cachedUrl);
  } catch (error) {
    console.error("Error in redirectUrl:", error.message);
    res.status(500).json({ error: "Lỗi server nội bộ" });
  }
};

// Get user's shortened URLs
export const getUserUrls = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const urls = await ShortUrl.find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await ShortUrl.countDocuments({ userId, isActive: true });

    res.status(200).json({
      urls,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
      total,
    });
  } catch (error) {
    console.error("Error in getUserUrls:", error.message);
    res.status(500).json({ error: "Lỗi server nội bộ" });
  }
};

// Get URL analytics
export const getUrlAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shortCode } = req.params;

    const shortUrl = await ShortUrl.findOne({ 
      shortCode, 
      userId, 
      isActive: true 
    });

    if (!shortUrl) {
      return res.status(404).json({ error: "Link không tìm thấy" });
    }

    res.status(200).json({
      shortCode: shortUrl.shortCode,
      shortUrl: shortUrl.shortUrl,
      originalUrl: shortUrl.originalUrl,
      clicks: shortUrl.clicks,
      createdAt: shortUrl.createdAt,
      expiresAt: shortUrl.expiresAt,
      metadata: shortUrl.metadata,
      isExpired: shortUrl.expiresAt && shortUrl.expiresAt < new Date(),
    });
  } catch (error) {
    console.error("Error in getUrlAnalytics:", error.message);
    res.status(500).json({ error: "Lỗi server nội bộ" });
  }
};

// Delete shortened URL
export const deleteUrl = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shortCode } = req.params;

    const shortUrl = await ShortUrl.findOneAndUpdate(
      { shortCode, userId },
      { isActive: false },
      { new: true }
    );

    if (!shortUrl) {
      return res.status(404).json({ error: "Link không tìm thấy" });
    }

    // Clear cache
    await cache.del(CACHE_KEYS.SHORT_URL(shortCode));

    res.status(200).json({ message: "Link đã được xóa thành công" });
  } catch (error) {
    console.error("Error in deleteUrl:", error.message);
    res.status(500).json({ error: "Lỗi server nội bộ" });
  }
};
