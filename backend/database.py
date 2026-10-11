import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).resolve().parent.parent / "studentease.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def create_table():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS complaints (
                id TEXT PRIMARY KEY,
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
        """)


def save_complaint(complaint):
    with get_connection() as connection:
        connection.execute("""
            INSERT INTO complaints (
                id, title, description, location, anonymous,
                category, priority, sentiment, department,
                status, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            complaint["id"],
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
        ))


def get_all_complaints():
    with get_connection() as connection:
        rows = connection.execute("""
            SELECT * FROM complaints
            ORDER BY created_at DESC
        """).fetchall()

    return [
        {
            **dict(row),
            "anonymous": bool(row["anonymous"]),
            "createdAt": row["created_at"],
        }
        for row in rows
    ]