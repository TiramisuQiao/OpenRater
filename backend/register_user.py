"""Utility script to register a new user account."""

from getpass import getpass

from app.database import Base, engine, SessionLocal
from app.models import RoleEnum, User
from app.security import get_password_hash


def main() -> None:
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("=== OpenRater User Registration ===\n")
        
        # Get user information
        email = input("Email: ")
        
        # Check if user already exists
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"Error: User with email '{email}' already exists.")
            return
        
        name = input("Full Name: ")
        
        # Select role
        print("\nAvailable roles:")
        print("  1. admin      - Administrator (full access)")
        print("  2. reviewer   - Reviewer (can submit reviews)")
        print("  3. professor  - Professor (can view and respond to reviews)")
        
        role_choice = input("\nSelect role (1-3): ").strip()
        role_map = {
            "1": RoleEnum.ADMIN,
            "2": RoleEnum.REVIEWER,
            "3": RoleEnum.PROFESSOR
        }
        
        if role_choice not in role_map:
            print("Error: Invalid role selection.")
            return
        
        role = role_map[role_choice]
        
        # Get password
        password = getpass("Password (min 8 chars): ")
        if len(password) < 8:
            print("Error: Password too short (minimum 8 characters).")
            return
        
        password_confirm = getpass("Confirm password: ")
        if password != password_confirm:
            print("Error: Passwords do not match.")
            return
        
        # Create user
        user = User(
            email=email,
            name=name,
            role=role,
            hashed_password=get_password_hash(password)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print(f"\n✓ User created successfully!")
        print(f"  Email: {user.email}")
        print(f"  Name: {user.name}")
        print(f"  Role: {user.role.value}")
        print(f"  User ID: {user.id}")
        
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
    except Exception as e:
        print(f"\nError: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
