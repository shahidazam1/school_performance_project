import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo.errors import DuplicateKeyError
from pymongo.asynchronous.database import AsyncDatabase

from app.core.config import settings
from app.core.database import get_database
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.schemas.api import ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])
bearer_scheme = HTTPBearer(auto_error=False)


def public_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "full_name": user["full_name"],
        "email": user["email"],
        "headline": user.get("headline", ""),
        "location": user.get("location", ""),
        "about": user.get("about", ""),
        "skills": user.get("skills", []),
    }


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    database: AsyncDatabase = Depends(get_database),
) -> dict | None:
    if credentials is None:
        return None
    subject = decode_access_token(credentials.credentials)
    if subject is None or not ObjectId.is_valid(subject):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token")
    user = await database.users.find_one({"_id": ObjectId(subject)})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account no longer exists")
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    database: AsyncDatabase = Depends(get_database),
) -> dict:
    user = await get_optional_user(credentials, database)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return user


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, database: AsyncDatabase = Depends(get_database)) -> dict:
    now = datetime.now(UTC)
    user = {
        "full_name": payload.full_name.strip(),
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "headline": "",
        "location": "",
        "about": "",
        "skills": [],
        "created_at": now,
        "updated_at": now,
    }
    try:
        result = await database.users.insert_one(user)
    except DuplicateKeyError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists") from error
    user["_id"] = result.inserted_id
    return {"access_token": create_access_token(str(result.inserted_id)), "token_type": "bearer", "user": public_user(user)}


@router.post("/login")
async def login(payload: LoginRequest, database: AsyncDatabase = Depends(get_database)) -> dict:
    user = await database.users.find_one({"email": payload.email.lower()})
    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    return {"access_token": create_access_token(str(user["_id"])), "token_type": "bearer", "user": public_user(user)}


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, database: AsyncDatabase = Depends(get_database)) -> dict:
    user = await database.users.find_one({"email": payload.email.lower()}, {"_id": 1})
    response = {"message": "If an account exists for this email, password reset instructions will be sent."}
    if user is None:
        return response
    raw_token = secrets.token_urlsafe(32)
    await database.password_reset_tokens.insert_one({
        "user_id": user["_id"],
        "token_hash": hashlib.sha256(raw_token.encode()).hexdigest(),
        "expires_at": datetime.now(UTC) + timedelta(minutes=30),
    })
    if settings.app_env == "development":
        response["reset_token"] = raw_token
    return response


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, database: AsyncDatabase = Depends(get_database)) -> dict:
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    token = await database.password_reset_tokens.find_one_and_delete({
        "token_hash": token_hash,
        "expires_at": {"$gt": datetime.now(UTC)},
    })
    if token is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token is invalid or expired")
    await database.users.update_one(
        {"_id": token["user_id"]},
        {"$set": {"password_hash": hash_password(payload.new_password), "updated_at": datetime.now(UTC)}},
    )
    return {"message": "Password updated successfully"}


@router.get("/me")
async def current_user_profile(user: dict = Depends(get_current_user)) -> dict:
    return public_user(user)


@router.post("/logout")
async def logout(_: dict = Depends(get_current_user)) -> dict:
    return {"message": "Signed out. Discard the access token on the client."}