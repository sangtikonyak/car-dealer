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
      args: 'run serve',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: frontendPort,
        DRIVA_INVENTORY_API_URL:
          process.env.DRIVA_INVENTORY_API_URL ?? `http://127.0.0.1:${apiPort}/api/v1`,
      },
    },
  ],
};
