# ✨ Chat App - Fullstack Realtime Messaging ✨

Highlights:

- 🌟 Tech stack: MERN + Socket.io + TailwindCSS + Daisy UI
- 🎃 Authentication && Authorization with JWT
- 👾 Real-time messaging with Socket.io
- 🚀 Online user status
- 🌐 Multi-language support (English/Vietnamese)
- 👌 Global state management with Zustand
- 🎨 Beautiful avatar system with fallbacks
- 🐞 Error handling both on the server and on the client
- ⭐ Professional deployment ready
- ⏳ And much more!

### Setup .env file

```js
MONGODB_URI=...
PORT=5001
JWT_SECRET=...

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Redis (choose one style)
# 1) Single URL style (recommended for Redis Cloud):
REDIS_URL=redis://default:password@host:port

# 2) Separate fields style:
# REDIS_USERNAME=default
# REDIS_PASSWORD=...
# REDIS_HOST=...
# REDIS_PORT=15228

# Comma-separated list of allowed origins for CORS (Express & Socket.io)
# Example:
# CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
CORS_ORIGINS=

NODE_ENV=development
```

### Build the app

```shell
npm run build
```

### Start the app

```shell
npm start
```
