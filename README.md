# Concert Reservation System

Small full-stack concert reservation system built for the Data Wow assignment.

## Stack

- Frontend: Next.js App Router, React 19, Tailwind CSS 4, local auth session state
- Backend: NestJS, JWT auth, class-validator, Prisma
- Database: PostgreSQL
- Infra: Docker Compose

## Features

- Register and login with JWT authentication
- Admin dashboard with concert creation, deletion, seat summary cards, and global reservation history
- User dashboard with concert browsing, reserve, cancel, and personal reservation history
- Reservation protection against overbooking using a serializable transaction and row lock
- One active reservation per user per concert
- Seeded demo accounts and sample concerts

## Demo Accounts

- Admin: `admin` / `admin123`
- User: `sarajohn` / `user1234`

## Project Structure

```text
.
├── backend
├── frontend
├── docker-compose.yml
└── Test_Full_Stack_Developer__v_17_Feb_.md
```

## Local Development

### 1. Configure environment variables

Copy these files and adjust values if needed:

- `backend/.env.example` -> `backend/.env`
- `frontend/.env.example` -> `frontend/.env.local`

### 2. Start PostgreSQL

You can use a local PostgreSQL instance or Docker:

```bash
docker compose up postgres -d
```

### 3. Start the backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

Backend runs on `http://localhost:3001` and exposes APIs under `http://localhost:3001/api`.

Health endpoint:

```bash
GET http://localhost:3001/api/health
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Docker Compose

Run the full stack with:

```bash
docker compose up --build
```

This starts:

- PostgreSQL on port `5432`
- NestJS backend on port `3001`
- Next.js frontend on port `3000`

The backend container automatically runs Prisma migrations and the idempotent seed script on startup.

## Test Commands

Backend unit tests:

```bash
cd backend
npm test
```

Backend e2e smoke test:

```bash
cd backend
npm run test:e2e
```

Frontend production build:

```bash
cd frontend
npm run build
```

## Architecture

```text
Browser ──► Next.js (port 3000)
              │  SSR + Client Components
              │  Auth state in localStorage
              ▼
           NestJS (port 3001)
              │  JWT auth, ValidationPipe, role guards
              │  Global prefix /api
              ▼
           PostgreSQL (port 5432)
              │  Prisma ORM + migrations
              │  Row-level locking for reservations
```

- **Frontend** uses Next.js App Router with client components for the dashboard. Auth token is stored in `localStorage` and attached via `Authorization: Bearer` header on every API call. `AuthProvider` wraps all protected routes and redirects to `/login` on 401.
- **Backend** uses NestJS modules: `AuthModule` (JWT issue/verify), `ConcertModule` (CRUD), `ReservationModule` (reserve/cancel with row lock). A global `JwtAuthGuard` protects all routes except those marked `@Public()`. `RolesGuard` restricts admin-only endpoints.
- **Database** uses Prisma ORM with a single migration. Reservation uniqueness is enforced at DB level with `@@unique([userId, concertId])`. Overbooking prevention uses `RepeatableRead` isolation + `SELECT ... FOR UPDATE` row lock + automatic retry with exponential backoff (up to 10 retries) for serialization conflicts.

## Libraries Used

### Backend

| Library | Purpose |
|---------|---------|
| `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express` | NestJS framework core |
| `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt` | JWT authentication strategy |
| `@prisma/client`, `prisma` | PostgreSQL ORM with type-safe queries and migrations |
| `bcryptjs` | Password hashing (bcrypt) |
| `class-validator`, `class-transformer` | DTO validation with decorators |
| `jest`, `ts-jest`, `@nestjs/testing` | Unit and e2e testing |

### Frontend

| Library | Purpose |
|---------|---------|
| `next` | React framework with App Router, SSR, file-based routing |
| `react`, `react-dom` | UI rendering |
| `tailwindcss` | Utility-first CSS framework for responsive layout |
| Custom CSS (`globals.css`) | Design system tokens, sidebar, modal, toast, tab animations |

## Overbooking Prevention

- Transaction uses `RepeatableRead` isolation level (not `Serializable` — reduces abort rate under high contention).
- The target concert row is locked with `SELECT ... FOR UPDATE` before counting reserved seats.
- If the transaction fails due to serialization conflict (`P2034`), it retries up to 10 times with exponential backoff + random jitter.
- A composite unique constraint on `(userId, concertId)` ensures one reservation record per pair.
- Only `RESERVED` status counts against seat capacity.
- **Proven by test**: 10,000 concurrent users competing for 2,000 seats — zero overbooking, zero 500 errors.

## Main API Endpoints

### Public

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/health`

