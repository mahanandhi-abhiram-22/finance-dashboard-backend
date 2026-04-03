# Finance Backend (Assessment)

Simple Express backend demo for finance dashboard assessment.

Setup

1. Install dependencies:

```bash
npm install
```

2. Start server:

```bash
npm start
```

By default the server creates a development admin user: `admin@local` with password `admin123`. Override with `ADMIN_PWD` env var.

This version uses SQLite for persistence (file `finance.db` created in project root).

Run tests:

```bash
npm test
```

API highlights

- POST `/users/login` — { email, password } -> { token }
- POST `/users` — create user (admin only)
- GET `/users` — list users (admin only)
- GET `/users/me` — current user info
- GET `/transactions` — list transactions (auth required)
- GET `/transactions` — list transactions (auth required). Supports pagination: `?page=1&pageSize=20`.
- POST `/transactions` — create (admin only)
- PATCH `/transactions/:id` — update (admin only)
- DELETE `/transactions/:id` — delete (admin only)
- GET `/dashboard/summary` — aggregated summary (analyst/admin)

Notes

- This project persists data in SQLite (`finance.db`) for simplicity.
- Use the JWT token returned from `/users/login` in the `Authorization: Bearer <token>` header.
