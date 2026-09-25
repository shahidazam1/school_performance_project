from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from school_performance_project.backend.app.core.config import get_settings
from school_performance_project.backend.app.models import School

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_school(token: str = Depends(oauth2_scheme)) -> School:
    settings = get_settings()
    credentials_error = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        school_id = payload.get("sub")
        if not school_id:
            raise credentials_error
    except JWTError as exc:
        raise credentials_error from exc

    school = await School.get(school_id)
    if school is None or not school.is_active:
        raise credentials_error
    return school
