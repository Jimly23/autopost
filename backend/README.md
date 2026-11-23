# Automation — Social Media Management Backend

Backend API for the **Automation** platform — a SaaS application for social media management that lets users connect Instagram accounts, create content, and schedule posts via the official Meta Instagram API.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js |
| Database | MySQL |
| ORM | Prisma 7 |
| Auth | Session-based (HttpOnly cookies) |
| Instagram | Meta Graph API (Instagram Login) |
| Validation | Zod |
| Scheduling | node-cron |
| Testing | Vitest + Supertest |

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma           # Database schema
├── prisma.config.ts            # Prisma 7 config (datasource URL)
├── generated/                  # Prisma Client (auto-generated)
├── src/
│   ├── config/
│   │   ├── database.js         # Prisma client initialization
│   │   ├── env.js              # Environment variable loader
│   │   └── instagram.js        # Meta API configuration
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── instagram.controller.js
│   │   ├── post.controller.js
│   │   └── dashboard.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js   # Session authentication guard
│   │   ├── error.middleware.js  # Global error handler
│   │   └── validate.middleware.js  # Zod validation
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── instagram.routes.js
│   │   ├── post.routes.js
│   │   └── dashboard.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── instagram/
│   │   │   ├── oauth.service.js      # OAuth authorization & token exchange
│   │   │   ├── token.service.js      # Token encryption/storage/refresh
│   │   │   ├── profile.service.js    # Instagram profile fetching
│   │   │   └── publishing.service.js # Content Publishing API
│   │   └── post.service.js
│   ├── utils/
│   │   ├── api-response.js     # Standardized response helpers
│   │   ├── encryption.js       # AES-256-GCM token encryption
│   │   └── logger.js           # Winston logger
│   ├── app.js                  # Express app setup
│   ├── scheduler.js            # node-cron scheduled publisher
│   └── server.js               # Entry point
├── tests/
│   └── unit/                   # Unit tests (Vitest)
├── docs/
│   └── openapi.yaml            # OpenAPI 3.1 specification
├── .env.example
├── .gitignore
├── vitest.config.js
└── package.json
```

## Prerequisites

- **Node.js** ≥ 18
- **MySQL** ≥ 8.0
- **Meta Developer Account** with an Instagram App (for Instagram API features)

## Installation

```bash
# 1. Clone the repository
cd backend

# 2. Install dependencies
npm install

# 3. Copy environment file and configure
cp .env.example .env
# Edit .env with your values (see Configuration below)

# 4. Generate Prisma Client
npx prisma generate

# 5. Create database and run migrations
# First create the MySQL database:
#   mysql -u root -p -e "CREATE DATABASE automation_db;"
npx prisma migrate dev --name init

# 6. Start the server
npm run dev
```

## Configuration

### Environment Variables

Edit `.env` with the following values:

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | MySQL connection string | `mysql://root:password@localhost:3306/automation_db` |
| `SESSION_SECRET` | Session signing secret (random string) | `your-random-string-here` |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256 token encryption | `0123456789abcdef...` (64 hex chars) |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `BACKEND_URL` | Backend URL | `http://localhost:3000` |
| `META_APP_ID` | Meta App ID | *(from Meta Developer Console)* |
| `META_APP_SECRET` | Meta App Secret | *(from Meta Developer Console)* |
| `META_REDIRECT_URI` | OAuth callback URL | `http://localhost:3000/api/instagram/callback` |
| `META_API_VERSION` | Graph API version | `v21.0` |

### Generate a Secure Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Generate a Session Secret

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Database

### Prisma 7 Configuration

This project uses **Prisma 7**, which separates the database URL from the schema:

- **`prisma/schema.prisma`** — defines models without a URL
- **`prisma.config.ts`** — provides the DATABASE_URL to the Prisma CLI
- **`src/config/database.js`** — uses `@prisma/adapter-mariadb` driver adapter at runtime

### Commands

```bash
# Generate Prisma Client after schema changes
npm run db:generate

# Create a new migration
npm run db:migrate

# Apply migrations in production
npm run db:migrate:prod

# Push schema to database without migration (dev only)
npm run db:push

# Open Prisma Studio (visual database browser)
npm run db:studio
```

