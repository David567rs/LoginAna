import axios from 'axios';

// Resolución dinámica del backend para evitar errores tipo ":3000/..." o cambios de IP.
// Prioriza VITE_API_BASE; si no existe, usa el hostname del frontend con puerto 3000.
const dynamicBase = (() => {
  try {
    const h = window.location?.hostname;
    if (h && h !== 'localhost') return `http://${h}:3000`;
  } catch {}
  return 'http://localhost:3000';
})();

const API_BASE = (import.meta as any).env?.VITE_API_BASE || dynamicBase;

export const api = axios.create({ baseURL: API_BASE });

export async function login(payload: { email: string; password: string; method?: 'email' | 'sms' }) {
  const { data } = await api.post('/auth/login', payload);
  return data;
}

export async function verify2fa(payload: { challengeId: string; code: string }) {
  const { data } = await api.post('/auth/2fa/verify', payload);
  return data;
}

export async function register(payload: { name: string; email: string; password: string; phone?: string }) {
  const { data } = await api.post('/auth/register', payload);
  return data;
}

export async function verifySms(payload: { email: string; code: string }) {
  const { data } = await api.post('/auth/verify-sms', payload);
  return data;
}

export async function resendEmail(payload: { email: string }) {
  const { data } = await api.post('/auth/resend-email', payload);
  return data;
}

export async function resendSms(payload: { email: string }) {
  const { data } = await api.post('/auth/resend-sms', payload);
  return data;
}

export async function verifyEmailToken(token: string) {
  const { data } = await api.get('/auth/verify-email', { params: { token, json: '1' } });
  return data as { ok: boolean };
}

export async function forgotPassword(payload: { email: string; method: 'email' | 'sms' }) {
  const { data } = await api.post('/auth/password/forgot', payload);
  return data;
}

export async function verifyReset(payload: { challengeId: string; code: string }) {
  const { data } = await api.post('/auth/password/verify', payload);
  return data;
}

export async function resetPassword(payload: { token: string; password: string }) {
  const { data } = await api.post('/auth/password/reset', payload);
  return data;
}
