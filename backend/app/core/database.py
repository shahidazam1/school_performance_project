from collections.abc import AsyncIterator

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from school_performance_project.backend.app.core.config import get_settings
from school_performance_project.backend.app.models import ClassRoom, PasswordResetToken, School, Student, Subject


async def connect_to_mongo() -> AsyncIOMotorClient:
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri)
    await init_beanie(
        database=client[settings.mongodb_database],
        document_models=[School, PasswordResetToken, ClassRoom, Subject, Student],
    )
    return client


async def lifespan_client() -> AsyncIterator[AsyncIOMotorClient]:
    client = await connect_to_mongo()
    try:
        yield client
    finally:
        client.close()
