# Driva pre-owned dealership application

An original premium pre-owned vehicle dealership interface with a Prisma/MySQL backend.

## Development

```bash
npm install
npm run dev
```

## MySQL configuration

Copy `server/.env.example` to `server/.env` and replace the placeholders with the
connection details used by your local MySQL server:

```env
NODE_ENV=development
PORT=8000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=replace_with_your_password
DB_NAME=car_dealership
```

MySQL Workbench is a client for managing the server. It does not need to stay open, but
the MySQL Server service must be running when the backend connects.

Validate the Prisma configuration and generate the client after creating `server/.env`:

```bash
npm run db:validate
npm run db:generate
npm run db:seed --workspace server
```

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm run format:check
```

## Frontend production build

The frontend production build requires a deployed API URL and generates SEO files in `frontend/dist`.
The build queries the public inventory endpoint to add published vehicle detail URLs to the sitemap,
so `VITE_API_BASE_URL` must be reachable during production builds. If the API is unavailable, the
build completes with only the static public routes in the sitemap.
Set these values in `frontend/.env.production` before building:

```env
VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_SITE_URL=https://www.example.com
```

Then run:

```bash
npm run build --workspace frontend
```

The production frontend build also runs a React server renderer and writes crawlable HTML to
`frontend/dist/index.html`, `frontend/dist/inventory/index.html`, the legal route directories, and
one directory for each published vehicle. The production server is `frontend/server.mjs`, which
serves those files, rechecks vehicle slugs against the inventory API, and returns HTTP 404 for
unknown routes. Do not deploy the development `VITE_API_BASE_URL` value.

## PM2 production deployment

This repository includes `ecosystem.config.cjs` for running a separate production instance beside
the existing deployment. It uses API port `3001` and frontend preview port `8083`; the existing
`inventory-api` and `inventory-frontend` processes on ports `3000` and `8082` are not modified.

Set the production values in `server/.env` and `frontend/.env.production` before building. The
frontend API URL must point to the public API address, while the server `CLIENT_URL` must point to
the public frontend address. Keep database credentials, admin credentials, and API keys out of the
PM2 configuration file.

Admin session cookies default to `Secure` in production and non-secure in development. For a
temporary IP-only HTTP deployment, set `ADMIN_SESSION_COOKIE_SECURE=false` in `server/.env`.
This allows login over HTTP but is not suitable for public production traffic because credentials
and sessions are not encrypted in transit.

```bash
npm ci
npm run db:migrate --workspace server
npm run build --workspace server
npm run build --workspace frontend
pm2 start ecosystem.config.cjs
pm2 save
pm2 status
```

If another service uses either new port, override them when starting PM2:

```bash
DRIVA_API_PORT=3010 DRIVA_FRONTEND_PORT=8090 pm2 start ecosystem.config.cjs
```

Configure the reverse proxy to send API requests to `http://127.0.0.1:3001` and frontend requests
to `http://127.0.0.1:8083` (or the overridden ports). Set `DRIVA_INVENTORY_API_URL` when the
frontend server needs a non-default internal inventory API URL.

## Nginx reverse proxy

The Nginx template is at `deploy/nginx/driva-car-inv.conf`. It proxies `/api/` and `/uploads/`
to the Driva API and all other paths to the PM2 frontend preview. It is configured for direct IP
access, the deployment path `/home/ubuntu/car-dealer/car-inv`, and the PM2 ports `3001` and `8083`.

Access the application at `http://SERVER_IP/`. This configuration uses Nginx's default port-80
server, so remove or change `default_server` if another Nginx site already owns the server's
default port-80 listener. Ports `3000` and `8082` belong to the existing PM2 deployment and are
not modified.

```bash
cd /home/ubuntu/car-dealer/car-inv
sudo cp deploy/nginx/driva-car-inv.conf /etc/nginx/sites-available/driva-car-inv
sudo ln -s /etc/nginx/sites-available/driva-car-inv /etc/nginx/sites-enabled/driva-car-inv
sudo nginx -t
sudo systemctl reload nginx
```

For IP-only access, set `VITE_API_BASE_URL=http://SERVER_IP/api/v1`,
`VITE_SITE_URL=http://SERVER_IP`, and `CLIENT_URL=http://SERVER_IP` before building. HTTPS with
Certbot requires a domain name and cannot be issued for a bare server IP.

The E2E suite requires a running local MySQL service with the Prisma migration applied and
seed data loaded. It covers admin login/session authorization, dynamic homepage and inventory
APIs, make/fuel settings, vehicle CRUD, strict validation, ordered custom label/value fields,
direct image-to-WebP uploads, filesystem serving/deletion/orphan cleanup, newsletter validation,
and the frontend API fallback/live-refetch boundary. The image fixture is
`test-image/e2e-car.jpg`.

## Admin workspace

Open `http://127.0.0.1:5173/admin/login` after seeding. Local development credentials come
from `server/.env` (`ADMIN_INITIAL_EMAIL` and `ADMIN_INITIAL_PASSWORD`) and should be replaced
before sharing the environment or deploying.

The admin workspace uses Homepage submenus for Overview, Brand & hero, Benefits, How it works,
FAQs, Showroom, and About. Each editable section has its own contextual save action (`Save brand &
hero`, `Save benefits`, `Save how it works`, `Save FAQ`, `Save showroom`, or `Save about`). The
public homepage refetches persisted content on initial load and when the browser tab regains focus.

Inventory is available at `/admin/inventory` with submenus for All vehicles, Add vehicle, Makes,
and Fuel types. Vehicle photos are selected directly in the editor, previewed before upload,
converted to high-quality WebP, and stored below the configured `UPLOAD_DIR` in an `inventory`
directory with UUID filenames. Additional vehicle details are label/value rows whose order is
persisted by drag and drop and rendered in that order on the public detail page. The homepage
latest-six section intentionally remains hardcoded.
