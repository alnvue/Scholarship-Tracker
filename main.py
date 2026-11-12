from datetime import date 
from database import create_tables, add_scholarship, get_scholarships, update_status, get_upcoming_scholarships

def show_menu():
    print("\n--- Scholarship Tracker ---")
    print("1. Add a scholarship")
    print("2. View all scholarships")
    print("3. Update status")
    print("4. Upcoming deadlines")
    print("5. Quit")

def add_flow():
    name = input("Scholarship name: ")
    amount = float(input("Amount ($): "))
    deadline = input("Deadline (YYYY-MM-DD): ")
    requirements = input("Requirements: ")
    
    add_scholarship(name, amount, deadline, requirements)
    print("Saved!")

def view_flow():
    scholarships = get_scholarships()

    if not scholarships:
        print("No scholarships found.")
        return
    for s in scholarships:
        print(f'{s[0]}. {s[1]} | Amount: ${s[2]} | Deadline: {s[3]} | Requirements: {s[4]} | Status: {s[5]}')

def update_flow():
    view_flow()
    scholarship_id = int(input("Enter the ID to Update: "))

    print("1. Not Started")
    print("2. In Progress")
    print("3. Submitted")
    choice = input("New status: ")

    statuses = {"1": "Not Started", "2": "In Progress", "3": "Submitted"}

    if choice in statuses:
        update_status(scholarship_id, statuses[choice])
        print("Updated!")
    else: 
        print("Invalid choice.")

def deadlines_flow():
    scholarships = get_upcoming_scholarships()

    if not scholarships:
        print("Nothing due. You're all caught up!")
        return
    today = date.today()

    for s in scholarships:
        due = date.fromisoformat(s[3])
        days_left = (due - today).days

        if days_left < 0:
            label = f'OVERDUE by {-days_left} days'
        elif days_left == 0:
            label = "DUE TODAY"
        else:
            label = f"{days_left} days left"

        print(f"{s[1]} | Due: {s[3]} | {label} | {s[5]}")

create_tables()

while True:
    show_menu()
    choice = input("Choose an option: ")
    if choice == "1":
        add_flow()
    elif choice == "2":
        view_flow()
    elif choice == "3":
        update_flow()
    elif choice == "4":
        deadlines_flow()
    elif choice == "5":
        print("Goodbye!")
        break
    else:
        print("Please enter 1, 2, 3, 4, or 5.")
    