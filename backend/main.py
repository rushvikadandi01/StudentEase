import os
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from typing import Any
from pathlib import Path

import joblib
import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from pwdlib import PasswordHash

from backend.database import (
    create_table,
    save_complaint,
    get_all_complaints,
    get_connection,
)


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

load_dotenv()

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "30"))

DATABASE_URL = os.getenv("DATABASE_URL")
frontend_origin = os.getenv("FRONTEND_ORIGIN", "").rstrip("/")

password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)


# --------------------------------------------------
# MACHINE LEARNING MODEL
# --------------------------------------------------

MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "ml"
    / "complaint_classifier.joblib"
)

try:
    complaint_model = joblib.load(MODEL_PATH)
    print("StudentEase ML category model loaded successfully.")
except Exception as error:
    complaint_model = None
    print(f"ML model could not be loaded: {error}")


# --------------------------------------------------
# FASTAPI APP
# --------------------------------------------------

app = FastAPI(title="StudentEase API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        *([frontend_origin] if frontend_origin else []),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class Complaint(BaseModel):
    title: str
    description: str
    location: str = "Not specified"
    category: str = "Let AI detect"
    anonymous: bool = False


class StatusUpdate(BaseModel):
    status: str


class AdminLogin(BaseModel):
    username: str
    password: str


class StudentRegister(BaseModel):
    full_name: str
    email: str
    password: str


class StudentLogin(BaseModel):
    email: str
    password: str


# --------------------------------------------------
# ADMIN AUTHENTICATION
# --------------------------------------------------

def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
):
    """Validate the JWT token for admin-only endpoints."""

    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Admin login required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not ADMIN_USERNAME or not JWT_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="Admin authentication is not configured.",
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET_KEY,
            algorithms=["HS256"],
        )

        if (
            payload.get("sub") != ADMIN_USERNAME
            or payload.get("role") != "admin"
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid admin token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return payload

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired admin token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


@app.post("/admin/login")
def admin_login(login: AdminLogin):
    """Authenticate an admin and return a short-lived JWT."""

    if not all(
        [ADMIN_USERNAME, ADMIN_PASSWORD_HASH, JWT_SECRET_KEY]
    ):
        raise HTTPException(
            status_code=500,
            detail="Admin authentication is not configured. Check the environment variables.",
        )

    try:
        password_is_valid = password_hash.verify(
            login.password,
            ADMIN_PASSWORD_HASH,
        )
    except Exception:
        password_is_valid = False

    if (
        login.username != ADMIN_USERNAME
        or not password_is_valid
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password.",
        )

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=JWT_EXPIRE_MINUTES
    )

    token = jwt.encode(
        {
            "sub": ADMIN_USERNAME,
            "role": "admin",
            "exp": expires_at,
        },
        JWT_SECRET_KEY,
        algorithm="HS256",
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": JWT_EXPIRE_MINUTES * 60,
    }


# --------------------------------------------------
# STUDENT REGISTRATION
# --------------------------------------------------

