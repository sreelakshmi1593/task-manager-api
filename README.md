# TaskFlow — Scalable REST API with JWT Auth & RBAC

A production-ready full-stack task management application featuring JWT authentication, role-based access control, full CRUD, Swagger documentation, and a polished React frontend.

---

## Tech Stack

| Layer       | Technology                            |
|-------------|---------------------------------------|
| Backend     | Node.js, Express.js                   |
| Database    | SQLite (dev) → PostgreSQL (prod-ready)|
| Auth        | JWT (access + refresh tokens)         |
| Hashing     | bcryptjs (salt rounds: 12)            |
| Validation  | express-validator                     |
| Docs        | Swagger UI (swagger-jsdoc)            |
| Frontend    | React.js + Vite                       |
| HTTP Client | Axios (with interceptors)             |
| Security    | Helmet, CORS, express-rate-limit      |
| Logging     | Morgan                                |

---

## Project Structure

```
task-manager-api/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js      # DB init & schema
│   │   │   └── swagger.js       # OpenAPI spec config
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── taskController.js
│   │   │   └── adminController.js
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT verify + RBAC
│   │   │   ├── validation.js    # Input validators
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── tasks.js
│   │   │   └── admin.js
│   │   ├── utils/
│   │   │   ├── jwt.js           # Token generation/verify
│   │   │   └── response.js      # Consistent API responses
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx       # Sidebar navigation
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Global auth state
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TasksPage.jsx    # Full CRUD UI
│   │   │   └── AdminPage.jsx    # User management
│   │   ├── services/
│   │   │   └── api.js           # Axios + interceptors
│   │   └── App.jsx
│   └── package.json
│
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set JWT_SECRET to a long random string
npm run dev
```

Server runs on `http://localhost:5000`  
Swagger UI: `http://localhost:5000/api/docs`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000` (proxied to backend via Vite).

---

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint         | Auth | Description              |
|--------|------------------|------|--------------------------|
| POST   | /auth/register   | No   | Register new user        |
| POST   | /auth/login      | No   | Login, get tokens        |
| POST   | /auth/refresh    | No   | Refresh access token     |
| GET    | /auth/me         | Yes  | Get current user profile |
| PUT    | /auth/me         | Yes  | Update profile/password  |

### Tasks (`/api/v1/tasks`)

| Method | Endpoint         | Auth | Role       | Description                         |
|--------|------------------|------|------------|-------------------------------------|
| GET    | /tasks           | Yes  | user/admin | List tasks (user: own, admin: all)  |
| POST   | /tasks           | Yes  | user/admin | Create task                         |
| GET    | /tasks/:id       | Yes  | user/admin | Get single task                     |
| PUT    | /tasks/:id       | Yes  | user/admin | Update task                         |
| DELETE | /tasks/:id       | Yes  | user/admin | Delete task                         |
| GET    | /tasks/stats     | Yes  | admin only | Aggregated statistics               |

### Admin (`/api/v1/admin`)

| Method | Endpoint                    | Role  | Description           |
|--------|-----------------------------|-------|-----------------------|
| GET    | /admin/users                | admin | List all users        |
| GET    | /admin/users/:id            | admin | Get user by ID        |
| PATCH  | /admin/users/:id/toggle     | admin | Activate/deactivate   |
| PATCH  | /admin/users/:id/role       | admin | Change role           |
| DELETE | /admin/users/:id            | admin | Delete user           |

---

## Authentication Flow

```
1. Register  →  POST /auth/register  →  { accessToken, refreshToken, user }
2. Login     →  POST /auth/login     →  { accessToken, refreshToken, user }
3. API call  →  Header: Authorization: Bearer <accessToken>
4. Middleware verifies token, extracts { id, role }
5. RBAC middleware checks role before granting access
6. Token expired → POST /auth/refresh with refreshToken → new token pair
```

Access tokens expire in **7 days** (configurable). Refresh tokens expire in **30 days**.

---

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id         TEXT PRIMARY KEY,           -- UUID v4
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,              -- bcrypt hash
  role       TEXT DEFAULT 'user'         -- 'user' | 'admin'
             CHECK(role IN ('user','admin')),
  is_active  INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Tasks table
CREATE TABLE tasks (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT DEFAULT 'todo'
              CHECK(status IN ('todo','in_progress','done')),
  priority    TEXT DEFAULT 'medium'
              CHECK(priority IN ('low','medium','high')),
  due_date    TEXT,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- Indexes for query performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status   ON tasks(status);
CREATE INDEX idx_users_email    ON users(email);
```

