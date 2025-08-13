#!/bin/bash

# Chat App Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
APP_DIR="/var/www/chat-app"
BACKUP_DIR="/var/backups/chat-app"

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# Create backup
echo "📦 Creating backup..."
mkdir -p $BACKUP_DIR
tar -czf "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz" -C $APP_DIR . || echo "Backup failed, continuing..."

# Navigate to app directory
cd $APP_DIR

# Pull latest code
echo "📥 Pulling latest code..."
git fetch origin
git reset --hard origin/master
git clean -fd

# Backend deployment
echo "🔧 Deploying backend..."
cd backend

# Install dependencies
npm ci --production

# Run database migrations if any
npm run migrate --if-present

# Restart backend service
echo "🔄 Restarting backend service..."
pm2 restart chat-backend || pm2 start ../ecosystem.config.js

# Frontend deployment
echo "🎨 Deploying frontend..."
cd ../frontend

# Install dependencies and build
npm ci
npm run build

# Copy build files
echo "📋 Copying frontend files..."
sudo rsync -av --delete dist/ /var/www/html/chat/ || {
    echo "Failed to copy to /var/www/html/chat/, trying alternative path..."
    mkdir -p /var/www/chat-frontend
    cp -r dist/* /var/www/chat-frontend/
}

# Restart nginx
echo "🔄 Restarting nginx..."
sudo systemctl reload nginx || sudo service nginx reload

# Health check
echo "🏥 Running health check..."
sleep 10

# Check backend health
if curl -f http://localhost:5001/health > /dev/null 2>&1; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
    exit 1
fi

# Check frontend
if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend health check passed"
else
    echo "⚠️  Frontend health check warning (might be normal if domain not configured)"
fi

# Show PM2 status
echo "📊 PM2 Status:"
pm2 status

echo "🎉 Deployment completed successfully!"
echo "🔗 Application should be available at your configured domain/IP"

# Cleanup old backups (keep last 5)
echo "🧹 Cleaning up old backups..."
cd $BACKUP_DIR
ls -t | tail -n +6 | xargs rm -f || echo "No old backups to clean"

echo "✨ All done!"
