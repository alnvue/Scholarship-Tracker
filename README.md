# Scholarship-Tracker

Full-stack scholarship management application built with React, Python, and SQLite. It tracks scholarship deadlines, requirements, application statuses, and submission dates in one place.

## Features

- Add scholarships with amount, deadline, and requirements
- Track application status (Not Started, In Progress, Applied, Submitted)
- Automatic submission date when an application is marked Submitted
- Upcoming deadlines with days remaining (terminal version)
- Data saved in a local SQLite database

## Tech Stack

- **Frontend:** React (Vite)
- **Backend:** Python, Flask
- **Database:** SQLite
- **Tools:** Git, GitHub

## How to Run

**1. Backend**

```
pip install flask flask-cors
python app.py
```

The API runs at http://127.0.0.1:5000.

**2. Frontend** (in a second terminal)

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Terminal Version

You can also use the app from the command line:

```
python main.py
```