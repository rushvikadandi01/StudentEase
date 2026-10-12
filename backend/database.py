import os
import sqlite3
from pathlib import Path
from contextlib import contextmanager

from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row

load_dotenv()

DATABASE_PATH = Path(__file__).resolve().parent.parent / "studentease.db"
DATABASE_URL = os.getenv("DATABASE_URL")


@contextmanager
def get_connection():
    """Connect to PostgreSQL when configured; otherwise use local SQLite."""
    if DATABASE_URL:
        url = DATABASE_URL.replace("postgres://", "postgresql://", 1)

        with psycopg.connect(url, row_factory=dict_row) as connection:
            yield connection
    else:
        connection = sqlite3.connect(DATABASE_PATH)
        connection.row_factory = sqlite3.Row

        try:
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()


def execute_query(connection, query, parameters=()):
    """Use the correct parameter placeholders for the active database."""
    if DATABASE_URL:
        query = query.replace("?", "%s")

    return connection.execute(query, parameters)


def create_table():
    """Create tables and add student_id to existing complaints tables."""
    with get_connection() as connection:

        # Complaints table
        execute_query(
            connection,
            """
            CREATE TABLE IF NOT EXISTS complaints (
                id TEXT PRIMARY KEY,
                student_id TEXT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                location TEXT NOT NULL,
                anonymous INTEGER NOT NULL DEFAULT 0,
                category TEXT NOT NULL,
                priority TEXT NOT NULL,
                sentiment TEXT NOT NULL,
                department TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Pending',
                created_at TEXT NOT NULL
            )
            """,
        )

        # Migrate existing databases without deleting old complaints.
        if DATABASE_URL:
            columns = execute_query(
                connection,
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'complaints'
                  AND table_schema = current_schema()
                """,
            ).fetchall()

            existing_columns = {
                row["column_name"] for row in columns
            }
        else:
            columns = execute_query(
                connection,
                "PRAGMA table_info(complaints)",
            ).fetchall()

            existing_columns = {
                row["name"] for row in columns
            }

        if "student_id" not in existing_columns:
            execute_query(
                connection,
                "ALTER TABLE complaints ADD COLUMN student_id TEXT",
            )

        # Students table
        execute_query(
            connection,
            """
            CREATE TABLE IF NOT EXISTS students (
                id TEXT PRIMARY KEY,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """,
        )


def save_complaint(complaint):
    """Save a complaint, including its student ID when available."""
    with get_connection() as connection:
        execute_query(
            connection,
            """
            INSERT INTO complaints (
                id,
                student_id,
                title,
                description,
                location,
                anonymous,
                category,
                priority,
                sentiment,
                department,
                status,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                complaint["id"],
                complaint.get("student_id"),
                complaint["title"],
                complaint["description"],
                complaint["location"],
                int(complaint["anonymous"]),
                complaint["category"],
                complaint["priority"],
                complaint["sentiment"],
                complaint["department"],
                complaint["status"],
                complaint["createdAt"],
            ),
        )


def get_all_complaints():
    """Return all complaints for authorized administrative use."""
    with get_connection() as connection:
        rows = execute_query(
            connection,
            """
            SELECT *
            FROM complaints
            ORDER BY created_at DESC
            """,
        ).fetchall()

    results = []

    for row in rows:
        item = dict(row)
        item["anonymous"] = bool(item["anonymous"])
        item["createdAt"] = item.pop("created_at")
        results.append(item)

    return results


def get_student_complaints(student_id):
    """Return complaints belonging to one student only."""
    with get_connection() as connection:
        rows = execute_query(
            connection,
            """
            SELECT *
            FROM complaints
            WHERE student_id = ?
            ORDER BY created_at DESC
            """,
            (student_id,),
        ).fetchall()

    results = []

    for row in rows:
        item = dict(row)
        item["anonymous"] = bool(item["anonymous"])
        item["createdAt"] = item.pop("created_at")
        results.append(item)

    return results