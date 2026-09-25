from datetime import datetime, timezone

from beanie import Document, Indexed
from pydantic import Field


class ClassRoom(Document):
    school_id: Indexed(str)
    name: str = Field(min_length=1, max_length=80)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "classes"
        indexes = [[("school_id", 1), ("name", 1)], {"name": "unique_school_class", "unique": True, "key": {"school_id": 1, "name": 1}}]


class Subject(Document):
    school_id: Indexed(str)
    name: str = Field(min_length=1, max_length=80)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "subjects"
        indexes = [{"name": "unique_school_subject", "unique": True, "key": {"school_id": 1, "name": 1}}]


class Student(Document):
    school_id: Indexed(str)
    class_id: Indexed(str)
    name: str = Field(min_length=2, max_length=120)
    roll_no: str = Field(min_length=1, max_length=30)
    performance: dict[str, float] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "students"
        indexes = [{"name": "unique_student_roll", "unique": True, "key": {"school_id": 1, "class_id": 1, "roll_no": 1}}]
