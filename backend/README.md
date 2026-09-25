# School Performance API

FastAPI and MongoDB backend for school registration, authentication, academic settings, student management, bulk CSV import, and dashboard performance metrics.

## Setup

1. Install Python 3.11+ and run MongoDB locally, or provide a MongoDB connection string.
2. Create an environment and install dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set a long random `JWT_SECRET_KEY` in `.env`. Start the API from this directory:

```powershell
uvicorn app.main:app --reload
```

Open the generated OpenAPI UI at `http://127.0.0.1:8000/docs`.

## API surface

- `POST /api/v1/auth/register`, `/login`, `/forgot-password`, `/reset-password`, `/change-password`, `/logout`
- `GET/POST/DELETE /api/v1/settings/classes`
- `GET/POST/DELETE /api/v1/settings/subjects`
- `GET/POST/PATCH/DELETE /api/v1/students`
- `POST /api/v1/students/bulk-import?class_id=...` with CSV columns `name,roll_no`
- `GET /api/v1/dashboard`
- `GET /health`

All non-authenticated endpoints require `Authorization: Bearer <access_token>`. Academic records are isolated by the authenticated school. In development, the forgot-password endpoint returns the reset token to support local testing; production should deliver it through an email provider.