### Schema Overview

| Table | Purpose |
|---|---|
| `users` | Application users |
| `social_accounts` | Connected Instagram accounts |
| `social_tokens` | Encrypted access tokens |
| `posts` | Post content and scheduling |
| `publishing_logs` | Publishing activity audit trail |
| `sessions` | Express session store (auto-created) |

## Running the Server

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:3000`. Verify with:

```bash
curl http://localhost:3000/api/health
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/password` | Change password |

### Instagram

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/instagram/connect` | Start OAuth flow |
| GET | `/api/instagram/callback` | OAuth callback (from Instagram) |
| GET | `/api/instagram/accounts` | List connected accounts |
| GET | `/api/instagram/accounts/:id` | Get account details |
| DELETE | `/api/instagram/accounts/:id` | Disconnect account |
| GET | `/api/instagram/accounts/:id/profile` | Refresh profile from API |

### Posts

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/posts` | Create post |
| GET | `/api/posts` | List posts (with filters) |
| GET | `/api/posts/:id` | Get post detail |
| PUT | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/publish` | Publish immediately |
| GET | `/api/posts/:id/status` | Get publishing status |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/overview` | Dashboard statistics |

### Utility

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/csrf-token` | Get CSRF token |

Full API documentation: [`docs/openapi.yaml`](docs/openapi.yaml)

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

All Instagram API calls are mocked in tests — no real API calls are made.

## Meta / Instagram API Setup

> **⚠️ PENDING CONFIGURATION**: The Instagram OAuth and Publishing features require a configured Meta App. Follow these steps:

### 1. Create a Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app → Select **"Business"** type
3. Add the **"Instagram"** product (use **Instagram Login**, not Facebook Login)

### 2. Configure Instagram Login

1. In the Meta App Dashboard, go to **Instagram > Settings**
2. Add Valid OAuth Redirect URI: `http://localhost:3000/api/instagram/callback`
3. Note your **App ID** and **App Secret**
4. Set `META_APP_ID` and `META_APP_SECRET` in `.env`

### 3. Required Permissions

This app requests:
- `instagram_business_basic` — read profile and media
- `instagram_business_content_publish` — publish content

### 4. Add Test Users

1. In the Meta App Dashboard, go to **App Roles > Roles**
2. Add Instagram tester accounts
3. Each tester must accept the invitation from their Instagram settings

### 5. App Review

For production use beyond test users, you'll need to submit the app for Meta App Review for the requested permissions.

### Important Notes

- This app uses **Instagram Login** (not Facebook Login)
- The OAuth flow uses `https://www.instagram.com/oauth/authorize` (not `graph.facebook.com`)
- Short-lived tokens are automatically exchanged for long-lived tokens (60 days)
- Tokens are encrypted at rest using AES-256-GCM
- The scheduler checks for token expiry but does **not** auto-refresh — reconnection is required when tokens expire

## Security

- **Helmet** — HTTP security headers
- **CORS** — Configurable allowed origins
- **Rate limiting** — 100 req/15min general, 20/15min auth
- **CSRF protection** — Double-submit token pattern
- **Session cookies** — HttpOnly, Secure (prod), SameSite
- **Password hashing** — bcrypt with 12 salt rounds
- **Token encryption** — AES-256-GCM for Instagram access tokens
- **Input validation** — Zod schemas on all endpoints
- **SQL injection protection** — Prisma parameterized queries
- **Ownership validation** — All resources scoped to authenticated user
- **Error sanitization** — No stack traces or secrets in responses

## Post Scheduling

The scheduler runs every minute via `node-cron`:

1. Finds posts with status `scheduled` where `scheduledAt ≤ now`
2. Atomically sets status to `processing` (prevents duplicates)
3. Publishes via Instagram Content Publishing API
4. Updates status to `published` or `failed`
5. Logs all activity to `publishing_logs`
6. Retries up to 3 times on failure
7. Recovers stuck `processing` posts on server restart

## License

ISC
