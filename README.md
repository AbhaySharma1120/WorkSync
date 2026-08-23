WorkSync

WorkSync is a full-stack project and team management platform built with the MERN stack. It helps teams manage projects, assign tasks, collaborate in real time, track progress, schedule events, and share files from one centralized workspace.

🌐 Live Demo: https://work-sync-brown.vercel.app
⚙️ Backend API: https://worksync-backend-nydl.onrender.com

Note: The backend is hosted on Render's free tier, so the first request after inactivity may take a little longer while the service wakes up.

Features

Secure user registration and login with JWT authentication

Protected application routes

Team-based workspace isolation

Role-based access control

Project creation, editing, deletion, filtering, and progress tracking

Task creation, assignment, priority, due dates, and status management

Drag-and-drop Kanban board

Real-time one-to-one team chat using Socket.IO

Online/offline presence indicators

Typing indicators and read receipts

Real-time unread chat badge

In-app notifications

Notification preference settings

Team member invitations and role management

Responsive team calendar

Configurable Monday/Sunday week start preference

Cloud-based file upload, download, and deletion using Cloudinary

Dashboard analytics and task/project summaries

Reports based on live project and task data

Responsive desktop and mobile interface

Profile, workspace, and password settings

Tech Stack

Frontend

React

Vite

JavaScript

Tailwind CSS

React Router

Axios

React Icons

React Hot Toast

Recharts

Socket.IO Client

Backend

Node.js

Express.js

MongoDB

Mongoose

JWT

bcryptjs

Socket.IO

Multer

Cloudinary

Deployment

Frontend: Vercel

Backend: Render

Database: MongoDB Atlas

File Storage: Cloudinary

Core Modules

Dashboard

Displays project totals, active/completed projects, task distribution, recent activity, project progress, and team statistics.

Projects

Project Managers can create, edit, and delete projects while team members can view project details and progress.

Tasks

Team members can create and update tasks, set priority and due dates, select projects and assignees, and track task status.

Kanban Board

Tasks are organized into Todo, In Progress, Review, and Completed columns and can be moved using drag-and-drop.

Team

Project Managers can invite members, manage roles, remove members, and view team task statistics.

Chat

Real-time team messaging includes:

online/offline presence

typing indicators

unread conversation counts

sent/read message states

multi-tab/device presence support

Calendar

Teams can create meetings, deadlines, reminders, and general events. The calendar is responsive and supports configurable week-start preferences.

Files

Files are uploaded through the backend and stored in Cloudinary. File metadata is stored in MongoDB for team-based access, download, filtering, and permission-controlled deletion.

Notifications

Users receive in-app notifications for project, task, team, and assignment activity. Notification preferences can be configured from Settings.

Reports

Shows project and task data in a reporting-focused interface for monitoring overall team progress.

Settings

Users can manage:

name and email

password

notification preferences

default task view

calendar week-start preference

Role-Based Access

Project Manager

Create/edit/delete projects

Create/update/delete tasks

Invite and manage team members

Change member roles

Remove team members

Manage calendar events

Delete team files when permitted

Team Members

View shared projects

Create and update tasks

Update Kanban task status

Chat with teammates

Create calendar events

Upload and download team files

Manage their own settings

Project Structure

WorkSync/
├── worksync/ # React + Vite frontend
│ ├── public/
│ ├── src/
│ │ ├── api/
│ │ ├── assets/
│ │ ├── components/
│ │ └── pages/
│ ├── .env
│ ├── package.json
│ └── vercel.json
│
├── server/ # Node.js + Express backend
│ ├── config/
│ ├── controllers/
│ ├── middleware/
│ ├── models/
│ ├── routes/
│ ├── .env
│ ├── package.json
│ └── server.js
│
├── screenshots/
└── README.md

Local Setup

1. Clone the repository

git clone https://github.com/YOUR_USERNAME/WorkSync.git
cd WorkSync

2. Install frontend dependencies

cd worksync
npm install

3. Create frontend environment variables

Create worksync/.env:

VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

4. Install backend dependencies

cd ../server
npm install

5. Create backend environment variables

Create server/.env:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLIENT_URL=http://localhost:5173,http://localhost:4173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

Never commit .env files or API secrets to GitHub.

6. Start the backend

npm run dev

7. Start the frontend

Open another terminal:

cd worksync
npm run dev

Production Environment Variables

Vercel

VITE_API_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com

Render

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=https://your-frontend-domain.com

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

API Overview

/api/auth
/api/dashboard
/api/projects
/api/tasks
/api/team
/api/notifications
/api/chat
/api/calendar
/api/files
/api/settings

Socket.IO is used alongside the REST API for real-time chat and presence features.

Security

Passwords are hashed using bcryptjs

JWT is required for protected backend routes

Frontend routes are protected for authenticated users

Team data is scoped by workspace/team owner

Role-based middleware restricts sensitive actions

Cloudinary credentials remain server-side

Environment variables are excluded from Git

Responsive Design

WorkSync is designed for desktop and mobile devices, including:

mobile sidebar navigation

responsive topbar actions

compact mobile calendar

responsive project/task layouts

mobile-friendly chat interface

responsive file and report views

Future Improvements

Group chat and project-specific channels

Email notifications

Deadline reminder scheduler

Activity audit log

Project attachments

Advanced report exports

Custom user avatars

Dark/light theme support

Author

Abhay Sharma
Full Stack Developer — MERN Stack

License

This project was built for learning, portfolio, and demonstration purposes.
