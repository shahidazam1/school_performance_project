import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from school_performance_project.backend.app.api_deps import get_current_school
from school_performance_project.backend.app.models import ClassRoom, School, Student
from school_performance_project.backend.app.schemas.academic import StudentCreate, StudentResponse, StudentUpdate

router = APIRouter(prefix="/students", tags=["Students"])


async def ensure_class(class_id: str, school_id: str) -> ClassRoom:
    classroom = await ClassRoom.find_one(ClassRoom.id == class_id, ClassRoom.school_id == school_id)
    if classroom is None:
        raise HTTPException(status_code=404, detail="Class not found")
    return classroom


@router.get("", response_model=list[StudentResponse])
async def list_students(school: School = Depends(get_current_school), class_id: str | None = Query(default=None), skip: int = Query(default=0, ge=0), limit: int = Query(default=100, ge=1, le=500)):
    filters = [Student.school_id == str(school.id)]
    if class_id:
        filters.append(Student.class_id == class_id)
    return await Student.find(*filters).sort(+Student.name).skip(skip).limit(limit).to_list()


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(payload: StudentCreate, school: School = Depends(get_current_school)):
    school_id = str(school.id)
    await ensure_class(payload.class_id, school_id)
    if await Student.find_one(Student.school_id == school_id, Student.class_id == payload.class_id, Student.roll_no == payload.roll_no).exists():
        raise HTTPException(status_code=409, detail="Roll number already exists in this class")
    student = Student(school_id=school_id, **payload.model_dump())
    await student.insert()
    return student


@router.patch("/{student_id}", response_model=StudentResponse)
async def update_student(student_id: str, payload: StudentUpdate, school: School = Depends(get_current_school)):
    student = await Student.find_one(Student.id == student_id, Student.school_id == str(school.id))
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    values = payload.model_dump(exclude_unset=True)
    if "class_id" in values:
        await ensure_class(values["class_id"], str(school.id))
    for key, value in values.items():
        setattr(student, key, value)
    student.updated_at = datetime.now(timezone.utc)
    await student.save()
    return student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(student_id: str, school: School = Depends(get_current_school)):
    student = await Student.find_one(Student.id == student_id, Student.school_id == str(school.id))
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    await student.delete()


@router.post("/bulk-import", response_model=dict[str, int], status_code=status.HTTP_201_CREATED)
async def bulk_import_students(class_id: str, file: UploadFile = File(...), school: School = Depends(get_current_school)):
    await ensure_class(class_id, str(school.id))
    if file.content_type not in {"text/csv", "application/csv", "application/vnd.ms-excel"}:
        raise HTTPException(status_code=415, detail="Upload a CSV file")
    rows = csv.DictReader(io.StringIO((await file.read()).decode("utf-8-sig")))
    created = 0
    skipped = 0
    for row in rows:
        name = (row.get("name") or row.get("student_name") or "").strip()
        roll_no = (row.get("roll_no") or row.get("roll_number") or "").strip()
        if not name or not roll_no or await Student.find_one(Student.school_id == str(school.id), Student.class_id == class_id, Student.roll_no == roll_no).exists():
            skipped += 1
            continue
        await Student(school_id=str(school.id), class_id=class_id, name=name, roll_no=roll_no).insert()
        created += 1
    return {"created": created, "skipped": skipped}
