from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=32, max_length=256)
    new_password: str = Field(min_length=8, max_length=128)


class ProfileUpdate(BaseModel):
    headline: str | None = Field(default=None, max_length=180)
    location: str | None = Field(default=None, max_length=120)
    about: str | None = Field(default=None, max_length=3000)
    skills: list[str] | None = Field(default=None, max_length=50)


class PostCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)
    visibility: str = Field(default="public", pattern="^(public|connections)$")


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class JobCreate(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    company: str = Field(min_length=2, max_length=160)
    location: str = Field(min_length=2, max_length=160)
    description: str = Field(min_length=20, max_length=10000)
    employment_type: str = Field(default="Full-time", max_length=40)


class ConversationCreate(BaseModel):
    recipient_id: str = Field(min_length=24, max_length=24)


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)