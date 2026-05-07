# IIIT Ranchi Faculty Feedback System

A production-grade, secure, and AI-powered Faculty Feedback Management System built for **IIIT Ranchi**. Enables students to submit anonymous feedback, faculty to view aggregated analytics, and administrators to manage the entire lifecycle — from bulk data ingestion to Gemini AI-powered teaching insights.

[![Node.js](https://img.shields.io/badge/Node.js-20_LTS-339933?logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://mongodb.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-1.5_Flash-4285F4?logo=google)](https://ai.google.dev)

---

## Features

- **Multi-channel Authentication** — Google OAuth 2.0 (domain-locked to `@iiitranchi.ac.in`), Email/Password, and OTP
- **Role-Based Access Control** — Admin, Faculty, Student portals with strict RBAC middleware
- **Bulk CSV Ingestion** — Upload students, faculty, and course assignments in one file
- **Feedback Time Windows** — Admin opens/closes feedback sessions with date enforcement
- **One-Attempt Rule** — Students can submit feedback exactly once per course (database + application layer)
- **8-Stage MongoDB Aggregation Pipeline** — Computes per-question, per-course averages for faculty
- **Full Anonymity** — `studentId` is stored only for lockout; it is never exposed to faculty or admin
- **Gemini AI Insights** — Analyzes student remarks and returns structured teaching strengths, improvements, and sentiment score
- **Admin Analytics** — Institute-wide stats and faculty leaderboard

---

## Tech Stack

| Layer          | Technology                                                      |
| -------------- | --------------------------------------------------------------- |
| Runtime        | Node.js 20 LTS                                                  |
| Framework      | Express.js 5.x                                                  |
| Database       | MongoDB Atlas (Mongoose 9)                                      |
| Authentication | JWT (HTTP-only cookie), Passport.js, Google OAuth 2.0, bcryptjs |
| AI             | Google Gemini 1.5 Flash (`@google/generative-ai`)             |
| File Uploads   | Multer (memory storage)                                         |
| CSV Parsing    | csv-parser                                                      |
| Security       | Helmet, express-rate-limit, CORS                                |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A MongoDB Atlas account
- A Google Cloud project with OAuth 2.0 credentials
- A Google Gemini API key

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Karn0511/iiitr-faculty-feedback.git
cd iiitr-faculty-feedback

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your actual values (see below)

# 4. Start the development server
npm run dev
```

### Environment Variables (`.env`)

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# MongoDB Atlas URI (include database name)
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/iiitr-feedback?appName=IIIT-Cluster

# JWT — generate with: node -e "require('crypto').randomBytes(64).toString('hex')"
JWT_SECRET=your_256bit_secret
JWT_EXPIRES_IN=1d

# Google OAuth 2.0 (https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# Google Gemini AI (https://aistudio.google.com)
GEMINI_API_KEY=your_gemini_api_key
```

---

## API Reference

### Health Check

| Method | Endpoint    | Auth | Description        |
| ------ | ----------- | ---- | ------------------ |
| GET    | `/health` | None | Server & DB status |

---

### Authentication — `/api/auth`

| Method | Endpoint                      | Auth | Description                  |
| ------ | ----------------------------- | ---- | ---------------------------- |
| POST   | `/api/auth/register`        | None | Register with email/password |
| POST   | `/api/auth/login`           | None | Login with email/password    |
| GET    | `/api/auth/logout`          | None | Clear JWT cookie             |
| POST   | `/api/auth/otp/request`     | None | Request OTP via phone        |
| POST   | `/api/auth/otp/verify`      | None | Verify OTP, receive JWT      |
| GET    | `/api/auth/google`          | None | Redirect to Google OAuth     |
| GET    | `/api/auth/google/callback` | None | OAuth callback handler       |
| GET    | `/api/auth/me`              | JWT  | Get current user info        |

---

### Admin — `/api/admin` *(Requires Admin role)*

#### Data Ingestion

| Method | Endpoint                          | Body                          | Description               |
| ------ | --------------------------------- | ----------------------------- | ------------------------- |
| POST   | `/api/admin/upload/students`    | `multipart/form-data` (CSV) | Bulk upload students      |
| POST   | `/api/admin/upload/faculty`     | `multipart/form-data` (CSV) | Bulk upload faculty       |
| POST   | `/api/admin/upload/assignments` | `multipart/form-data` (CSV) | Upload course assignments |

**CSV Formats:**

- **Students:** `name, email, phone (opt), section`
- **Faculty:** `name, email, phone (opt)`
- **Assignments:** `courseName, courseCode, facultyEmail, section`

#### Session Management

| Method | Endpoint                           | Body                                    | Description             |
| ------ | ---------------------------------- | --------------------------------------- | ----------------------- |
| POST   | `/api/admin/sessions`            | `{ sessionName, startDate, endDate }` | Create feedback session |
| GET    | `/api/admin/sessions`            | —                                      | List all sessions       |
| PATCH  | `/api/admin/sessions/:id/toggle` | —                                      | Open / close a session  |

#### Questionnaire Management

| Method | Endpoint                     | Body                   | Description            |
| ------ | ---------------------------- | ---------------------- | ---------------------- |
| POST   | `/api/admin/questions`     | `{ questionText }`   | Add a new question     |
| GET    | `/api/admin/questions`     | `?active=true\|false` | List all questions     |
| PATCH  | `/api/admin/questions/:id` | —                     | Toggle active/inactive |

#### Analytics

| Method | Endpoint                   | Description                                  |
| ------ | -------------------------- | -------------------------------------------- |
| GET    | `/api/admin/stats`       | Total students, faculty, feedback, avg score |
| GET    | `/api/admin/leaderboard` | Faculty ranked by average score (top 50)     |
| GET    | `/api/admin/users`       | All users (`?role=Student\|Faculty\|Admin`)  |

---

### Student — `/api/student` *(Requires Student role)*

| Method | Endpoint                         | Description                                  |
| ------ | -------------------------------- | -------------------------------------------- |
| GET    | `/api/student/courses`         | View courses with `feedbackSubmitted` flag |
| POST   | `/api/student/feedback`        | Submit feedback*(session must be open)*    |
| GET    | `/api/student/feedback/status` | Check which courses are already submitted    |

**POST `/api/student/feedback` body:**

```json
{
  "courseId": "ObjectId",
  "facultyId": "ObjectId",
  "ratings": [
    { "questionId": "ObjectId", "score": 8 }
  ],
  "remark": "Optional text comment"
}
```

---

### Faculty — `/api/faculty` *(Requires Faculty role)*

| Method | Endpoint                              | Description                                 |
| ------ | ------------------------------------- | ------------------------------------------- |
| GET    | `/api/faculty/dashboard`            | Per-course avg scores (8-stage pipeline)    |
| GET    | `/api/faculty/summary`              | Overall average + total responses           |
| GET    | `/api/faculty/question-trends`      | Score breakdown by question type            |
| GET    | `/api/faculty/remarks/:courseId`    | Anonymous text remarks (studentId excluded) |
| GET    | `/api/faculty/ai-summary/:courseId` | Gemini AI teaching insights                 |

**`/api/faculty/ai-summary/:courseId` response:**

```json
{
  "success": true,
  "remarksCount": 23,
  "data": {
    "insights": {
      "strengths": ["...", "...", "..."],
      "improvements": ["...", "..."],
      "overallSentiment": "Positive",
      "sentimentScore": 0.82,
      "summary": "..."
    }
  }
}
```

---

## Security Architecture

- **JWT** stored in `httpOnly` cookies — immune to XSS
- **`sameSite: strict`** — CSRF protection
- **Rate limiting** on auth routes (10 req/15 min for login; 3 req/min for OTP)
- **Domain lock** — Google OAuth rejects any non-`@iiitranchi.ac.in` accounts
- **bcrypt** (12 salt rounds) for password hashing
- **OTP** hashed with SHA-256 before DB storage; expires in 10 minutes
- **Anonymity** — `studentId` projected out of every faculty-facing response

---

## Project Structure

```
├── config/
│   ├── db.js            # MongoDB Atlas connection
│   └── passport.js      # Google OAuth + Local strategy
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   ├── facultyController.js
│   └── studentController.js
├── middlewares/
│   ├── authMiddleware.js    # protect + restrictTo RBAC
│   ├── sessionMiddleware.js # Time-window gate
│   └── uploadMiddleware.js  # Multer CSV config
├── models/
│   ├── Assignment.js
│   ├── Course.js
│   ├── Feedback.js
│   ├── FeedbackSession.js
│   ├── Questionnaire.js
│   └── User.js
├── routes/
│   ├── admin.js
│   ├── auth.js
│   ├── faculty.js
│   └── student.js
├── services/
│   └── aiService.js     # Gemini 1.5 Flash integration
├── server.js            # Express entry point
└── .env.example         # Environment variable template
```

---

## License

Ashutosh Karn — Built with ❤️ for IIIT Ranchi
