import { startRegistration, startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import api from './api';
import { User } from '../types';

export function biometriaSuportada(): boolean {
  try { return browserSupportsWebAuthn(); } catch { return false; }
}

// Registra uma passkey (biometria) para o usuario logado.
export async function registrarBiometria(deviceLabel?: string): Promise<void> {
  const { data } = await api.post('/auth/webauthn/register/options');
  const response = await startRegistration(data.options);
  await api.post('/auth/webauthn/register/verify', { response, challengeId: data.challengeId, deviceLabel });
}

// Autentica via biometria (usernameless). Retorna token + user.
export async function loginBiometria(): Promise<{ token: string; user: User }> {
  const { data } = await api.post('/auth/webauthn/login/options');
  const response = await startAuthentication(data.options);
  const res = await api.post('/auth/webauthn/login/verify', { response, challengeId: data.challengeId });
  return res.data;
}

export async function statusBiometria(): Promise<{ enabled: boolean; credentials: any[] }> {
  const { data } = await api.get('/auth/webauthn/status');
  return data;
}
