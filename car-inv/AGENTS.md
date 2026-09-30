# AGENTS.md

## Project Purpose

This repository is a production-oriented car inventory application. It will use:

- Frontend: React, TypeScript, Vite, and Tailwind CSS.
- Backend: Node.js, Express, and TypeScript.
- Database: MySQL accessed only by the backend through Prisma ORM.
- Repository layout: `frontend/src/` and `server/src/`.

The initial implementation phase is boilerplate only. Do not add product features, authentication flows, inventory workflows, or speculative abstractions unless the user explicitly approves them.

## Required Development Workflow

For every coding task:

1. Inspect the repository and understand the requested scope.
2. Identify affected files, architectural impact, edge cases, and risks.
3. Present a concrete implementation plan before changing code.
4. Wait for explicit user approval of the plan.
5. Implement only the approved scope.
6. Run the relevant type checks, lint checks, tests, and builds.
7. Review the completed changes as a senior engineer and correct issues before handoff.

Do not create files, install dependencies, run migrations, or introduce architectural changes before approval. Preserve unrelated user changes in a dirty worktree.

## Target Repository Structure

```text
car-inv/
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- app/
|   |   |-- assets/
|   |   |-- components/
|   |   |-- config/
|   |   |-- features/
|   |   |-- hooks/
|   |   |-- lib/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- styles/
|   |   |-- types/
|   |   |-- utils/
|   |   |-- main.tsx
|   |   `-- vite-env.d.ts
|   |-- .env.example
|   |-- eslint.config.js
|   |-- index.html
|   |-- package.json
|   |-- tsconfig.json
|   `-- vite.config.ts
|-- server/
|   |-- prisma/
|   |   |-- migrations/
|   |   |-- schema.prisma
|   |   `-- seed.ts
|   |-- src/
|   |   |-- config/
|   |   |-- constants/
|   |   |-- errors/
|   |   |-- middlewares/
|   |   |-- modules/
|   |   |-- routes/
|   |   |-- types/
|   |   |-- utils/
|   |   |-- app.ts
|   |   `-- server.ts
|   |-- tests/
|   |   |-- integration/
|   |   `-- unit/
|   |-- .env.example
|   |-- eslint.config.js
|   |-- package.json
|   |-- tsconfig.json
|   `-- vitest.config.ts
|-- .editorconfig
|-- .gitignore
|-- package.json
|-- prettier.config.js
`-- README.md
```

Create only directories and files needed by the currently approved phase. Do not create placeholder files solely to make every directory appear.

## Repository and Tooling Rules

- Use npm workspaces from the repository root for `frontend` and `server`.
- Provide root scripts that delegate development, build, lint, type-check, and test tasks to each workspace.
- Keep frontend and backend dependency sets isolated in their respective packages.
- Use strict TypeScript settings. Do not use `any` unless an external boundary makes it unavoidable and the reason is documented.
- Use ESLint and Prettier consistently across both workspaces.
- Pin compatible dependency versions in lockfiles; do not depend on unbounded version ranges.
- Keep secrets out of source control. Commit `.env.example`, never populated `.env` files.
- Do not place backend code, database credentials, or server-only environment variables in the frontend.
- Avoid barrel exports when they create circular dependencies or obscure ownership.

## Frontend Architecture

### Core Principles

- Use React function components and hooks.
- Organize domain behavior by feature under `src/features/<feature>/`.
- Keep reusable, domain-neutral UI in `src/components/`.
- Keep route-level screens in `src/pages/` or within a feature's `pages/` directory when feature-owned.
- Keep application composition, providers, and router configuration in `src/app/`.
- Keep external HTTP access behind typed services or feature API modules.
- Never connect the browser directly to MySQL.
- Prefer composition over inheritance and small components over large multi-purpose components.
- Separate server state, client UI state, and form state rather than placing everything in global state.

### Frontend Directory Responsibilities

- `app/`: application shell, router, error boundaries, and global providers.
- `assets/`: imported images, fonts, and other bundled static assets.
- `components/`: reusable presentational and layout components with no feature-specific business rules.
- `config/`: validated public environment configuration and frontend constants.
- `features/`: vertically sliced domain modules containing feature API calls, components, hooks, schemas, types, and pages.
- `hooks/`: truly cross-feature React hooks.
- `lib/`: configured third-party clients such as the HTTP and query clients.
- `pages/`: top-level route pages that compose features.
- `services/`: cross-feature service boundaries only; prefer feature-local API modules otherwise.
- `styles/`: Tailwind entry CSS and global design tokens.
- `types/`: shared frontend-only types.
- `utils/`: pure, domain-neutral helpers.

### Frontend Data and Validation

- Use TanStack Query for remote server state, caching, retries, and invalidation.
- Use a single configured Axios client with a validated base URL and normalized error handling.
- Use Zod at untrusted boundaries such as environment variables, forms, URL inputs, and external API payloads when runtime validation is required.
- Keep API request and response types explicit. Do not duplicate backend Prisma model types in the frontend.
- Handle loading, empty, error, and success states deliberately.
- Add an application-level error boundary and a not-found route.

### Tailwind and UI Rules

- Use Tailwind CSS for application styling.
- Define shared colors, spacing, typography, and other design tokens centrally.
- Extract reusable components instead of repeatedly copying long class lists.
- Maintain keyboard accessibility, semantic HTML, visible focus states, and sufficient color contrast.
- Ensure layouts are responsive from mobile through desktop.
- Do not add a separate component framework unless explicitly approved.

## Backend Architecture

### Architectural Pattern

Use a modular Clean Architecture flow:

```text
Route -> Validation Middleware -> Controller -> Service -> Repository -> Prisma -> MySQL
```

Dependencies must point inward through these boundaries. Controllers must not query Prisma, repositories must not know about Express, and routes must not contain business logic.

### Backend Layer Responsibilities

- Routes: declare endpoints and compose validation, authentication, authorization, and rate-limit middleware.
- Controllers: translate HTTP input to typed service calls and translate service results to standardized responses.
- Services: own business rules, use cases, transaction coordination, and domain-level decisions.
- Repositories: own all Prisma queries and persistence mapping.
- Schemas: validate request body, route parameters, and query strings with strict Zod schemas.
- DTOs: define explicit typed input and output boundaries between layers.
- Config: validate environment variables and configure database, logging, CORS, and other infrastructure.
- Middlewares: implement cross-cutting HTTP concerns only.
- Errors: define operational error classes and stable machine-readable error codes.
- Utilities: contain small cross-cutting helpers without business rules.

### Feature Module Convention

Each backend domain module belongs in `server/src/modules/<feature>/` and should use the following names as needed:

```text
<feature>.routes.ts
<feature>.controller.ts
<feature>.service.ts
<feature>.repository.ts
<feature>.schema.ts
<feature>.dto.ts
<feature>.types.ts
```

Do not generate every file automatically when a module does not need it. Keep module internals private unless another module has an explicit, approved dependency on a public service contract.

### Express Bootstrap

- `app.ts` constructs and configures the Express application without opening a network port.
- `server.ts` validates startup dependencies, connects to MySQL through Prisma, starts the HTTP server, and handles graceful shutdown.
- Register middleware in a deliberate order: request ID, request logging, security headers, CORS, parsers, global rate limiting, application routes, not-found middleware, then global error middleware.
- Disable `x-powered-by`.
- Apply Helmet globally.
- Use an environment-configured CORS allow-list rather than an unrestricted production origin.
- Limit request body sizes.
- Use a global rate limiter and tighter endpoint-specific limiters where risk requires them.

### Environment Configuration

- Validate all environment variables with Zod before the server starts.
- Fail fast with a clear error when required configuration is missing or invalid.
- At minimum, account for `NODE_ENV`, `PORT`, `DATABASE_URL`, `CLIENT_URL`, log level, and rate-limit configuration.
- Require `DATABASE_URL` to use the MySQL protocol.
- Never expose credentials or secret values in logs or API responses.

### Database and Prisma

- Use Prisma ORM with a MySQL datasource.
- Access Prisma only through repositories, except for infrastructure-level connection and health checks.
- Prefer Prisma's typed query APIs. Raw SQL requires explicit justification and parameterization.
- Use migrations for every schema change; never rely on manual production schema edits.
- Use transactions for multi-write operations that must succeed or fail atomically.
- Define indexes and unique constraints based on query and integrity requirements.
- Store timestamps consistently and make timezone handling explicit.
- Keep seed behavior deterministic and safe for development environments.
- Connect before accepting traffic and disconnect during graceful shutdown.

## API Design

- Prefix application endpoints consistently, for example `/api/v1`.
- Provide a health endpoint that can distinguish application liveness from database readiness when required.
- Use resource-oriented routes and correct HTTP verbs and status codes.
- Validate body, parameters, and query input before controller execution.
- Reject unknown request fields where practical.
- Implement consistent pagination, filtering, and sorting contracts for collections.
- Avoid leaking database or internal implementation details through API responses.

### Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {},
  "meta": {
    "requestId": "uuid"
  }
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  },
  "meta": {
    "requestId": "uuid"
  }
}
```

