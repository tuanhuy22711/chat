# Deployment Guide

## GitHub Secrets Configuration

Để sử dụng CI/CD pipeline, bạn cần thiết lập các secrets sau trong GitHub repository:

### Required Secrets

1. **VPS_HOST**: IP address hoặc domain của VPS
   ```
   Ví dụ: 192.168.1.100 hoặc your-domain.com
   ```

2. **VPS_USERNAME**: Username để SSH vào VPS
   ```
   Ví dụ: root hoặc ubuntu
   ```

3. **VPS_SSH_KEY**: Private SSH key để connect vào VPS
   ```
   Nội dung của file ~/.ssh/id_rsa (private key)
   ```

4. **VPS_PORT**: SSH port (optional, mặc định là 22)
   ```
   Ví dụ: 22 hoặc 2222
   ```

5. **APP_URL**: URL của ứng dụng sau khi deploy
   ```
   Ví dụ: https://your-domain.com hoặc http://your-ip:3000
   ```

## VPS Setup Requirements

### 1. Server Prerequisites
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx (optional, for serving static files)
sudo apt install nginx -y

# Install Git
sudo apt install git -y
```

### 2. Application Directory Setup
```bash
# Create app directory
sudo mkdir -p /var/www/chat-app
sudo chown $USER:$USER /var/www/chat-app

# Clone repository
cd /var/www/chat-app
git clone https://github.com/tuanhuy22711/fe-chat.git .

# Setup environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your configurations
```

### 3. Environment Variables
Tạo file `backend/.env` với nội dung:
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your-super-secret-jwt-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
REDIS_URL=redis://localhost:6379
```

### 4. Database Setup
```bash
# Install MongoDB
sudo apt install mongodb -y
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Install Redis
sudo apt install redis-server -y
sudo systemctl start redis
sudo systemctl enable redis
```

### 5. Nginx Configuration (Optional)
Tạo file `/etc/nginx/sites-available/chat-app`:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend static files
    location / {
        root /var/www/html/chat;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/chat-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Certificate (Optional but Recommended)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### 7. PM2 Ecosystem File
Tạo file `ecosystem.config.js` trong thư mục root:
```javascript
module.exports = {
  apps: [{
    name: 'chat-backend',
    script: './backend/src/index.js',
    cwd: '/var/www/chat-app',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

## Manual Deployment Steps

Nếu muốn deploy manually:

1. **Backend Deployment**:
```bash
cd /var/www/chat-app/backend
npm ci --production
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

2. **Frontend Deployment**:
```bash
cd /var/www/chat-app/frontend
npm ci
npm run build
sudo rsync -av --delete dist/ /var/www/html/chat/
```

## Troubleshooting

### Common Issues:

1. **Permission Denied**: Đảm bảo user có quyền write vào thư mục deploy
2. **Port Already in Use**: Kiểm tra process nào đang sử dụng port 5001
3. **Environment Variables**: Đảm bảo tất cả env vars được set đúng
4. **Database Connection**: Kiểm tra MongoDB và Redis đang chạy

### Useful Commands:
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs chat-backend

# Restart app
pm2 restart chat-backend

# Check Nginx status
sudo systemctl status nginx

# Check app health
curl http://localhost:5001/health
```

## GitHub Actions Secrets Setup

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret với tên và value tương ứng

### SSH Key Generation
```bash
# Generate SSH key pair on your local machine
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy public key to VPS
ssh-copy-id username@your-vps-ip

# Copy private key content to GitHub secret VPS_SSH_KEY
cat ~/.ssh/id_rsa
```
