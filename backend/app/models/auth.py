from datetime import datetime, timezone

from beanie import Document, Indexed
from pydantic import EmailStr, Field


class School(Document):
    name: str = Field(min_length=2, max_length=120)
    email: Indexed(EmailStr, unique=True)
    password_hash: str
    profile_photo_url: str | None = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "schools"


class PasswordResetToken(Document):
    school_id: str
    token_hash: Indexed(str, unique=True)
    expires_at: datetime
    used_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "password_reset_tokens"
        indexes = ["expires_at"]
