<div align="center">

<br/>

<img src="https://img.shields.io/badge/IIIT%20Ranchi-Faculty%20Feedback%20System-6366f1?style=for-the-badge&labelColor=0f172a" alt="IIIT Ranchi Faculty Feedback System"/>

<br/><br/>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20%20LTS-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Angular-18-DD0031?style=flat-square&logo=angular&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini-1.5%20Flash-4285F4?style=flat-square&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Secured-F59E0B?style=flat-square&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" />
</p>

<p align="center">
  <a href="https://iiitr-faculty-feedback.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/🌐%20Live%20Demo-iiitr--faculty--feedback.vercel.app-6366f1?style=for-the-badge&labelColor=0f172a" />
  </a>
</p>

<br/>

> **A production-grade, full-stack, AI-powered Faculty Feedback Management System** built for IIIT Ranchi.  
> Students submit anonymous feedback · Faculty get AI-driven teaching insights · Admins control everything from one dashboard.

<br/>

---

</div>

## 📸 System Overview

| Portal | Role | Key Capabilities |
|--------|------|-----------------|
| 🔐 **Auth** | All | Google OAuth (domain-locked), Email/Password, Sandbox profiles, Boot screen animation |
| 🎓 **Student** | Student | View assigned courses, submit anonymous feedback with ratings, status tracker, confetti on completion |
| 📊 **Faculty** | Faculty | Per-course score analytics, question trend charts, anonymous remarks, Gemini AI teaching insights |
| ⚙️ **Admin** | Admin | Live dashboard, bulk CSV ingestion, AI raw text importer, session scheduling, questionnaire control, faculty leaderboard |

---

## ✨ Feature Highlights

### 🔐 Authentication & Security
- **Google OAuth 2.0** — locked to `@iiitranchi.ac.in` domain only
- **Email / Password** with bcrypt (12 salt rounds)
- **JWT** stored in `httpOnly` + `sameSite: strict` cookies — XSS and CSRF immune
- **Rate limiting** — 10 req / 15 min on login, 3 req / min on OTP
- **Force password reset** flow for first-login accounts
- **OTP** hashed with SHA-256 before DB storage; expires in 10 minutes

### 🎓 Student Experience
- Course registry loaded per-section / per-semester
- **One-submission lock** enforced at both application and database layers
- Anonymous feedback with numerical ratings and optional remarks
- Confetti animation and celebration screen on successful submission
- **Feedback status tracker** — see which courses are done

### 📊 Faculty Analytics
- **8-stage MongoDB Aggregation Pipeline** computing per-question and per-course averages
- Question trend breakdown (performance over multiple questions)
- Anonymous remarks viewer — `studentId` is never exposed
- **Gemini 1.5 Flash AI Insights** — structured JSON with strengths, improvements, sentiment score, and a human-readable summary

### ⚙️ Admin Control Center
- Real-time stats: total students, faculty, feedback submissions, institute-wide average score
- **Bulk CSV Ingestion** for students, faculty, and course assignments
- **✨ AI Raw Text Importer** — paste unstructured text (email, PDF copy), Gemini structures it into importable JSON with a live editable preview table
- Glassmorphism custom **date-range calendar** for scheduling feedback sessions
- Faculty leaderboard ranked by average score (top 50)
- Questionnaire bank — add questions, soft-toggle active/inactive without losing historical data

---

## 🏗️ Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 LTS |
| Framework | Express.js 5.x |
| Database | MongoDB Atlas (Mongoose 9) |
| Authentication | Passport.js · JWT · bcryptjs · Google OAuth 2.0 |
| AI Integration | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| File Uploads | Multer (memory storage — no disk writes) |
| CSV Parsing | csv-parser (streaming) |
| Security | Helmet · express-rate-limit · CORS · cookie-parser |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Angular 18 (standalone components, signals) |
| Styling | Tailwind CSS 3.x · custom glassmorphism design system |
| State | Angular Signals (`signal()`, `computed()`) |
| HTTP | Angular `HttpClient` + custom auth interceptor |
| Fonts | Inter + JetBrains Mono (Google Fonts) |
| Animations | CSS keyframes · micro-interactions |
| Canvas | WebGL-style mesh shader background (Canvas 2D API) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- MongoDB Atlas account (free tier works)
- Google Cloud project with OAuth 2.0 credentials
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### 1 · Clone & Install

```bash
git clone https://github.com/Karn0511/iiitr-faculty-feedback.git
cd iiitr-faculty-feedback

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2 · Configure Environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
# ── Server ──────────────────────────────────────
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:4200

# ── MongoDB Atlas ────────────────────────────────
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/iiitr-feedback?appName=IIIT-Cluster

# ── JWT ─────────────────────────────────────────
# Generate: node -e "require('crypto').randomBytes(64).toString('hex')"
JWT_SECRET=your_256bit_secret_here
JWT_EXPIRES_IN=1d

# ── Google OAuth 2.0 ─────────────────────────────
# Create at: https://console.cloud.google.com → APIs & Services → Credentials
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ── Gemini AI ────────────────────────────────────
# Get free key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key
```

