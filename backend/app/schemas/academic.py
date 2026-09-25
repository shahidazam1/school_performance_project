from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NameCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class NameResponse(NameCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime


class StudentCreate(BaseModel):
    class_id: str
    name: str = Field(min_length=2, max_length=120)
    roll_no: str = Field(min_length=1, max_length=30)
    performance: dict[str, float] = Field(default_factory=dict)


class StudentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    roll_no: str | None = Field(default=None, min_length=1, max_length=30)
    class_id: str | None = None
    performance: dict[str, float] | None = None


class StudentResponse(StudentCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
    updated_at: datetime


class DashboardResponse(BaseModel):
    total_classes: int
    total_students: int
    total_subjects: int
    subject_performance: list[dict[str, object]]
