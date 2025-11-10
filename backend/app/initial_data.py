"""Utility script to bootstrap an initial admin account."""

from getpass import getpass

from .database import SessionLocal
from .models import RoleEnum, User
from .security import get_password_hash


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.role == RoleEnum.ADMIN).first()
        if existing:
            print("Admin already exists. Aborting.")
            return
        email = input("Admin email: ")
        name = input("Admin name: ")
        password = getpass("Admin password (min 8 chars): ")
        if len(password) < 8:
            print("Password too short.")
            return
        user = User(email=email, name=name, role=RoleEnum.ADMIN, hashed_password=get_password_hash(password))
        db.add(user)
        db.commit()
        print("Admin created successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