### 3 · Seed Demo Data *(optional)*

```bash
node seed_demo_data.js
```

This seeds:
- 1 Admin account · 6 Faculty accounts · 16 Student accounts
- Sample courses, assignments, feedback sessions, and questionnaire questions

### 4 · Start Development

```bash
# Terminal 1 — Backend API (port 5000)
npm run dev

# Terminal 2 — Angular frontend (port 4200)
cd frontend && npm run start
```

Open **[http://localhost:4200](http://localhost:4200)** in your browser.

> 💡 **Quick login:** Use the **Sandbox Credentials** card on the login page. Tap to auto-fill random demo accounts for any role. Tap again to shuffle to a different account!

---

## 📡 API Reference

### Health Check

```
GET /health
```
Returns server status, MongoDB connectivity, RAM usage, CPU load average, and uptime. Renders a beautiful HTML telemetry dashboard when visited from a browser.

---

### 🔐 Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Register with email & password |
| `POST` | `/api/auth/login` | — | Login, receive JWT cookie |
| `GET` | `/api/auth/logout` | — | Clear JWT cookie |
| `POST` | `/api/auth/otp/request` | — | Request OTP via phone |
| `POST` | `/api/auth/otp/verify` | — | Verify OTP, receive JWT |
| `GET` | `/api/auth/google` | — | Redirect to Google OAuth |
| `GET` | `/api/auth/google/callback` | — | OAuth callback handler |
| `GET` | `/api/auth/me` | ✅ JWT | Get current authenticated user |

---

### ⚙️ Admin — `/api/admin` *(Admin role required)*

#### Data Ingestion

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/upload/students` | Bulk upload students via CSV |
| `POST` | `/api/admin/upload/faculty` | Bulk upload faculty via CSV |
| `POST` | `/api/admin/upload/assignments` | Upload course-faculty assignments via CSV |
| `POST` | `/api/admin/ingest-ai` | AI-structured ingestion from raw text |
| `POST` | `/api/admin/upload/json/:type` | Finalize AI-previewed data to database |
| `GET` | `/api/admin/templates/:filename` | Download blank CSV template |

**CSV column formats:**

```
Students:    Name, Email, RollNo, Section, Semester
Faculty:     Name, Email
Assignments: FacultyEmail, CourseCode, Section, Semester
```

#### Feedback Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/sessions` | Create a new feedback window |
| `GET` | `/api/admin/sessions` | List all sessions |
| `PATCH` | `/api/admin/sessions/:id/toggle` | Open / close a session |

#### Questionnaire

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/questions` | Add a question to the bank |
| `GET` | `/api/admin/questions` | List questions (`?active=true\|false`) |
| `PATCH` | `/api/admin/questions/:id` | Toggle question active/inactive |

#### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/stats` | Institute-wide stats (students, faculty, feedback count, avg score) |
| `GET` | `/api/admin/leaderboard` | Faculty ranked by avg score (top 50) |
| `GET` | `/api/admin/users` | All users (`?role=Student\|Faculty\|Admin`) |

---

### 🎓 Student — `/api/student` *(Student role required)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/student/courses` | My assigned courses with submission status |
| `POST` | `/api/student/feedback` | Submit feedback (session must be open, one-time only) |
| `GET` | `/api/student/feedback/status` | Per-course submission status |

**Feedback payload:**
```json
{
  "courseId": "ObjectId",
  "facultyId": "ObjectId",
  "ratings": [
    { "questionId": "ObjectId", "score": 8 }
  ],
  "remark": "Optional anonymous text comment"
}
```

---

### 📊 Faculty — `/api/faculty` *(Faculty role required)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/faculty/dashboard` | Per-course average scores (8-stage aggregation pipeline) |
| `GET` | `/api/faculty/summary` | Overall institute average + total responses |
| `GET` | `/api/faculty/question-trends` | Score breakdown per question across all courses |
| `GET` | `/api/faculty/remarks/:courseId` | Anonymous text remarks (studentId stripped) |
| `GET` | `/api/faculty/ai-summary/:courseId` | Gemini AI teaching insights |

**AI summary response shape:**
```json
{
  "success": true,
  "remarksCount": 23,
  "data": {
    "insights": {
      "strengths": ["Clear explanations", "Approachable"],
      "improvements": ["More practice problems", "Faster doubt resolution"],
      "overallSentiment": "Positive",
      "sentimentScore": 0.82,
      "summary": "Students appreciate the teaching style..."
    }
  }
}
```

---

## 🗂️ Project Structure

```
iiitr-faculty-feedback/
│
├── 📁 config/
│   ├── db.js                  # MongoDB Atlas connection with retry logic
│   └── passport.js            # Google OAuth + Local strategy configuration
│
├── 📁 controllers/
│   ├── adminController.js     # CSV ingestion, AI importer, sessions, analytics
│   ├── authController.js      # Register, login, OTP, Google OAuth callbacks
│   ├── facultyController.js   # Dashboard pipeline, AI insights, remarks
│   └── studentController.js   # Course listing, feedback submission & lock
│
├── 📁 middlewares/
│   ├── authMiddleware.js      # protect() + restrictTo() RBAC guards
│   ├── sessionMiddleware.js   # Feedback time-window enforcement
│   └── uploadMiddleware.js    # Multer in-memory CSV configuration
│
├── 📁 models/
│   ├── Assignment.js          # Faculty ↔ Course ↔ Section relational mapping
│   ├── Course.js              # Course registry
│   ├── Feedback.js            # Anonymized student feedback with ratings array
│   ├── FeedbackSession.js     # Time-bound feedback windows
│   ├── Questionnaire.js       # Question bank (soft-toggle, never deleted)
│   └── User.js                # Students, Faculty, Admin with role discrimination
│
├── 📁 routes/
│   ├── admin.js               # All /api/admin/* endpoints
│   ├── auth.js                # All /api/auth/* endpoints
│   ├── faculty.js             # All /api/faculty/* endpoints
│   └── student.js             # All /api/student/* endpoints
│
├── 📁 services/
│   └── aiService.js           # Gemini 1.5 Flash prompt engineering
│
├── 📁 frontend/               # Angular 18 SPA
│   └── src/app/
│       ├── 📁 core/           # Guards, interceptors, services, models
│       ├── 📁 features/       # Auth, Admin, Faculty, Student modules
│       └── 📁 shared/         # Navbar, reusable components
│
├── server.js                  # Express entry point + health dashboard
├── seed_demo_data.js          # Full sandbox seeder script
└── .env.example               # Environment variable template
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Request  →  Helmet (headers)  →  CORS  →  Rate Limiter        │
│           →  Cookie Parser     →  JWT Verify (protect)         │
│           →  RBAC Check (restrictTo)  →  Controller            │
└─────────────────────────────────────────────────────────────────┘
```

| Layer | Implementation |
|-------|---------------|
| Token storage | `httpOnly` cookie — XSS immune |
| CSRF protection | `sameSite: strict` cookie policy |
| Password hashing | bcrypt with 12 salt rounds |
| OTP security | SHA-256 hashed, 10-minute TTL |
| Google OAuth | Domain-locked to `@iiitranchi.ac.in` only |
| Rate limiting | Auth: 10 req/15 min · OTP: 3 req/min |
| Anonymity | `studentId` projected out of all faculty-facing queries |
| Headers | Helmet sets CSP, HSTS, X-Frame-Options, and more |

---

## 🌐 Deployment

The system is deployed on:

| Service | URL |
|---------|-----|
| **Frontend** | [iiitr-faculty-feedback.vercel.app](https://iiitr-faculty-feedback.vercel.app) |
| **Backend API** | Render (Node.js web service) |
| **Database** | MongoDB Atlas (M0 free cluster) |

### Deploy Frontend to Vercel

```bash
cd frontend
npm run build
# Push to GitHub → connect repo to Vercel → auto-deploy
```

### Deploy Backend to Render

1. Connect your GitHub repo
2. Build command: `npm install`
3. Start command: `node server.js`
4. Add all `.env` variables in the Render dashboard

---

## 🎭 Demo Accounts

After running `node seed_demo_data.js`, the following sandbox accounts are available:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@iiitranchi.ac.in` | `admin123` |
| **Faculty** | `rk.singh@iiitranchi.ac.in` | `faculty123` |
| **Faculty** | `sneha.das@iiitranchi.ac.in` | `faculty123` |
| **Student** | `aarav.sharma@iiitranchi.ac.in` | `IIITR@2026` |
| **Student** | `ananya.verma@iiitranchi.ac.in` | `IIITR@2026` |

> 💡 Or just use the **🎲 Random** sandbox button on the login page — it auto-fills a random account from the full pool of 16 students, 6 faculty, and 1 admin.

---

## 🧠 AI Integration Details

The Gemini 1.5 Flash model is used in two distinct ways:

### 1. Faculty AI Insights (`GET /api/faculty/ai-summary/:courseId`)
Collects all anonymous text remarks for a course and sends them to Gemini with a structured prompt. Returns a JSON object with:
- **Strengths** (array of teaching positives)
- **Improvements** (array of actionable suggestions)
- **Overall Sentiment** (Positive / Neutral / Negative)
- **Sentiment Score** (0.0 – 1.0)
- **Summary** (human-readable paragraph)

### 2. Admin AI Raw Text Importer (`POST /api/admin/ingest-ai`)
Accepts unstructured text (e.g. pasted from an email, PDF, or spreadsheet) and uses a strict schema-aware prompt to extract and return a clean JSON array matching the selected entity type (students / faculty / assignments). The admin can review and edit all rows in an inline preview table before committing to the database.

---

## 📄 License

```
MIT License — Ashutosh Karn
Built with ❤️ for IIIT Ranchi
```

<div align="center">

<br/>

**[⬆ Back to top](#)**

<br/>

Made by **[Ashutosh Karn](https://github.com/Karn0511)** · IIIT Ranchi · 2026

</div>
