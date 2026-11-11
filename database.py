import sqlite3
def create_tables():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scholarships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            amount REAL,
            deadline TEXT,
            requirements TEXT,
            status TEXT DEFAULT 'Not Started'
        )
    ''')

    conn.commit()
    conn.close()
if __name__ == '__main__':
    create_tables()
    print("Database and tables created successfully.")