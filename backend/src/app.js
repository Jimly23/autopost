import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import MySQLSessionStore from 'express-mysql-session';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

import env from './config/env.js';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import instagramRoutes from './routes/instagram.routes.js';
import postRoutes from './routes/post.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import mediaRoutes from './routes/media.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);

// ─── Security Middleware ──────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Requested-With'],
}));

// ─── Body Parsing ─────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Logging ──────────────────────────────────────────────────────────
if (env.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Rate Limiting ────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Session ──────────────────────────────────────────────────────────
const MySQLStore = MySQLSessionStore(session);

// Parse DATABASE_URL for session store connection
function parseDatabaseUrl(url) {
  try {
    const dbUrl = new URL(url);
    return {
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port, 10) || 3306,
      user: decodeURIComponent(dbUrl.username),
      password: decodeURIComponent(dbUrl.password),
      database: dbUrl.pathname.replace('/', ''),
    };
  } catch {
    return {};
  }
}

const sessionStoreOptions = {
  ...parseDatabaseUrl(env.DATABASE_URL),
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data',
    },
  },
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 minutes
  expiration: 86400000, // 24 hours
};

const sessionStore = new MySQLStore(sessionStoreOptions);

app.use(session({
  name: 'automation.sid',
  secret: env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// ─── CSRF Protection ──────────────────────────────────────────────────
// Custom double-submit cookie CSRF pattern (csurf is deprecated)
app.use((req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for the OAuth callback (it's a redirect from Instagram)
  if (req.path === '/api/instagram/callback') {
    return next();
  }

  // For state-changing requests, validate CSRF token
  const csrfToken = req.headers['x-csrf-token'] || req.body?._csrf;
  const sessionCsrf = req.session?.csrfToken;

  if (!csrfToken || !sessionCsrf || csrfToken !== sessionCsrf) {
    // On first request or missing token, generate one
    if (!sessionCsrf) {
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');
      req.session.save();
    }
    // Skip enforcement in development for easier API testing
    if (!env.isDevelopment) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing CSRF token',
      });
    }
  }

  next();
});

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.json({ success: true, data: { csrfToken: req.session.csrfToken } });
});

// ─── Health Check ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Automation API is running',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    },
  });
});

// ─── Legal Redirects (Meta App Review Compliance) ─────────────────────
app.get('/privacy', (req, res) => {
  res.redirect(`${env.FRONTEND_URL}/privacy`);
});

app.get('/terms', (req, res) => {
  res.redirect(`${env.FRONTEND_URL}/terms`);
});

// ─── Static Files (Uploads) ───────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── API Routes ───────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/media', mediaRoutes);

// ─── Error Handling ───────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
