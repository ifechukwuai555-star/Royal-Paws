File: "server.js"

import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import pool from './database.js';

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_COOKIE = 'royal_paws_admin';
const SESSION_TTL = 8 * 60 * 60 * 1000;

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(__dirname));

function createSessionToken() {
  const expires = Date.now() + SESSION_TTL;
  const randomPart = crypto.randomBytes(32).toString('hex');

  const payload = `${expires}.${randomPart}`;

  const signature = crypto
    .createHmac('sha256', ADMIN_PASSWORD)
    .update(payload)
    .digest('hex');

  return `${payload}.${signature}`;
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const cookies = {};

  header.split(';').forEach(cookie => {
    const index = cookie.indexOf('=');

    if (index === -1) {
      return;
    }

    const key = cookie.slice(0, index).trim();
    const value = cookie.slice(index + 1).trim();

    cookies[key] = decodeURIComponent(value);
  });

  return cookies;
}

function isValidSession(req) {
  if (!ADMIN_PASSWORD) {
    return false;
  }

  const cookies = parseCookies(req);
  const token = cookies[ADMIN_COOKIE];

  if (!token) {
    return false;
  }

  const parts = token.split('.');

  if (parts.length !== 3) {
    return false;
  }

  const [expires, randomPart, signature] = parts;

  if (!expires || !randomPart || !signature) {
    return false;
  }

  const expiry = Number(expires);

  if (!Number.isFinite(expiry) || Date.now() > expiry) {
    return false;
  }

  const payload = `${expires}.${randomPart}`;

  const expectedSignature = crypto
    .createHmac('sha256', ADMIN_PASSWORD)
    .update(payload)
    .digest('hex');

  const providedBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    providedBuffer,
    expectedBuffer
  );
}

function requireAdmin(req, res, next) {
  if (!isValidSession(req)) {
    return res.status(401).json({
      success: false,
      message: 'Administrator authentication required.'
    });
  }

  next();
}

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL,
      phone VARCHAR(30),
      message TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'unread',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS inquiries_created_at_idx
    ON inquiries (created_at DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS inquiries_status_idx
    ON inquiries (status)
  `);

  console.log('Royal Paws database is ready.');
}

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    res.status(200).json({
      success: true,
      message: 'Royal Paws server and database are running.'
    });
  } catch (error) {
    console.error('Database health check failed:', error);

    res.status(503).json({
      success: false,
      message: 'Server is running, but the database is unavailable.'
    });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body || {};

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof message !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name, email, and message.'
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone =
      typeof phone === 'string' ? phone.trim() : '';
    const cleanMessage = message.trim();

    if (!cleanName || !cleanEmail || !cleanMessage) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required.'
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (
      cleanName.length > 100 ||
      cleanEmail.length > 150 ||
      cleanPhone.length > 30 ||
      cleanMessage.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: 'One or more fields are too long.'
      });
    }

    await pool.query(
      `
        INSERT INTO inquiries
        (name, email, phone, message)
        VALUES ($1, $2, $3, $4)
      `,
      [
        cleanName,
        cleanEmail,
        cleanPhone || null,
        cleanMessage
      ]
    );

    console.log('New Royal Paws inquiry received:', {
      name: cleanName,
      email: cleanEmail
    });

    return res.status(200).json({
      success: true,
      message: `Thank you, ${cleanName}. Your message has been received.`
    });
  } catch (error) {
    console.error('Contact form error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to save your message right now.'
    });
  }
});

app.post('/api/admin/login', (req, res) => {
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({
      success: false,
      message: 'Admin login is not configured on the server.'
    });
  }

  const submittedPassword =
    typeof req.body?.password === 'string'
      ? req.body.password
      : '';

  const submittedBuffer = Buffer.from(submittedPassword);
  const expectedBuffer = Buffer.from(ADMIN_PASSWORD);

  let passwordMatches = false;

  if (submittedBuffer.length === expectedBuffer.length) {
    passwordMatches = crypto.timingSafeEqual(
      submittedBuffer,
      expectedBuffer
    );
  }

  if (!passwordMatches) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect admin password.'
    });
  }

  const token = createSessionToken();

  res.setHeader(
    'Set-Cookie',
    `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Max-Age=${SESSION_TTL / 1000}; HttpOnly; Secure; SameSite=Strict; Path=/`
  );

  return res.status(200).json({
    success: true,
    message: 'Admin login successful.'
  });
});

app.post('/api/admin/logout', (req, res) => {
  res.setHeader(
    'Set-Cookie',
    `${ADMIN_COOKIE}=; Max-Age=0; HttpOnly; Secure; SameSite=Strict; Path=/`
  );

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
});

app.get('/api/admin/session', (req, res) => {
  return res.status(200).json({
    authenticated: isValidSession(req)
  });
});

app.get('/api/admin/inquiries', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        email,
        phone,
        message,
        status,
        created_at
      FROM inquiries
      ORDER BY created_at DESC
    `);

    return res.status(200).json({
      success: true,
      inquiries: result.rows
    });
  } catch (error) {
    console.error('Inquiry fetch error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to load inquiries.'
    });
  }
});

app.patch(
  '/api/admin/inquiries/:id',
  requireAdmin,
  async (req, res) => {
    try {
      const id = req.params.id;
      const status = req.body?.status;

      if (!/^\d+$/.test(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid inquiry ID.'
        });
      }

      if (status !== 'read' && status !== 'unread') {
        return res.status(400).json({
          success: false,
          message: 'Status must be read or unread.'
        });
      }

      const result = await pool.query(
        `
          UPDATE inquiries
          SET status = $1
          WHERE id = $2
          RETURNING id, status
        `,
        [status, id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Inquiry not found.'
        });
      }

      return res.status(200).json({
        success: true,
        inquiry: result.rows[0]
      });
    } catch (error) {
      console.error('Inquiry update error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to update inquiry.'
      });
    }
  }
);

app.delete(
  '/api/admin/inquiries/:id',
  requireAdmin,
  async (req, res) => {
    try {
      const id = req.params.id;

      if (!/^\d+$/.test(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid inquiry ID.'
        });
      }

      const result = await pool.query(
        `
          DELETE FROM inquiries
          WHERE id = $1
          RETURNING id
        `,
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Inquiry not found.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Inquiry deleted successfully.'
      });
    } catch (error) {
      console.error('Inquiry deletion error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to delete inquiry.'
      });
    }
  }
);

app.use((req, res, next) => {
  if (req.method === 'GET' && req.accepts('html')) {
    return res.sendFile(
      path.join(__dirname, 'index.html')
    );
  }

  next();
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.'
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);

  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.'
  });
});

async function startServer() {
  try {
    if (!ADMIN_PASSWORD) {
      console.warn(
        'WARNING: ADMIN_PASSWORD is not configured.'
      );
    }

    await initializeDatabase();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(
        `Royal Paws server running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      'Unable to start Royal Paws server:',
      error
    );

    process.exit(1);
  }
}

startServer();
