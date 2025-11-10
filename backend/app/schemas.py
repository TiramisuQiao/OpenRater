from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field

from .models import RoleEnum


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[EmailStr] = None


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str = Field(min_length=8)
    role: RoleEnum


class UserRead(UserBase):
    id: int
    role: RoleEnum
    created_at: datetime

    class Config:
        orm_mode = True


class CourseBase(BaseModel):
    name: str
    code: str
    term: str


class CourseCreate(CourseBase):
    pass


class CourseRead(CourseBase):
    id: int

    class Config:
        orm_mode = True


class CourseAssignmentRequest(BaseModel):
    course_ids: List[int]


class ProfessorBase(BaseModel):
    name: str
    department: str


class ProfessorCreate(ProfessorBase):
    course_ids: Optional[List[int]] = None
    user_id: Optional[int] = None


class ProfessorRead(ProfessorBase):
    id: int
    courses: List[CourseRead] = Field(default_factory=list)
    user_id: Optional[int]

    class Config:
        orm_mode = True


class ReviewBase(BaseModel):
    professor_id: int
    course_id: int
    summary: str
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    fairness: int = Field(ge=1, le=5)
    clarity: int = Field(ge=1, le=5)
    engagement: int = Field(ge=1, le=5)
    workload: int = Field(ge=1, le=5)
    confidence: int = Field(ge=1, le=5)


class ReviewCreate(ReviewBase):
    pass


class ReviewRead(ReviewBase):
    id: int
    created_at: datetime
    rebuttal: Optional["RebuttalRead"] = None
    course: CourseRead

    class Config:
        orm_mode = True


class RebuttalBase(BaseModel):
    content: str


class RebuttalCreate(RebuttalBase):
    pass


class RebuttalRead(RebuttalBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


ReviewRead.update_forward_refs()