@app.post("/students/register", status_code=201)
def register_student(student: StudentRegister):
    full_name = student.full_name.strip()
    email = student.email.strip().lower()
    password = student.password

    # Validate required fields
    if not full_name:
        raise HTTPException(
            status_code=400,
            detail="Full name is required.",
        )

    # Validate college email domain
    if not email.endswith("@student.gitam.edu"):
        raise HTTPException(
            status_code=400,
            detail="Please use your @student.gitam.edu email address.",
        )

    # Validate password length
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters.",
        )

    # Hash password before storing it
    hashed_password = password_hash.hash(password)

    student_id = str(uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    try:
        with get_connection() as connection:
            if DATABASE_URL:
                connection.execute(
                    """
                    INSERT INTO students
                    (id, full_name, email, password_hash, created_at)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        student_id,
                        full_name,
                        email,
                        hashed_password,
                        created_at,
                    ),
                )
            else:
                connection.execute(
                    """
                    INSERT INTO students
                    (id, full_name, email, password_hash, created_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        student_id,
                        full_name,
                        email,
                        hashed_password,
                        created_at,
                    ),
                )

    except Exception as error:
        # Handle duplicate email without exposing database details
        error_code = getattr(error, "sqlstate", None)
        sqlite_code = getattr(error, "sqlite_errorcode", None)

        if error_code == "23505" or sqlite_code == 2067:
            raise HTTPException(
                status_code=409,
                detail="An account with this email already exists.",
            ) from error

        raise

    return {
        "message": "Student registered successfully.",
        "student_id": student_id,
        "full_name": full_name,
        "email": email,
    }


# --------------------------------------------------
# STUDENT LOGIN
# --------------------------------------------------

@app.post("/students/login")
def student_login(student: StudentLogin):
    email = student.email.strip().lower()

    # Find the registered student
    with get_connection() as connection:
        if DATABASE_URL:
            cursor = connection.execute(
                """
                SELECT id, full_name, email, password_hash
                FROM students
                WHERE email = %s
                """,
                (email,),
            )
        else:
            cursor = connection.execute(
                """
                SELECT id, full_name, email, password_hash
                FROM students
                WHERE email = ?
                """,
                (email,),
            )

        student_record = cursor.fetchone()

    # Check email and password
    if not student_record:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password.",
        )

    try:
        password_is_valid = password_hash.verify(
            student.password,
            student_record["password_hash"],
        )
    except Exception:
        password_is_valid = False

    if not password_is_valid:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password.",
        )

    if not JWT_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="Login authentication is not configured.",
        )

    # Create a short-lived student token
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)

    token = jwt.encode(
        {
            "sub": student_record["id"],
            "role": "student",
            "exp": expires_at,
        },
        JWT_SECRET_KEY,
        algorithm="HS256",
    )

    return {
        "message": "Login successful.",
        "access_token": token,
        "token_type": "bearer",
        "expires_in": JWT_EXPIRE_MINUTES * 60,
        "student": {
            "id": student_record["id"],
            "full_name": student_record["full_name"],
            "email": student_record["email"],
        },
    }


# --------------------------------------------------
# DATABASE STARTUP
# --------------------------------------------------

@app.on_event("startup")
def startup():
    create_table()


# --------------------------------------------------
# HOME
# --------------------------------------------------

@app.get("/")
def home():
    return {"message": "StudentEase backend is running!"}


# --------------------------------------------------
# COMPLAINT ANALYSIS
# --------------------------------------------------

def analyze_details(complaint: Complaint):
    text = (
        complaint.title + " " + complaint.description
    ).lower()

    # Category detection
    if complaint.category != "Let AI detect":
        category = complaint.category
        method = "manual_selection"

    elif complaint_model is not None:
        try:
            category = str(
                complaint_model.predict(
                    [complaint.title + " " + complaint.description]
                )[0]
            )
            method = "machine_learning"
        except Exception as error:
            print(f"ML prediction failed: {error}")
            category = "General Complaint"
            method = "keyword_rules_fallback"

    else:
        if any(
            word in text
            for word in ["wifi", "wi-fi", "internet", "network"]
        ):
            category = "IT / Internet"

        elif any(
            word in text
            for word in [
                "projector", "classroom", "building",
                "fan", "electricity", "furniture",
            ]
        ):
            category = "Infrastructure"

        elif any(
            word in text
            for word in ["hostel", "warden", "dormitory"]
        ):
            category = "Hostel"

        elif any(
            word in text
            for word in [
                "teacher", "exam", "assignment",
                "attendance", "syllabus", "lecture",
            ]
        ):
            category = "Academics"

        elif any(
            word in text
            for word in ["bus", "transport", "driver"]
        ):
            category = "Transport"

        elif any(
            word in text
            for word in [
                "garbage", "dustbin", "dirty",
                "cleanliness", "sanitation",
            ]
        ):
            category = "Cleanliness"

        elif any(
            word in text
            for word in [
                "security", "unsafe", "theft",
                "harassment", "emergency",
            ]
        ):
            category = "Security"

        else:
            category = "General Complaint"

        method = "keyword_rules_fallback"

    # Priority detection
    high_words = [
        "urgent", "emergency", "danger",
        "fire", "accident", "security threat",
    ]

    medium_words = [
        "not working", "unable", "broken",
        "problem", "issue", "delay",
    ]

    if any(word in text for word in high_words):
        priority = "HIGH"
    elif any(word in text for word in medium_words):
        priority = "MEDIUM"
    else:
        priority = "LOW"

    # Sentiment detection
    negative_words = [
        "bad", "terrible", "frustrated", "unable",
        "problem", "issue", "broken", "worst",
        "not working",
    ]

    sentiment = (
        "Negative"
        if any(word in text for word in negative_words)
        else "Neutral"
    )

    # Department assignment
    departments = {
        "IT / Internet": "IT Support",
        "Infrastructure": "Maintenance",
        "Hostel": "Hostel Administration",
        "Academics": "Academic Administration",
        "Transport": "Transport Department",
        "Cleanliness": "Campus Maintenance",
        "Security": "Campus Security",
        "General Complaint": "Student Affairs",
        "Other": "Student Affairs",
    }

    return {
        "title": complaint.title,
        "description": complaint.description,
        "location": complaint.location,
        "anonymous": complaint.anonymous,
        "category": category,
        "priority": priority,
        "sentiment": sentiment,
        "department": departments.get(
            category, "Student Affairs"
        ),
        "method": method,
    }