Every response must keep its body `statusCode` aligned with the HTTP status and include the request ID when a request context exists.

## Error Handling

- Use operational error classes derived from a common `AppError` base.
- Use stable error codes suitable for frontend branching and observability.
- Wrap asynchronous controllers with a shared async handler; do not repeat controller-level `try/catch` blocks.
- Map Zod validation errors and known Prisma errors to safe application errors.
- Treat unknown errors as internal server errors and avoid returning stack traces in production.
- The global error middleware must be the final Express middleware.
- Log unexpected errors once, with request context, without logging credentials or sensitive payloads.

## Logging and Observability

- Use Winston structured JSON logging on the backend.
- Generate or accept a safe correlation ID for each request and return it in the response.
- Log request start and completion with method, normalized path, status, latency, and request ID.
- Do not log passwords, tokens, cookies, authorization headers, database URLs, or unnecessary personal data.
- Keep human-readable development logging separate from structured production output where appropriate.

## Security Requirements

- Treat all client input as untrusted.
- Use strict Zod schemas and typed Prisma filters to prevent malformed input and injection.
- Never concatenate user input into SQL.
- Apply authentication and authorization separately when those features are approved.
- Hash passwords with an approved adaptive password-hashing algorithm when authentication is implemented.
- Store authentication secrets only in backend environment configuration.
- Apply secure cookie attributes if cookie authentication is later selected.
- Protect sensitive mutations against relevant CSRF risks when cookie authentication is used.
- Use generic authentication errors that do not reveal whether an account exists.
- Keep dependencies reviewed and avoid unnecessary production packages.

