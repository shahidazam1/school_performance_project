from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from school_performance_project.backend.app.core.config import get_settings
from school_performance_project.backend.app.core.database import lifespan_client
from school_performance_project.backend.app.routers import students
from school_performance_project.backend.app.routers import auth, dashboard, settings


@asynccontextmanager
async def lifespan(_: FastAPI):
    async for _client in lifespan_client():
        yield


settings_config = get_settings()
app = FastAPI(title=settings_config.app_name, version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings_config.cors_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(settings.router, prefix="/api/v1")
app.include_router(students.router, prefix="/api/v1")


@app.get("/health", tags=["Operations"])
async def health_check():
    return {"status": "ok"}
