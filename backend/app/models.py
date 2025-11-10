import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Table, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from .database import Base


class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    REVIEWER = "reviewer"
    PROFESSOR = "professor"


course_professor_association = Table(
    "course_professor_association",
    Base.metadata,
    Column("course_id", ForeignKey("courses.id"), primary_key=True),
    Column("professor_id", ForeignKey("professors.id"), primary_key=True),
    UniqueConstraint("course_id", "professor_id", name="uq_course_professor"),
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    reviews = relationship("Review", back_populates="reviewer", cascade="all,delete")
    rebuttals = relationship("Rebuttal", back_populates="professor", cascade="all,delete")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    term = Column(String, nullable=False)

    professors = relationship(
        "Professor",
        secondary=course_professor_association,
        back_populates="courses",
    )


class Professor(Base):
    __tablename__ = "professors"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    department = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True)

    courses = relationship(
        "Course",
        secondary=course_professor_association,
        back_populates="professors",
    )
    reviews = relationship("Review", back_populates="professor", cascade="all,delete")
    account = relationship("User")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    professor_id = Column(Integer, ForeignKey("professors.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    summary = Column(Text, nullable=False)
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    fairness = Column(Integer, nullable=False)
    clarity = Column(Integer, nullable=False)
    engagement = Column(Integer, nullable=False)
    workload = Column(Integer, nullable=False)
    confidence = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    reviewer = relationship("User", back_populates="reviews")
    professor = relationship("Professor", back_populates="reviews")
    course = relationship("Course")
    rebuttal = relationship("Rebuttal", back_populates="review", uselist=False, cascade="all,delete")


class Rebuttal(Base):
    __tablename__ = "rebuttals"

    id = Column(Integer, primary_key=True)
    review_id = Column(Integer, ForeignKey("reviews.id"), unique=True, nullable=False)
    professor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    review = relationship("Review", back_populates="rebuttal")
    professor = relationship("User", back_populates="rebuttals")
