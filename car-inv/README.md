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
Set these values in `frontend/.env.production` before building:

```env
VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_SITE_URL=https://www.example.com
```

Then run:

```bash
npm run build --workspace frontend
```

Configure the static host to serve `frontend/dist/index.html` for unknown application routes so
browser refreshes work for `/inventory`, vehicle details, and legal pages. Do not deploy the
development `VITE_API_BASE_URL` value.

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
