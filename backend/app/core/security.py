from datetime import datetime, timedelta, timezone
from hashlib import sha256
import secrets

from jose import jwt
from pwdlib import PasswordHash

from school_performance_project.backend.app.core.config import get_settings

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def create_access_token(subject: str) -> str:
    settings = get_settings()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": subject, "exp": expires_at}, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_reset_token() -> tuple[str, str]:
    raw_token = secrets.token_urlsafe(32)
    return raw_token, sha256(raw_token.encode()).hexdigest()


def hash_reset_token(raw_token: str) -> str:
    return sha256(raw_token.encode()).hexdigest()
