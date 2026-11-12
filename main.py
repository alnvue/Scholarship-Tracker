from database import create_tables, add_scholarship, get_scholarships

create_tables()

add_scholarship("Test Scholarship", 1000.00, "2026-12-01", "3.0 GPA, essay")

for scholarship in get_scholarships():
    print(scholarship)