# PolicyFlow — Insurance Policy Management System

A full-stack web application that simulates insurance onboarding and policy issuance workflows with separate **Admin** and **Agent** roles, secure cookie-based authentication, backend business-rule validation, PII masking, and Jest unit tests.

## Tech Stack

| Layer      | Technology                            |
| ---------- | ------------------------------------- |
| Backend    | Node.js, Express.js                   |
| Frontend   | React, TypeScript, Vite, Tailwind CSS |
| Database   | MongoDB (Atlas-ready)                 |
| Auth       | Cookie-based sessions (15 min expiry) |
| API Client | Axios                                 |
| Testing    | Jest, Supertest                       |

## Project Structure

```
policyflow/
├── backend/          # Express REST API
│   ├── src/
│   │   ├── config/   # Database connection
│   │   ├── models/   # Mongoose schemas
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/    # Validation & PII masking
│   └── tests/        # Jest unit & API tests
└── frontend/         # React + TypeScript SPA
    └── src/
        ├── api/
        ├── components/
        ├── context/
        └── pages/
```

## Prerequisites

- Node.js 18+
- MongoDB (local) or [MongoDB Atlas](https://www.mongodb.com/atlas) account

## Local Setup

### 1. Clone and install dependencies

```bash
cd policyflow/backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment variables

**Backend** — copy and edit:

```bash
cd backend
cp .env.example .env
```

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/policyflow
SESSION_SECRET=your-long-random-secret
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@policyflow.com
ADMIN_PASSWORD=Admin@123
```

**Frontend** — copy and edit:

```bash
cd frontend
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Seed the default Admin user

```bash
cd backend
npm run seed
```

### 4. Start the application

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

### Default Admin Credentials

| Field    | Value                  |
| -------- | ---------------------- |
| Email    | `admin@policyflow.com` |
| Password | `Admin@123`            |

Create Agent accounts from the Admin dashboard, then log in as an Agent.

## MongoDB Atlas Setup (for deployment)

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user with read/write access.
3. Whitelist your IP (or `0.0.0.0/0` for cloud deployment).
4. Copy the connection string and set it in backend `.env`:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/policyflow?retryWrites=true&w=majority
```

5. Run `npm run seed` once against the Atlas database to create the Admin user.

## API Endpoints

### Auth

| Method | Endpoint           | Description                   |
| ------ | ------------------ | ----------------------------- |
| POST   | `/api/auth/login`  | Login (email, password, role) |
| POST   | `/api/auth/logout` | Logout and clear session      |
| GET    | `/api/auth/me`     | Get current user              |

### Admin (requires admin role)

| Method | Endpoint                | Description                               |
| ------ | ----------------------- | ----------------------------------------- |
| POST   | `/api/admin/agents`     | Create agent                              |
| GET    | `/api/admin/agents`     | List agents (paginated, filter by status) |
| DELETE | `/api/admin/agents/:id` | Deactivate agent                          |

### Agent (requires agent role)

| Method | Endpoint                             | Description            |
| ------ | ------------------------------------ | ---------------------- |
| POST   | `/api/customers`                     | Create customer        |
| GET    | `/api/customers/search?q=`           | Search customers       |
| GET    | `/api/customers/:id`                 | Get customer details   |
| PUT    | `/api/customers/:id`                 | Update customer        |
| POST   | `/api/policies/issue`                | Issue policy           |
| GET    | `/api/policies/customer/:customerId` | List customer policies |

## Business Rules (backend-enforced)

1. Customer age: 18–65 years
2. PAN mandatory if premium > ₹50,000
3. Nominee required and cannot equal policyholder
4. Mobile: 10 digits, starts with 6/7/8/9
5. Aadhaar: exactly 12 digits
6. Policy term: 10, 15, 20, 25, or 30 years
7. Premium frequency: Monthly, Quarterly, Half-Yearly, Yearly
8. Minimum premium: ₹5,000
9. Policy start date cannot be in the past
10. PAN and Aadhaar must be unique
11. Policy owning Agent cannot be changed after issuance

## PII Masking

List, search, and detail responses mask sensitive fields:

| Field   | Example      | Masked         |
| ------- | ------------ | -------------- |
| Aadhaar | 123456789012 | XXXX-XXXX-9012 |
| PAN     | ABCDE1234F   | ABCXX12XXF     |
| Mobile  | 9876543210   | 98XXXXXX10     |

## Running Tests

```bash
cd backend
npm test
```

Expected result:

```text
Test Suites: 2 passed, 2 total
Tests:       36 passed, 36 total
```

Tests cover:

- Business rule validation utilities
- PII masking functions
- Auth API (login, role checks)
- Logout and 15-minute session configuration
- Customer creation, updates, masking, and PAN/Aadhaar duplicate checks
- Policy issuance validation and Agent ownership isolation
- Agent deactivation, pagination, status filters, and Admin route access control

## Local Status and Deployment Note

The application has been tested locally: the frontend build completes successfully and all 36 Jest tests pass.

When deploying the frontend and backend to different domains, CORS and cookies need to be configured correctly. If these values do not match, browser requests can be blocked even though the application works locally.

Set the following environment variables on the deployed backend:

```env
NODE_ENV=production
CLIENT_URL=https://policyflow-nine.vercel.app/
SESSION_SECRET=use-a-long-random-secret
```

Set the following environment variable on the deployed frontend:

```env
VITE_API_URL=(https://policyflow-evij.onrender.com)
```

Important deployment checks:

- `CLIENT_URL` must exactly match the deployed frontend URL, including `https://` and without a trailing slash.
- The frontend request client must keep `withCredentials: true` enabled (already configured in this project).
- The backend must allow credentials through CORS and use `sameSite: 'none'` with secure cookies in production (already configured when `NODE_ENV=production`).
- If you use Vercel preview URLs, add each preview origin to `CLIENT_URL` as a comma-separated value, or test using the production URL.

## Deployment Guide

### Backend (Render / Railway)

1. Push code to GitHub.
2. Create a new Web Service pointing to `backend/`.
3. Set environment variables:
   - `MONGODB_URI` — Atlas connection string
   - `SESSION_SECRET` — long random string
   - `CLIENT_URL` — your frontend URL (e.g. `https://policyflow.vercel.app`)
   - `NODE_ENV=production`
4. Build command: `npm install`
5. Start command: `npm start`
6. Run seed once via shell: `npm run seed`

### Frontend (Vercel)

1. Import the repo, set root to `frontend/`.
2. Set environment variable:
   - `VITE_API_URL=https://your-backend.onrender.com/api`
3. Deploy.

> **CORS note:** For cross-origin cookies in production, ensure `CLIENT_URL` on the backend matches your frontend origin exactly, and `sameSite: 'none'` + `secure: true` are set (already configured when `NODE_ENV=production`).

## Role Summary

| Role      | Capabilities                                                   |
| --------- | -------------------------------------------------------------- |
| **Admin** | Create/view/deactivate agents, read-only system visibility     |
| **Agent** | Full customer lifecycle — search, create, edit, issue policies |

Agents can only access their own customers and policies. Admins cannot create customers or policies.

## License

MIT — built for HDFC Life Full Stack Assignment FY 2026-2027.
