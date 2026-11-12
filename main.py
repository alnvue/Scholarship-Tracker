from database import create_tables, add_scholarship, get_scholarships

def show_menu():
    print("\n--- Scholarship Tracker ---")
    print("1. Add a Scholarship")
    print("2. View All Scholarships")
    print("3. Quit")

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

create_tables()

while True:
    show_menu()
    choice = input("Choose an option: ")
    if choice == "1":
        add_flow()
    elif choice == "2":
        view_flow()
    elif choice == "3":
        print("Goodbye!")
        break
    else:
        print("Please enter 1, 2, or 3.")