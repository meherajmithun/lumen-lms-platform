# Lumen LMS

A full-stack learning management system built with Next.js 16, TypeScript,
Tailwind CSS, Strapi 5, and SQLite for local development.

## Run locally

### Requirements

- Node.js 20 or 22
- npm

### 1. Clone and install

```bash
git clone https://github.com/meherajmithun/lms-platform-personal.git
cd lms-platform-personal

cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
node -e '
const c=require("crypto"), one=()=>c.randomBytes(32).toString("base64");
console.log("APP_KEYS="+Array.from({length:4},()=>c.randomBytes(16).toString("base64")).join(","));
for (const k of ["API_TOKEN_SALT","ADMIN_JWT_SECRET","TRANSFER_TOKEN_SALT","JWT_SECRET","ENCRYPTION_KEY"])
  console.log(k+"="+one());
'
```

Copy the generated values into `backend/.env`, replacing the blank values.
The default configuration uses SQLite, so no separate database is required.

### 3. Configure the frontend

```bash
cd ../frontend
cp .env.example .env.local
node -e 'console.log("SESSION_SECRET="+require("crypto").randomBytes(32).toString("base64"))'
```

Copy the generated `SESSION_SECRET` into `frontend/.env.local`.

### 4. Start the application

Run the backend first:

```bash
cd backend
npm run develop
```

In another terminal, run the frontend:

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The Strapi backend runs at
[http://localhost:1337](http://localhost:1337).

Demo users are created automatically. They all use the password `Passw0rd!`:

| Role | Email |
|---|---|
| Admin | `admin@lms.test` |
| Content Manager | `cm@lms.test` |
| Instructor | `instructor.a@lms.test` |
| Student | `student1@lms.test` |

## Features overview

- Authentication with Student, Instructor, Content Manager, and Admin roles.
- Backend-enforced permissions and instructor course ownership.
- Course management with ordered text and video lessons.
- Quiz and question management with secure server-side grading.
- Enrollment applications, payment information, and approval workflow.
- Student course access, sequential learning, and lesson completion tracking.
- Course progress, completed lesson/course views, and learning history.
- Saved quiz results and attempt history for students.
- Admin user and role management with platform statistics.
- Course-grouped lesson and enrollment details for administrators.
- Blog publishing, instructor requests, and student story moderation.
- Editable user profiles and responsive navy-themed light/dark interfaces.
