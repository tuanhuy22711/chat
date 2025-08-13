module.exports = {
  apps: [
    {
      name: 'chat-backend',
      script: './backend/src/index.js',
      cwd: '/var/www/chat-app',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      
      // Logging
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      
      // Auto restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Environment specific settings
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-server-ip',
      ref: 'origin/master',
      repo: 'https://github.com/tuanhuy22711/fe-chat.git',
      path: '/var/www/chat-app',
      'pre-deploy-local': '',
      'post-deploy': 'cd backend && npm ci --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
