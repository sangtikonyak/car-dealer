const path = require('node:path');

const apiPort = process.env.DRIVA_API_PORT ?? '3001';
const frontendPort = process.env.DRIVA_FRONTEND_PORT ?? '8083';

module.exports = {
  apps: [
    {
      name: 'driva-car-inv-api',
      cwd: path.join(__dirname, 'server'),
      script: 'npm',
      args: 'run start',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: apiPort,
      },
    },
    {
      name: 'driva-car-inv-frontend',
      cwd: path.join(__dirname, 'frontend'),
      script: 'npm',
      args: `run preview -- --host 127.0.0.1 --port ${frontendPort}`,
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
