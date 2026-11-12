import sqlite3


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

    cursor.execute(
        "UPDATE scholarships SET status = ? WHERE id = ?",
        (new_status, scholarship_id),
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