@app.post("/analyze")
def analyze_complaint(complaint: Complaint):
    return analyze_details(complaint)


# --------------------------------------------------
# CREATE COMPLAINT
# --------------------------------------------------

@app.post("/complaints")
def create_complaint(complaint: Complaint):
    result = analyze_details(complaint)

    result["id"] = f"CP-{uuid4().hex[:8].upper()}"
    result["status"] = "Pending"
    result["createdAt"] = datetime.now(
        timezone.utc
    ).isoformat()

    save_complaint(result)

    return result


# --------------------------------------------------
# LIST COMPLAINTS
# NOTE: This endpoint remains public for compatibility.
# Restrict it before storing real student complaints.
# --------------------------------------------------


@app.get("/complaints")
def list_complaints(
    admin: dict = Depends(require_admin),
):
    return get_all_complaints()



# --------------------------------------------------
# ADMIN-ONLY COMPLAINT LIST
# --------------------------------------------------

@app.get("/admin/complaints")
def list_admin_complaints(
    admin: dict = Depends(require_admin),
):
    return get_all_complaints()


# --------------------------------------------------
# IMPORT COMPLAINTS
# --------------------------------------------------

@app.post("/complaints/import")
def import_complaints(
    complaints: list[dict[str, Any]],
    admin: dict = Depends(require_admin),
):
    imported = 0
    skipped = 0

    existing_ids = {
        item["id"] for item in get_all_complaints()
    }

    for item in complaints:
        complaint_id = (
            item.get("id")
            or f"CP-{uuid4().hex[:8].upper()}"
        )

        if complaint_id in existing_ids:
            skipped += 1
            continue

        required_fields = [
            "title", "description", "category",
            "priority", "sentiment", "department",
        ]

        if any(
            not item.get(field)
            for field in required_fields
        ):
            continue

        record = {
            "id": complaint_id,
            "title": item["title"],
            "description": item["description"],
            "location": item.get("location") or "Not specified",
            "anonymous": bool(item.get("anonymous", False)),
            "category": item["category"],
            "priority": item["priority"],
            "sentiment": item["sentiment"],
            "department": item["department"],
            "status": item.get("status") or "Pending",
            "createdAt": (
                item.get("createdAt")
                or item.get("created_at")
                or datetime.now(timezone.utc).isoformat()
            ),
        }

        save_complaint(record)
        existing_ids.add(complaint_id)
        imported += 1

    return {
        "imported": imported,
        "skipped_duplicates": skipped,
        "total_in_database": len(get_all_complaints()),
    }


# --------------------------------------------------
# UPDATE COMPLAINT STATUS
# --------------------------------------------------

@app.patch("/complaints/{complaint_id}/status")
def update_complaint_status(
    complaint_id: str,
    update: StatusUpdate,
    admin: dict = Depends(require_admin),
):
    allowed_statuses = [
        "Pending",
        "In Progress",
        "Resolved",
    ]

    if update.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. Choose Pending, "
                "In Progress, or Resolved."
            ),
        )

    with get_connection() as connection:
        if DATABASE_URL:
            cursor = connection.execute(
                """
                UPDATE complaints
                SET status = %s
                WHERE id = %s
                """,
                (update.status, complaint_id),
            )
        else:
            cursor = connection.execute(
                """
                UPDATE complaints
                SET status = ?
                WHERE id = ?
                """,
                (update.status, complaint_id),
            )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Complaint not found.",
            )

    return {
        "message": "Complaint status updated successfully.",
        "id": complaint_id,
        "status": update.status,
    }
