module.exports = {
  apps: [
    {
      name: 'posts-api',
      script: './dist/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2.log',
      time: true,
      instance_var: 'INSTANCE_ID',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M',
      watch: false,
    },
  ],
};
