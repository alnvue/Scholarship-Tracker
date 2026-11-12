import sqlite3
from datetime import date

def create_tables():
    conn = sqlite3.connect("scholarships.db")
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scholarships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            amount REAL,
            deadline TEXT,
            requirements TEXT,
            status TEXT DEFAULT 'Not Started'
        )
    """)

    try:
        cursor.execute("ALTER TABLE scholarships ADD COLUMN submitted_date TEXT")
    except sqlite3.OperationalError:
        pass # column already exists

    conn.commit()
    conn.close()


def add_scholarship(name, amount, deadline, requirements):
    conn = sqlite3.connect("scholarships.db")
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO scholarships (name, amount, deadline, requirements) VALUES (?, ?, ?, ?)",
        (name, amount, deadline, requirements),
    )

    conn.commit()
    conn.close()


def get_scholarships():
    conn = sqlite3.connect("scholarships.db")
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM scholarships")
    rows = cursor.fetchall()

    conn.close()
    return rows

def update_status(scholarship_id, new_status):
    conn = sqlite3.connect("scholarships.db")
    cursor = conn.cursor()

    if new_status == "Submitted":
        submitted_date = date.today().isoformat()
    else:
        submitted_date = None

    cursor.execute(
        "UPDATE scholarships SET status = ?, submitted_date = ? WHERE id = ?",
        (new_status, submitted_date, scholarship_id),
    )

    conn.commit()
    conn.close()

def get_upcoming_scholarships():
    conn = sqlite3.connect("scholarships.db")
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM scholarships WHERE status != 'Submitted' ORDER BY deadline ASC"
    )
    rows = cursor.fetchall()

    conn.close()
    return rows

if __name__ == "__main__":
    create_tables()
    print("Database ready!")