# WorkSphere

WorkSphere is a multi-tenant SaaS project management and subscription platform built with Node.js, Express, Prisma, and PostgreSQL. It features robust role-based access control (RBAC), organization management, subscription limits enforced by Stripe, and real-time cron jobs for time-based data states.

## Features

- **Multi-Tenancy**: Data isolation by organization context.
- **Authentication & Authorization**: JWT-based auth and granular RBAC (Owner, Admin, Member, Guest).
- **Organizations & Memberships**: Invite users to your org, manage their roles, and track memberships.
- **Project & Task Management**: Full CRUD operations scoped to organizations and controlled by RBAC.
- **Billing & Subscriptions**: Integration with Stripe for upgrading plans. Hard limits on projects, tasks, and members based on the active plan (Free, Pro, Enterprise).
- **Scheduled Jobs**: Automated cleanup and expiration of pending invitations and trials via `node-cron`.
- **Security**: Rate limiting, helmet security headers, and comprehensive global error handling.

## Tech Stack

- **Backend Framework**: Node.js & Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Billing**: Stripe (with webhook signature verification and idempotency)
- **Testing**: Jest & Supertest
- **Scheduling**: Node-cron

## Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally or via Docker)

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/worksphere?schema=public"
JWT_SECRET="your_jwt_secret"
JWT_EXPIRES_IN="1d"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup
Run Prisma migrations and seed the database with billing plans:
```bash
npm run db:migrate
npm run db:seed
```

### 5. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm run start
```

## Running Tests

The test suite covers integration tests across auth, organizations, memberships, billing limits, webhooks, and cross-tenant data isolation.
```bash
npm run test
```

## API Overview

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Authenticate and get JWT
- `POST /api/v1/organizations` - Create an organization (auto-assigns Free plan)
- `POST /api/v1/invitations` - Invite a user to an organization
- `POST /api/v1/projects` - Create a project within an org
- `POST /api/v1/tasks` - Create a task within a project
- `POST /api/v1/billing/checkout` - Create Stripe checkout session
- `POST /api/v1/billing/webhook` - Stripe webhook receiver

> Note: All organization-scoped endpoints require the `x-organization-id` header and a valid `Authorization: Bearer <token>` header.

## License
ISC