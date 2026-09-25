from fastapi import APIRouter, Depends, HTTPException, status

from school_performance_project.backend.app.api_deps import get_current_school
from school_performance_project.backend.app.models import ClassRoom, School, Subject
from school_performance_project.backend.app.schemas.academic import NameCreate, NameResponse

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/classes", response_model=list[NameResponse])
async def list_classes(school: School = Depends(get_current_school)):
    return await ClassRoom.find(ClassRoom.school_id == str(school.id)).sort(+ClassRoom.name).to_list()


@router.post("/classes", response_model=NameResponse, status_code=status.HTTP_201_CREATED)
async def create_class(payload: NameCreate, school: School = Depends(get_current_school)):
    if await ClassRoom.find_one(ClassRoom.school_id == str(school.id), ClassRoom.name == payload.name).exists():
        raise HTTPException(status_code=409, detail="Class already exists")
    classroom = ClassRoom(school_id=str(school.id), name=payload.name)
    await classroom.insert()
    return classroom


@router.delete("/classes/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(class_id: str, school: School = Depends(get_current_school)):
    classroom = await ClassRoom.find_one(ClassRoom.id == class_id, ClassRoom.school_id == str(school.id))
    if classroom is None:
        raise HTTPException(status_code=404, detail="Class not found")
    await classroom.delete()


@router.get("/subjects", response_model=list[NameResponse])
async def list_subjects(school: School = Depends(get_current_school)):
    return await Subject.find(Subject.school_id == str(school.id)).sort(+Subject.name).to_list()


@router.post("/subjects", response_model=NameResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(payload: NameCreate, school: School = Depends(get_current_school)):
    if await Subject.find_one(Subject.school_id == str(school.id), Subject.name == payload.name).exists():
        raise HTTPException(status_code=409, detail="Subject already exists")
    subject = Subject(school_id=str(school.id), name=payload.name)
    await subject.insert()
    return subject


@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(subject_id: str, school: School = Depends(get_current_school)):
    subject = await Subject.find_one(Subject.id == subject_id, Subject.school_id == str(school.id))
    if subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    await subject.delete()