## Testing Strategy

- Use Vitest for unit tests in both TypeScript workspaces where practical.
- Use React Testing Library for component behavior.
- Use Supertest for Express integration tests without requiring a separately started server.
- Unit-test services with repository dependencies mocked or substituted.
- Integration-test routing, validation, middleware ordering, response contracts, and error mapping.
- Keep database integration tests isolated and deterministic; never point automated tests at production data.
- Test normal behavior plus invalid input, missing resources, duplicate conflicts, boundary values, and unexpected dependency failures.
- Do not make tests pass by weakening assertions, swallowing errors, or disabling type safety.

### Mandatory edge-to-edge E2E coverage

Every approved product change must be tested from the browser-facing boundary through the API, service, repository, database, filesystem, and back to the rendered UI. Happy-path tests alone are not sufficient.

- Add or update a dedicated E2E test for every changed route and user-visible flow. Run the backend suite with `npm run test:e2e --workspace server` (or `npm run test:e2e` from the repository root).
- Run E2E tests only against a local, migrated, seeded development/test database. Never point them at production data. Any test that mutates persistent content must snapshot and restore the original state in teardown.
- For homepage content changes, cover public reads, authenticated admin reads/writes, strict unknown-field rejection, unsafe-link rejection, missing/empty collections, maximum collection boundaries, active/inactive filtering, persistence after a fresh read, and API failure fallback in the frontend.
- When homepage editing is split into section-level saves, verify Brand/Hero, Benefits, and FAQ saves update only their own persistence areas, preserve unsaved changes in other sections, expose independent loading/success/error states, and appear in the public homepage after a fresh load or focus refetch.
- Use contextual homepage save labels: `Save brand & hero`, `Save benefits`, `Save FAQ`, `Save showroom`, `Save about`, `Save booking CTA`, and `Save footer`.
- For authentication changes, cover valid and invalid login, strict credential validation, generic auth errors, rate limits, secure cookie attributes, session persistence across requests, expiry/revocation, logout, inactive users, malformed cookies, direct unauthenticated access, and CORS credential behavior.
- For configurable homepage icons, exercise every supported icon key, the configured maximum item count, invalid keys, and the frontend fallback for an unknown key. Verify the six latest listings remain unchanged and hardcoded when homepage content changes.
- For media changes, use an internet-downloaded fixture stored under `test-image/`. Cover successful JPEG/PNG/WebP uploads, rotation/resizing, WebP output, filesystem persistence, static serving, deletion, missing files, missing multipart fields, unsupported MIME types, corrupt image bytes, and the configured size limit. Confirm failed uploads leave no orphaned files or database rows.
- For newsletter or other public forms, cover normalization, valid submission, duplicate/idempotent submission, invalid values, empty input, and rejected unknown fields.
- Verify standardized status codes, response envelopes, request IDs, security headers, CORS behavior, and safe error messages on both success and failure paths.
- After API E2E tests, run a live browser smoke test with frontend and backend servers running. Verify loading, empty, error/fallback, and success states, keyboard-accessible controls, dynamic sections, media URLs, and the invariant hardcoded content. Check browser console/network errors before declaring the change complete.
- Record the exact fixture paths, commands, and any environment prerequisites in the handoff. Do not delete user-requested test fixtures or generated upload artifacts without explicit approval.

## Naming and Code Quality

