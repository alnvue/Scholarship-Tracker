import sqlite3
from datetime import date

COLUMNS = (
    "id, name, amount, deadline, requirements, status, "
    "submitted_date, provider, link, description, open_date, winner_date"
)


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

    new_columns = [
        "submitted_date",
        "provider",
        "link",
        "description",
        "open_date",
        "winner_date",
    ]
    for column in new_columns:
        try:
            cursor.execute(f"ALTER TABLE scholarships ADD COLUMN {column} TEXT")
        except sqlite3.OperationalError:
            pass  # column already exists

    conn.commit()
    conn.close()


def add_scholarship(
    name,
    amount,
    deadline,
    requirements,
    provider="",
    link="",
    description="",
    open_date="",
    winner_date="",
):
    conn = sqlite3.connect("scholarships.db")
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO scholarships "
        "(name, amount, deadline, requirements, provider, link, description, open_date, winner_date) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (name, amount, deadline, requirements, provider, link, description, open_date, winner_date),
    )

    conn.commit()
    conn.close()


def get_scholarships():
    conn = sqlite3.connect("scholarships.db")
    cursor = conn.cursor()

    cursor.execute(f"SELECT {COLUMNS} FROM scholarships")
    rows = cursor.fetchall()

    conn.close()
    return rows


def get_upcoming_scholarships():
    conn = sqlite3.connect("scholarships.db")
    cursor = conn.cursor()

    cursor.execute(
        f"SELECT {COLUMNS} FROM scholarships "
        "WHERE status != 'Submitted' ORDER BY deadline ASC"
    )
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


def delete_scholarship(scholarship_id):
    conn = sqlite3.connect("scholarships.db")
    cursor = conn.cursor()

    cursor.execute("DELETE FROM scholarships WHERE id = ?", (scholarship_id,))

    conn.commit()
    conn.close()

def update_scholarship(
    scholarship_id,
    name,
    amount,
    deadline,
    requirements,
    provider="",
    link="",
    description="",
    open_date="",
    winner_date="",
):
    conn = sqlite3.connect("scholarships.db")
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE scholarships SET name = ?, amount = ?, deadline = ?, requirements = ?, "
        "provider = ?, link = ?, description = ?, open_date = ?, winner_date = ? "
        "WHERE id = ?",
        (name, amount, deadline, requirements, provider, link, description, open_date, winner_date, scholarship_id),
    )

    conn.commit()
    conn.close()

if __name__ == "__main__":
    create_tables()
    print("Database ready!")