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

## Important Backend Rules

- Overbooking is prevented inside a Prisma transaction with `Serializable` isolation level.
- The target concert row is locked with `SELECT ... FOR UPDATE` before counting reserved seats.
- A composite unique constraint on `(userId, concertId)` ensures one reservation record per pair.
- Only `RESERVED` status counts against seat capacity.

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