- Use `PascalCase` for React components and classes.
- Use `camelCase` for variables and functions.
- Use descriptive kebab-case or established suffix-based filenames consistently.
- Prefer named exports for reusable modules; default exports are acceptable for framework entry points where they improve clarity.
- Keep functions focused and avoid hidden side effects.
- Prefer dependency injection at service boundaries so business logic can be tested independently.
- Remove dead code and commented-out implementations.
- Add comments only when they explain intent, constraints, or non-obvious tradeoffs.
- Avoid premature generalization. Implement the simplest design that preserves the approved boundaries.

## Dependency Rules

- New production dependencies require an explanation in the implementation plan.
- Prefer maintained, well-understood packages with strong TypeScript support.
- Do not add overlapping packages that solve the same concern.
- Keep runtime dependencies separate from development dependencies.
- Verify frontend packages do not import Node-only modules.
- Verify backend packages do not depend on frontend implementation details.

## Initial Boilerplate Scope

When the user approves boilerplate creation, limit the initial scaffold to:

- Root npm workspace and shared formatting configuration.
- React, TypeScript, Vite, and Tailwind frontend bootstrap.
- Frontend application shell, providers, router, not-found page, API client foundation, and basic test setup.
- Node.js, Express, and TypeScript backend bootstrap.
- Validated environment configuration.
- Prisma configured for MySQL without speculative domain models.
- Security, request ID, request logging, validation, not-found, and global error middleware.
- Standard response helpers and error classes.
- Versioned route registration and health endpoints.
- Unit and integration test foundations.
- `.env.example`, `.gitignore`, scripts, and setup documentation.

Do not implement vehicle CRUD, user management, login, authorization, file uploads, dashboards, or other business features as part of the boilerplate unless separately planned and approved.

## Completion Criteria

A change is complete only when all applicable checks pass:

- Dependencies install from the committed lockfile.
- Frontend and backend type checks pass with strict TypeScript.
- Lint and formatting checks pass.
- Unit and integration tests pass.
- The dedicated edge-to-edge E2E suite passes against a migrated and seeded local database.
- A live browser smoke test passes for every changed user-visible flow, including success, empty, validation-error, and API-unavailable states.
- Production builds pass.
- Environment validation fails safely for invalid configuration.
- The backend starts only after required infrastructure checks succeed.
- Health endpoints return the documented contract.
- Error and success responses follow the standard response shape.
- No secret or populated environment file is committed.
- No controller accesses Prisma directly.
- No frontend code attempts direct database access.
- Documentation reflects any changed setup commands or environment variables.

## Inventory CMS validation additions

The dynamic inventory phase adds the following required E2E checks to `server/tests/e2e/inventory.e2e.test.ts`:

- Lookup CRUD and duplicate/invalid conflict handling for makes and fuel types.
- Authenticated vehicle create/read/update/delete with strict unknown-field rejection.
- Ordered label/value custom fields, including persistence on the public vehicle detail page.
- Browser smoke coverage of the admin drag handles: reorder custom fields with mouse/touch and
  keyboard sensors, verify the order survives Save vehicle, and confirm the public detail page
  renders the same order. Photo handles must show the same sortable affordance and persist through
  the photo-order endpoint; separate photo and custom-field drag contexts must not cross-reorder.
- Direct multipart image uploads using `test-image/e2e-car.jpg`, WebP conversion, UUID storage under `UPLOAD_DIR/inventory`, static serving, ordering, deletion, invalid bytes, and orphan cleanup.
- Public filtering from database-backed make/fuel options and not-found behavior.

Run the complete local validation after applying migrations and seeding:

```bash
npx prisma migrate deploy --schema server/prisma/schema.prisma
npm run db:seed --workspace server
npm run test:e2e --workspace server
npm test --workspace frontend
npm run build --workspace frontend
```

For a live browser smoke check, run both local servers, open `/admin/inventory`, open a vehicle
editor, and verify the visible `Drag the handle...` guidance plus the accessible drag-handle buttons.
Exercise keyboard sorting with Space, ArrowUp/ArrowDown, and Space, then reload the public vehicle
detail route to verify the persisted order.

The public inventory routes are `/api/v1/inventory`, `/api/v1/inventory/options`, and
`/api/v1/inventory/:slug`. Admin vehicle, lookup, and photo mutations are under
`/api/v1/admin/inventory` and require the existing admin session or `x-admin-api-key`.

## Code Review Rules

- Flag any bypass of route -> controller -> service -> repository boundaries.
- Flag business logic in routes, controllers, middleware, or repositories.
- Flag direct Prisma usage outside repositories and approved infrastructure checks.
- Flag unvalidated request input or public environment variables.
- Flag inconsistent status codes or API response contracts.
- Flag missing error-path tests for new behavior.
- Flag secrets, sensitive logging, unsafe CORS, unrestricted payload sizes, or raw SQL built from user input.
- Flag frontend components that mix data access, business rules, and complex presentation without a clear reason.
- Flag breaking API or database changes that lack explicit migration and compatibility planning.
