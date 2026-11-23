# Automation Backend (Laravel 12)

Re-implementation of the **Automation SaaS Backend** using **Laravel 12** (`laravel/framework:^12.0`, PHP 8.3+, MySQL).
This backend has 100% API and schema parity with the Express.js implementation.

---

## 🚀 Features

- **Framework**: Laravel 12.73.0 (PHP 8.3)
- **Database**: MySQL database named `automatian_db_laravel`
- **Authentication**: Session/cookie-based SPA auth (`/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`)
- **Instagram Graph API**:
  - Unified Login OAuth flow (`config_id` integration)
  - Business profile discovery via `/me/assigned_instagram_accounts` & `/me/accounts`
  - AES-256-GCM token encryption interoperable with Node.js format (`iv:authTag:ciphertext`)
  - Cross-domain CSRF-safe state encryption
- **Post & Reel Publishing**:
  - Single photo publishing via Meta Container API
  - Video Reels publishing (`media_type=REELS`, `share_to_feed=true`) with asynchronous status polling
  - Optimistic locking and audit logging (`publishing_logs`)
- **Scheduler**:
  - Artisan command: `php artisan posts:process-scheduled --recover`
  - Runs every minute via Laravel Scheduler to publish due scheduled posts
- **Media Library**:
  - Upload photos and video reels (`/api/media/upload`)
  - List uploaded media (`/api/media`)
- **Dashboard Analytics**:
  - Aggregated metrics (`/api/dashboard/overview`)

---

## 🛠️ Requirements & Setup

### 1. Requirements
- PHP >= 8.3 (with `openssl`, `pdo_mysql`, `curl`, `mbstring`, `fileinfo`)
- Composer
- MySQL Server (XAMPP or standalone)

### 2. Environment Configuration
Copy `.env.example` to `.env` or verify:
```env
APP_NAME=Automation
APP_ENV=local
APP_KEY=base64:...
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=automatian_db_laravel
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=database
SESSION_LIFETIME=120

# Meta / Instagram App Credentials
META_APP_ID=1477925811107025
META_APP_SECRET=0095bbac7928f5336c261df20e208999
META_REDIRECT_URI=https://04af-2001-448a-40b0-6662-f854-b8ba-89c5-5fb6.ngrok-free.app/api/instagram/callback
CONFIGURATION_ID=1481123037301339
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### 3. Database Migration & Seeding
```bash
# Run database migrations
php artisan migrate

# Seed initial user (jimly@automation.dev / Automation123!)
php artisan db:seed
```

### 4. Running the Server
```bash
php artisan serve --port=8000
```

### 5. Running the Scheduled Post Processor
```bash
# Run once manually (with stuck post recovery)
php artisan posts:process-scheduled --recover

# Or run the background schedule worker
php artisan schedule:work
```

### 6. Running Tests
```bash
php artisan test
```
*(All 19 Unit and Feature tests pass with 100% assertions).*

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/csrf-token` | CSRF token for SPA requests |
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Log in |
| `POST` | `/api/auth/logout` | Log out |
| `GET` | `/api/auth/me` | Current user profile |
| `PUT` | `/api/auth/profile` | Update profile |
| `PUT` | `/api/auth/password` | Change password |
| `GET` | `/api/instagram/connect` | Initiate Instagram OAuth |
| `GET` | `/api/instagram/callback` | OAuth callback handler |
| `GET` | `/api/instagram/accounts` | List connected accounts |
| `GET` | `/api/instagram/accounts/{id}` | Get account details |
| `DELETE`| `/api/instagram/accounts/{id}` | Disconnect account |
| `GET` | `/api/instagram/accounts/{id}/profile` | Refresh profile |
| `GET` | `/api/posts` | List posts (with status filter & pagination) |
| `POST` | `/api/posts` | Create post (draft or scheduled) |
| `GET` | `/api/posts/{id}` | Post detail with publishing logs |
| `PUT` | `/api/posts/{id}` | Update post |
| `DELETE`| `/api/posts/{id}` | Delete post |
| `POST` | `/api/posts/{id}/publish` | Publish post immediately |
| `GET` | `/api/posts/{id}/status` | Post publishing status |
| `GET` | `/api/dashboard/overview` | Dashboard metrics |
| `POST` | `/api/media/upload` | Upload media file |
| `GET` | `/api/media` | List media files |
| `GET` | `/privacy` | Redirects to Frontend Privacy Policy |
| `GET` | `/terms` | Redirects to Frontend Terms of Service |
