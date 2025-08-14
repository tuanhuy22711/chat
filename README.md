# ✨ Chat App - Fullstack Social Platform ✨

## 📝 Tổng quan

Một ứng dụng chat toàn diện với tính năng mạng xã hội, được xây dựng với công nghệ hiện đại và tối ưu hóa hiệu suất.

## ✨ Tính năng chính

### 💬 Hệ thống Chat
- 🎯 **Tin nhắn realtime** với Socket.io
- 👥 **Chat nhóm** với quản lý thành viên
- 📸 **Chia sẻ hình ảnh** qua Cloudinary
- ✅ **Trạng thái đã đọc** tin nhắn
- 🟢 **Trạng thái online/offline** của người dùng
- 📞 **Video call** với Stream.io
- 🔔 **Thông báo realtime**

### 🤖 AI Assistant
- 💡 **Chatbot AI** với OpenAI & Google Gemini
- 🧠 **Nhiều mô hình AI**: GPT-3.5, GPT-4, Gemini Pro
- 💰 **Theo dõi chi phí** và thống kê sử dụng
- 🗂️ **Quản lý phiên chat** AI
- 🇻🇳 **Hỗ trợ tiếng Việt** mặc định

### 🔗 Rút gọn Link
- ⚡ **Rút gọn URL** với mã tùy chỉnh
- 📊 **Thống kê click** chi tiết
- ⏰ **Tự động hết hạn** (1h, 1d, 7d, 30d)
- 🏷️ **Metadata** tự động (title, description)
- 🚀 **Tích hợp trong chat** - tự động phát hiện URL dài

### 📱 Mạng xã hội
- 📰 **Newsfeed** với bài viết
- ❤️ **Reactions** và bình luận
- 📌 **Pin/Unpin** bài viết
- 🔄 **Chia sẻ** bài viết
- 🔔 **Hệ thống thông báo** đầy đủ

### 🛠️ Kỹ thuật
- 🌟 **Tech stack**: MERN + Socket.io + TailwindCSS + Daisy UI
- 🔐 **Authentication & Authorization** với JWT
- 🌐 **Đa ngôn ngữ** (English/Vietnamese)
- 🎨 **UI/UX hiện đại** với DaisyUI themes
- � **Responsive design** cho mobile
- ⚡ **Redis caching** để tối ưu hiệu suất
- 📊 **Monitoring** với Prometheus & Grafana Cloud
- 👌 **Global state management** với Zustand
- 🐞 **Error handling** toàn diện
- ⭐ **Production ready** với Docker

## �️ Kiến trúc hệ thống

### Backend Features
- **RESTful API** với Express.js
- **Real-time communication** với Socket.io
- **Database**: MongoDB với Mongoose ODM
- **File upload**: Cloudinary integration
- **Caching**: Redis với TTL strategies
- **Monitoring**: Prometheus metrics
- **AI Integration**: OpenAI & Google Gemini APIs
- **Video calling**: Stream.io integration

### Frontend Features  
- **React 18** với Hooks
- **State Management**: Zustand stores
- **Styling**: TailwindCSS + DaisyUI
- **Real-time updates**: Socket.io client
- **Image optimization**: Cloudinary transforms
- **Responsive design**: Mobile-first approach
- **Toast notifications**: React Hot Toast
- **Routing**: React Router v6

## ⚙️ Cài đặt và chạy ứng dụng

### 📋 Yêu cầu hệ thống
- Node.js 18+ 
- MongoDB 6+
- Redis 6+
- NPM hoặc Yarn

### 🔧 Cấu hình biến môi trường

Tạo file `.env` trong thư mục `backend`:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/chat-app

# Server
PORT=5001
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Redis (Cache & Sessions)
# Option 1: Single URL (Recommended for Redis Cloud)
REDIS_URL=redis://default:password@host:port

# Option 2: Separate fields
# REDIS_USERNAME=default
# REDIS_PASSWORD=your-password
# REDIS_HOST=localhost
# REDIS_PORT=6379

# CORS Origins (separated by commas)
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com

# AI Integration
AI_PROVIDER=openai
AI_MODEL=gpt-3.5-turbo
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.7
OPENAI_API_KEY=your-openai-api-key
GOOGLE_AI_API_KEY=your-gemini-api-key

# Stream.io (Video Calling)
STREAM_API_KEY=your-stream-api-key
STREAM_SECRET_KEY=your-stream-secret

# URL Shortener
BASE_URL=http://localhost:5001

# Monitoring (Optional)
GRAFANA_CLOUD_PROMETHEUS_URL=https://prometheus-xxx.grafana.net/api/prom/push
GRAFANA_CLOUD_PROMETHEUS_USERNAME=your-username
GRAFANA_CLOUD_PROMETHEUS_PASSWORD=your-api-key
```

### 🚀 Cài đặt và chạy

1. **Clone repository**
```bash
git clone <repository-url>
cd fullstack-chat-app
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Build ứng dụng**
```bash
npm run build
```

4. **Khởi chạy ứng dụng**
```bash
npm start
```

### 🔧 Development mode

1. **Chạy backend (terminal 1)**
```bash
cd backend
npm install
npm run dev
```

2. **Chạy frontend (terminal 2)**  
```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`
Backend API tại: `http://localhost:5001`

## 📊 Monitoring & Metrics

Ứng dụng tích hợp sẵn monitoring với:
- **Prometheus metrics**: `/metrics` endpoint
- **Health check**: `/health` endpoint  
- **Grafana Cloud**: Tự động push metrics
- **Redis monitoring**: Cache performance
- **Database metrics**: Query performance

## 🐳 Docker Deployment

```bash
# Build và chạy với Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

## 🤝 Đóng góp

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📝 License

Distributed under the ISC License. See `LICENSE` for more information.

## 👨‍💻 Tác giả

**Tran Tuan Huy** - Fullstack Developer

---

⭐ **Star** repository này nếu bạn thấy hữu ích!
