# Workline API

FastAPI and MongoDB service for a professional networking application. The API is versioned under `/api/v1`; interactive OpenAPI documentation is available at `/docs`.

## Local setup

Requirements: Python 3.11+ and MongoDB 6.0+.

```powershell
cd linkedin_backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `JWT_SECRET_KEY` to a unique random value of at least 32 characters before starting. Run MongoDB, then start the API:

```powershell
uvicorn app.main:app --reload
```

The API remains available in degraded mode if MongoDB is down, but data and authentication routes need MongoDB; `/health` returns HTTP 503 until it is available.

## Implemented API

- `POST /api/v1/auth/register`, `/login`, `/forgot-password`, `/reset-password`, `/logout`; `GET /auth/me`
- `GET/PATCH /api/v1/profiles/me`; `GET /api/v1/profiles/{user_id}`
- `GET/POST /api/v1/feed`; `POST /feed/{post_id}/reactions`, `/comments`
- `GET /api/v1/connections`; request and accept routes
- `GET/POST /api/v1/jobs`; apply to an open job
- `GET/POST /api/v1/conversations`; list/send conversation messages
- `GET /api/v1/notifications`; `GET /health`

Access tokens are short-lived JWTs. Passwords use Argon2, reset tokens are stored hashed and expire after 30 minutes, and API responses never expose password hashes. The development-only reset endpoint returns the token for local testing; connect an email provider before production. A production launch also needs refresh-token rotation, rate limiting, moderation, media storage, and audit retention.

## Frontend

The sibling `linkedin_frontend` app uses React, TypeScript, Vite, MUI, and React Query. Its API URL defaults to `http://localhost:8000/api/v1`; set `VITE_API_URL` to override it.
