import { HttpError } from './errors.ts';

export const ALLOWED_UMD_DOMAINS = ['umd.edu', 'terpmail.umd.edu'] as const;
export const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'auth',
  'help',
  'maryland',
  'root',
  'support',
  'testudo',
  'umd',
  'xumd',
]);

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateUmdEmail(email: string) {
  const normalized = normalizeEmail(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!normalized) {
    throw new HttpError(400, 'bad_request', 'Email is required.');
  }

  if (!emailRegex.test(normalized)) {
    throw new HttpError(400, 'bad_request', 'Please enter a valid email address.');
  }

  const domain = normalized.split('@')[1] ?? '';
  if (!ALLOWED_UMD_DOMAINS.includes(domain as (typeof ALLOWED_UMD_DOMAINS)[number])) {
    throw new HttpError(403, 'forbidden', 'Only @umd.edu and @terpmail.umd.edu emails are allowed.');
  }

  return normalized;
}

export function sanitizeUsername(username: string) {
  return username
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);
}

export function validateUsername(username: string) {
  const sanitized = sanitizeUsername(username);

  if (sanitized.length < 3) {
    throw new HttpError(400, 'bad_request', 'Username must be at least 3 characters.');
  }

  if (sanitized.length > 30) {
    throw new HttpError(400, 'bad_request', 'Username must be 30 characters or fewer.');
  }

  if (!/^[a-z0-9_]+$/.test(sanitized)) {
    throw new HttpError(400, 'bad_request', 'Username can only contain lowercase letters, numbers, and underscores.');
  }

  if (RESERVED_USERNAMES.has(sanitized)) {
    throw new HttpError(400, 'bad_request', 'That username is reserved.');
  }

  return sanitized;
}

export function buildUsernameSuggestions(baseUsername: string) {
  const clean = sanitizeUsername(baseUsername) || 'terp';
  const year = new Date().getFullYear();

  return [
    `${clean}_umd`,
    `${clean}_terp`,
    `${clean}_${String(year).slice(-2)}`,
    `${clean}_${String(year + 1).slice(-2)}`,
    `${clean}${Math.floor(100 + Math.random() * 900)}`,
  ].map((candidate) => sanitizeUsername(candidate));
}

export function inferCurrentSemester() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  if (month <= 4) {
    return `Spring ${year}`;
  }

  if (month <= 7) {
    return `Summer ${year}`;
  }

  return `Fall ${year}`;
}
