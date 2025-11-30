Admin Dashboard with Analytics & Reporting

This project is a full-stack admin dashboard application developed using the MERN stack (MongoDB, Express.js, React, Node.js).

It provides secure authentication, user role management, and interactive analytics visualization such as charts and metrics.
The backend and frontend are structured separately in the same project.

Features
Admin Authentication  

A secure JWT-based login system that verifies admin credentials before accessing the dashboard.

User Management 

Admins can manage users with the following actions:

View all registered users

Delete user accounts

Toggle Active/Inactive status

View roles and metadata such as join date and email

Dashboard Analytics

The dashboard includes dynamic charts and statistics:

Sales trend visualization

User sign-up growth analytics

Revenue chart

User status distribution (Pie chart)

Data Seeding (Sample Data)

The dashboard allows generating:

Sample users

Sample analytics data

This helps demonstrate dashboard functionality without manual database entry.

Responsive UI

The interface adjusts smoothly across desktops, tablets, and mobile screens.
Sidebar navigation remains fixed while content scrolls independently.

Tech Stack
Frontend

React.js (Vite)

Axios

Recharts

Tailwind CSS

Lucide Icons

Backend

Node.js

Express.js

MongoDB with Mongoose

JSON Web Tokens (JWT)

Bcrypt authentication

Project Structure
admin-dashboard/
  backend/
    models/
    middleware/
    routes/
    server.js
    package.json
    .env.example

  frontend/
    public/
    src/
      services/
      components/
      AdminDashboard.jsx
      App.jsx
      main.jsx
    package.json
    .env.example

  README.md

Setup Instructions (Local Development)
1. Clone the Repository
git clone https://github.com/yourusername/admin-dashboard.git
cd admin-dashboard

2. Backend Setup
Install dependencies:
cd backend
npm install

Create .env file (based on .env.example):
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

Start the backend:
npm start


Backend will run at:

http://localhost:5000

Seed Database (Required Before Login)

Run the following URL in a browser:

http://localhost:5000/api/seed


This creates a default admin account:

Email: admin@example.com
Password: admin123

3. Frontend Setup

Open a new terminal:

Install dependencies:
cd frontend
npm install

Create .env file (optional):
VITE_API_URL=http://localhost:5000

Start the frontend:
npm run dev


Frontend will run at:

http://localhost:5173

Notes

Login is required to view dashboard features.

Token is stored in browser localStorage.

Sample user and analytics generation buttons are provided for demonstration.

If MongoDB collection is cleared, you must run /api/seed again.

Drawbacks / Limitations

Only admin login exists — no signup portal.

Charts update on page load but not in real-time.

Advanced report export and filtering are not yet implemented.

Real-World Relevance

This project covers core principles used in modern business admin dashboards such as:

Authentication and role-based access

CRUD user management

Data visualization for decision-making

Responsive dashboard UI design

This architecture is similar to dashboards used in CRM systems, analytics platforms, e-commerce admin panels, and SaaS tools.

License

This project is created for academic and learning purposes.