from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from school_performance_project.backend.app.api_deps import get_current_school
from school_performance_project.backend.app.core.config import get_settings
from school_performance_project.backend.app.core.security import create_access_token, create_reset_token, hash_password, hash_reset_token, verify_password
from school_performance_project.backend.app.models import PasswordResetToken, School
from school_performance_project.backend.app.schemas.auth import ChangePasswordRequest, ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest, SchoolResponse, TokenResponse
from pydantic import BaseModel, Field

router = APIRouter(prefix="/auth", tags=["Authentication"])


class ProfileUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    profile_photo_url: str | None = None


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
    if await School.find_one(School.email == payload.email).exists():
        raise HTTPException(status_code=409, detail="A school with this email already exists")
    school = School(name=payload.name, email=payload.email, password_hash=hash_password(payload.password))
    await school.insert()
    return TokenResponse(access_token=create_access_token(str(school.id)), school=SchoolResponse.model_validate(school))


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    school = await School.find_one(School.email == payload.email)
    if school is None or not verify_password(payload.password, school.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return TokenResponse(access_token=create_access_token(str(school.id)), school=SchoolResponse.model_validate(school))


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    school = await School.find_one(School.email == payload.email)
    response = {"message": "If an account exists, password reset instructions have been sent"}
    if school is None:
        return response
    raw_token, token_hash = create_reset_token()
    await PasswordResetToken(school_id=str(school.id), token_hash=token_hash, expires_at=datetime.now(timezone.utc) + timedelta(minutes=get_settings().password_reset_expire_minutes)).insert()
    return {**response, "reset_token": raw_token} if get_settings().environment == "development" else response


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    reset = await PasswordResetToken.find_one(PasswordResetToken.token_hash == hash_reset_token(payload.token))
    if reset is None or reset.used_at is not None or reset.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    school = await School.get(reset.school_id)
    if school is None:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    school.password_hash = hash_password(payload.new_password)
    school.updated_at = datetime.now(timezone.utc)
    await school.save()
    reset.used_at = datetime.now(timezone.utc)
    await reset.save()
    return {"message": "Password reset successfully"}


@router.post("/change-password")
async def change_password(payload: ChangePasswordRequest, school: School = Depends(get_current_school)):
    if not verify_password(payload.current_password, school.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    school.password_hash = hash_password(payload.new_password)
    school.updated_at = datetime.now(timezone.utc)
    await school.save()
    return {"message": "Password changed successfully"}


@router.get("/me", response_model=SchoolResponse)
async def get_profile(school: School = Depends(get_current_school)):
    return school


@router.patch("/me", response_model=SchoolResponse)
async def update_profile(payload: ProfileUpdateRequest, school: School = Depends(get_current_school)):
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(school, key, value)
    school.updated_at = datetime.now(timezone.utc)
    await school.save()
    return school


@router.post("/logout")
async def logout(_: School = Depends(get_current_school)):
    return {"message": "Logged out successfully; discard the access token on the client"}
