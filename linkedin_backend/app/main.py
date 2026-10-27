import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pymongo import AsyncMongoClient
from pymongo.errors import PyMongoError

from app.api.routes import auth, network
from app.core.config import settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncIterator[None]:
    client = AsyncMongoClient(settings.mongodb_url, serverSelectionTimeoutMS=3000)
    application.state.mongo_client = client
    application.state.database = client[settings.database_name]
    try:
        await client.admin.command("ping")
        await application.state.database.users.create_index("email", unique=True)
        await application.state.database.posts.create_index([("created_at", -1)])
        await application.state.database.connections.create_index("pair_key", unique=True)
        await application.state.database.messages.create_index([("conversation_id", 1), ("created_at", 1)])
        await application.state.database.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
        application.state.database_ready = True
    except PyMongoError:
        application.state.database_ready = False
        logger.warning("MongoDB is unavailable; the API is running in degraded mode.")
    try:
        yield
    finally:
        await client.close()


app = FastAPI(title="Workline API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(network.router, prefix="/api/v1")


@app.get("/health", tags=["Operations"])
async def health(request: Request) -> dict[str, str]:
    try:
        await request.app.state.database.command("ping")
    except PyMongoError as error:
        raise HTTPException(status_code=503, detail="Database unavailable") from error
    return {"status": "ok", "database": "connected"}