### Authenticated

- `GET /api/auth/me`
- `GET /api/concerts`
- `POST /api/reservations`
- `DELETE /api/reservations/:concertId`
- `GET /api/reservations/history`

### Admin only

- `GET /api/concerts/stats`
- `POST /api/concerts`
- `DELETE /api/concerts/:id`
- `GET /api/reservations/history/all`

## Bonus Opinions

### 1. How to optimize the website under intensive data and concurrent access

**Caching layer**: Put Redis in front of read-heavy endpoints like concert listing and stats. Concert data changes infrequently (admin creates/deletes), so a short TTL (5–10 seconds) drastically reduces database load without showing stale data.

**CDN + static optimization**: Serve Next.js static assets via CDN (Vercel, CloudFront). Use `next/image` with optimized formats and lazy loading. This offloads bandwidth from the origin server.

**Database read replicas**: Route all read queries (concert list, history) to PostgreSQL read replicas. Write operations (reserve, cancel, create) go to the primary. PgBouncer in transaction mode pools connections efficiently.

**Pagination**: Replace unbounded `findMany()` with cursor-based pagination. For the history table, this prevents loading thousands of rows when the system scales to millions of reservations.

**Horizontal scaling**: Run multiple backend instances behind a load balancer. JWT is stateless, so any instance can verify tokens without session affinity. The database row lock ensures consistency regardless of which instance handles the request.

### 2. How to handle many users reserving tickets at the same time

This system already implements the core solution: **pessimistic row locking** (`SELECT ... FOR UPDATE`) inside a `RepeatableRead` transaction with automatic retry (up to 10 attempts, exponential backoff + jitter).

For an actual flash-sale scenario (100k+ users in seconds), I would add:

- **Redis-based queue (Bull/BullMQ)**: When a user clicks "Reserve", enqueue the request. A worker processes reservations sequentially per concert. The user sees "Processing..." and polls or receives a WebSocket push for the result. This converts 100k concurrent DB transactions into a serial queue, eliminating lock contention entirely.
- **Per-user rate limiting**: Prevent a single user from hammering the reserve endpoint. A simple token bucket in Redis (1 request per 2 seconds per user per concert) blocks abuse without affecting legitimate users.
- **Inventory counter in Redis**: Keep an atomic counter (`DECR`) for available seats. Check Redis first — if counter is 0, reject immediately without touching the database. Only if counter > 0, proceed to the DB transaction. This handles the "sold out" path at Redis speed (~0.1ms) instead of DB speed (~5ms).

### 3. Ensuring no one needs to stand up during the show

The question asks how to make sure every ticket buyer has a seat (no overselling standing room).

- **Assigned seating with seat map**: Instead of a single `totalSeats` counter, model individual seats with row and number. Users pick a specific seat on a visual seat map. The `Reservation` table links to a specific `Seat` record with a unique constraint — one person, one physical seat.
- **Fill center-out**: Auto-assign seats from the center of each row outward toward the aisles. This minimizes disruption for late arrivals, who get aisle seats and don't need to pass seated attendees.
- **Lock full rows before opening next**: Only release the next row for sale after the current row is fully booked. This ensures no isolated empty seats between occupied ones.
- **Hard capacity = total physical seats**: The `totalSeats` field must exactly match the number of physical seats in the venue. The system already enforces this — once reserved count equals `totalSeats`, all further reservations are rejected with a clear "sold out" message.
