import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;

// Comma-separated list of sites allowed to call this API, e.g.
// ALLOWED_ORIGINS=https://ornatecoe.com,https://www.ornatecoe.com
const ALLOWED = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

// ---- CORS: only let your Hostinger site talk to this backend ----
app.use(cors({
  origin(origin, cb) {
    // allow same-origin / curl (no Origin header) and any whitelisted site
    if (!origin || ALLOWED.includes(origin)) return cb(null, true);
    cb(new Error('Origin not allowed: ' + origin));
  },
  methods: ['POST', 'GET', 'OPTIONS'],
}));

// ---- Tiny in-memory rate limit (per IP) to blunt spam/abuse ----
const hits = new Map(); // ip -> [timestamps]
function rateLimited(ip, max = 5, windowMs = 60_000) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > max;
}

// ---- Optional email sending via SMTP (configure in .env) ----
let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const isEmail = v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

// Append every submission to a local file so nothing is ever lost,
// even if email delivery fails.
function archive(kind, data) {
  const line = JSON.stringify({ kind, at: new Date().toISOString(), ...data }) + '\n';
  fs.appendFileSync(path.join(__dirname, 'submissions.jsonl'), line);
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/contact', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  if (rateLimited(ip)) return res.status(429).json({ ok: false, error: 'Too many requests. Please try again shortly.' });

  const { name = '', email = '', subject = '', message = '', company = '' } = req.body || {};

  // Honeypot: real users never fill the hidden "company" field. Bots do.
  if (company.trim()) return res.json({ ok: true }); // silently accept + ignore

  if (!name.trim() || !message.trim() || !isEmail(email.trim())) {
    return res.status(400).json({ ok: false, error: 'Please enter your name, a valid email, and a message.' });
  }

  const payload = { name: name.trim(), email: email.trim(), subject: subject.trim() || 'Enquiry — Centre of Excellence', message: message.trim(), ip };
  archive('contact', payload);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: process.env.MAIL_TO || 'info@ornatesolar.com',
        replyTo: payload.email,
        subject: '[Website] ' + payload.subject,
        text: `Name: ${payload.name}\nEmail: ${payload.email}\n\n${payload.message}`,
      });
    } catch (err) {
      console.error('Email send failed (submission still archived):', err.message);
    }
  }

  res.json({ ok: true });
});

app.post('/newsletter', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  if (rateLimited(ip)) return res.status(429).json({ ok: false, error: 'Too many requests.' });

  const { email = '', company = '' } = req.body || {};
  if (company.trim()) return res.json({ ok: true });
  if (!isEmail(email.trim())) return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });

  archive('newsletter', { email: email.trim(), ip });

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: process.env.MAIL_TO || 'info@ornatesolar.com',
        subject: '[Website] Newsletter subscription',
        text: `Please add ${email.trim()} to the quarterly newsletter mailing list.`,
      });
    } catch (err) {
      console.error('Email send failed (subscription still archived):', err.message);
    }
  }

  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`COE contact backend listening on http://localhost:${PORT}`));
