// PM2 Ecosystem Configuration for MENUPI Digital Signage
// Usage: pm2 start ecosystem.config.js --env production

module.exports = {
  apps: [{
    name: 'menupi-api',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Auto-restart configuration
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Advanced PM2 features
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
};

