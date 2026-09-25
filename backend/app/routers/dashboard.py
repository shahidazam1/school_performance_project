from collections import defaultdict

from fastapi import APIRouter, Depends

from school_performance_project.backend.app.api_deps import get_current_school
from school_performance_project.backend.app.models import ClassRoom, School, Student, Subject
from school_performance_project.backend.app.schemas.academic import DashboardResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard(school: School = Depends(get_current_school)):
    school_id = str(school.id)
    classes, subjects, students = await ClassRoom.find(ClassRoom.school_id == school_id).to_list(), await Subject.find(Subject.school_id == school_id).to_list(), await Student.find(Student.school_id == school_id).to_list()
    totals: dict[str, list[float]] = defaultdict(list)
    for student in students:
        for subject_name, score in student.performance.items():
            totals[subject_name].append(score)
    performance = [{"subject": name, "average": round(sum(scores) / len(scores), 2), "students": len(scores)} for name, scores in sorted(totals.items())]
    return DashboardResponse(total_classes=len(classes), total_students=len(students), total_subjects=len(subjects), subject_performance=performance)
