from typing import List

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from . import models, schemas
from .config import settings
from .database import Base, engine, get_db
from .dependencies import get_current_user, require_role
from .security import create_access_token, get_password_hash, verify_password

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/auth/register", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can create accounts")
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = models.User(
        email=user_in.email,
        name=user_in.name,
        role=user_in.role,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/bootstrap", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def bootstrap_admin(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if user_in.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bootstrap must create an admin")
    admin_exists = db.query(models.User).filter(models.User.role == models.RoleEnum.ADMIN).first()
    if admin_exists:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin already exists")
    user = models.User(
        email=user_in.email,
        name=user_in.name,
        role=user_in.role,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token = create_access_token({"sub": user.email})
    return {"access_token": access_token}


@app.get("/users/me", response_model=schemas.UserRead)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@app.post("/courses", response_model=schemas.CourseRead, status_code=status.HTTP_201_CREATED)
def create_course(course_in: schemas.CourseCreate, _: models.User = Depends(require_role(models.RoleEnum.ADMIN)), db: Session = Depends(get_db)):
    existing = db.query(models.Course).filter(models.Course.code == course_in.code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Course code already exists")
    course = models.Course(**course_in.dict())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@app.get("/courses", response_model=List[schemas.CourseRead])
def list_courses(_: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Course).all()


@app.post("/professors", response_model=schemas.ProfessorRead, status_code=status.HTTP_201_CREATED)
def create_professor(
    professor_in: schemas.ProfessorCreate,
    _: models.User = Depends(require_role(models.RoleEnum.ADMIN)),
    db: Session = Depends(get_db),
):
    professor = models.Professor(name=professor_in.name, department=professor_in.department)
    if professor_in.user_id:
        user = db.query(models.User).filter(models.User.id == professor_in.user_id).first()
        if not user or user.role != models.RoleEnum.PROFESSOR:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid professor account")
        professor.user_id = user.id
    if professor_in.course_ids:
        courses = db.query(models.Course).filter(models.Course.id.in_(professor_in.course_ids)).all()
        if len(courses) != len(set(professor_in.course_ids)):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid course ids")
        professor.courses = courses
    db.add(professor)
    db.commit()
    db.refresh(professor)
    return professor


@app.get("/professors", response_model=List[schemas.ProfessorRead])
def list_professors(_: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Professor).all()


@app.post(
    "/professors/{professor_id}/assign-course",
    response_model=schemas.ProfessorRead,
    status_code=status.HTTP_200_OK,
)
def assign_course_to_professor(
    professor_id: int,
    assignment: schemas.CourseAssignmentRequest,
    _: models.User = Depends(require_role(models.RoleEnum.ADMIN)),
    db: Session = Depends(get_db),
):
    professor = db.query(models.Professor).filter(models.Professor.id == professor_id).first()
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professor not found")
    courses = db.query(models.Course).filter(models.Course.id.in_(assignment.course_ids)).all()
    if len(courses) != len(set(assignment.course_ids)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid course ids")
    professor.courses = courses
    db.commit()
    db.refresh(professor)
    return professor


@app.post("/reviews", response_model=schemas.ReviewRead, status_code=status.HTTP_201_CREATED)
def create_review(
    review_in: schemas.ReviewCreate,
    reviewer: models.User = Depends(require_role(models.RoleEnum.REVIEWER)),
    db: Session = Depends(get_db),
):
    professor = db.query(models.Professor).filter(models.Professor.id == review_in.professor_id).first()
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professor not found")
    if review_in.course_id not in [course.id for course in professor.courses]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Professor not assigned to course")
    review = models.Review(
        reviewer_id=reviewer.id,
        **review_in.dict(),
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@app.get("/reviews", response_model=List[schemas.ReviewRead])
def list_reviews(
    user: models.User = Depends(require_role(models.RoleEnum.ADMIN, models.RoleEnum.REVIEWER)),
    db: Session = Depends(get_db),
):
    query = db.query(models.Review).order_by(models.Review.created_at.desc())
    if user.role == models.RoleEnum.REVIEWER:
        query = query.filter(models.Review.reviewer_id == user.id)
    return query.all()


@app.get(
    "/professors/{professor_id}/reviews",
    response_model=List[schemas.ReviewRead],
)
def list_reviews_for_professor(
    professor_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    professor = db.query(models.Professor).filter(models.Professor.id == professor_id).first()
    if not professor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Professor not found")
    if user.role == models.RoleEnum.PROFESSOR:
        if professor.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot view other professors' reviews")
    elif user.role not in {models.RoleEnum.ADMIN, models.RoleEnum.REVIEWER}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    reviews = (
        db.query(models.Review)
        .filter(models.Review.professor_id == professor_id)
        .order_by(models.Review.created_at.desc())
        .all()
    )
    return reviews


@app.post(
    "/reviews/{review_id}/rebuttal",
    response_model=schemas.RebuttalRead,
    status_code=status.HTTP_201_CREATED,
)
def create_rebuttal(
    review_id: int,
    rebuttal_in: schemas.RebuttalCreate,
    professor_user: models.User = Depends(require_role(models.RoleEnum.PROFESSOR)),
    db: Session = Depends(get_db),
):
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    professor = db.query(models.Professor).filter(models.Professor.id == review.professor_id).first()
    if not professor or professor.user_id != professor_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot rebut reviews for other professors")
    if review.rebuttal:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rebuttal already exists")
    rebuttal = models.Rebuttal(review_id=review.id, professor_id=professor_user.id, content=rebuttal_in.content)
    db.add(rebuttal)
    db.commit()
    db.refresh(rebuttal)
    return rebuttal


@app.get("/rebuttals", response_model=List[schemas.RebuttalRead])
def list_rebuttals(_: models.User = Depends(require_role(models.RoleEnum.ADMIN)), db: Session = Depends(get_db)):
    return db.query(models.Rebuttal).all()


@app.get("/health")
def health_check():
    return {"status": "ok"}