> **Production**: Replace SQLite with PostgreSQL by changing the database driver. The schema and query patterns are SQL-standard and compatible.

---

## Security Practices

- **Password hashing**: bcrypt with cost factor 12 (~300ms per hash)
- **JWT dual-token**: short-lived access token + long-lived refresh token
- **Rate limiting**: 100 req/15min globally; 10 req/15min on auth routes
- **Helmet**: sets 14 security-related HTTP headers
- **Input validation**: all routes validated with express-validator before reaching controllers
- **CORS**: whitelist-based origin control
- **Role isolation**: users can only access/modify their own tasks; admin sees all
- **Sensitive data**: passwords never returned in any API response

---

## API Documentation

Interactive Swagger UI is available at:
```
http://localhost:5000/api/docs
```

Raw OpenAPI JSON:
```
http://localhost:5000/api/docs.json
```

All endpoints include request/response schemas, authentication requirements, and error codes.

---

## Scalability Notes

### Horizontal Scaling
The stateless JWT architecture means any number of backend instances can run behind a **load balancer** (e.g., AWS ALB, Nginx) without shared session state. Each request is self-contained.

### Database
- **Indexing**: Indexes on `user_id`, `email`, and `status` ensure O(log n) lookups on frequently queried columns.
- **PostgreSQL in production**: Connection pooling via `pg-pool` handles concurrent connections efficiently. Read replicas can serve GET-heavy workloads.

### Caching (Redis)
A Redis layer can be added in front of:
- `GET /tasks` (invalidated on write)
- `GET /auth/me` (invalidated on profile update)
- Rate-limit counters (replace in-memory store with Redis for multi-instance support)

### Microservices Path
The current modular structure (auth, tasks, admin as separate route/controller/model groups) maps cleanly to independent microservices:
- **Auth Service** → handles registration, login, token issuance
- **Task Service** → CRUD, owned by user context
- **Admin Service** → user lifecycle management
Each can be extracted into its own Express app with an API Gateway (Kong, AWS API Gateway) in front.

### Message Queues
Notifications, email verification, and audit logging should be offloaded to a queue (RabbitMQ / AWS SQS) to keep API response times fast.

### Docker

```dockerfile
# backend/Dockerfile (example)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
EXPOSE 5000
CMD ["node", "src/server.js"]
```

```yaml
# docker-compose.yml (example)
version: "3.9"
services:
  api:
    build: ./backend
    ports: ["5000:5000"]
    env_file: ./backend/.env
  frontend:
    build: ./frontend
    ports: ["3000:80"]
```

---

## Frontend Features

- **Protected routes**: JWT-gated via React Router + AuthContext
- **Auto token refresh**: Axios interceptor silently refreshes expired tokens
- **Role-aware UI**: Admin panel and stats visible only to admin users
- **Full CRUD**: Create, read, update, delete tasks with modal UI
- **Filtering**: Filter tasks by status, priority, and keyword search
- **Pagination**: Server-side pagination with navigation controls
- **Toast notifications**: Success/error feedback on all operations
- **Responsive design**: Works on desktop and mobile

---

## Bonus Features Implemented

- ✅ Morgan HTTP request logging
- ✅ Rate limiting (global + stricter on auth routes)
- ✅ Helmet security headers
- ✅ API versioning (`/api/v1/`)
- ✅ Refresh token rotation
- ✅ Consistent JSON response envelope (`{ success, message, data }`)
- ✅ Pagination on all list endpoints
- ✅ Search + filter on task list
- ✅ Global error handler middleware
- ✅ Environment-based error detail exposure
