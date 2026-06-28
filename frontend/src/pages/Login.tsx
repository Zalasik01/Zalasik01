import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { biometriaSuportada, loginBiometria } from '../lib/webauthn';

interface Props {
  onLogin: (email: string, password: string) => Promise<User>;
  onSession: (token: string, user: User) => User;
}

export default function Login({ onLogin, onSession }: Props) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const navigate = useNavigate();

  const handleBiometria = async () => {
    setBioLoading(true);
    setError('');
    try {
      const { token, user } = await loginBiometria();
      onSession(token, user);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Autenticacao cancelada ou expirada.'
        : err.response?.data?.error || 'Nao foi possivel entrar com biometria. Cadastre primeiro no seu dispositivo.';
      setError(msg);
    } finally {
      setBioLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onLogin(form.email, form.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Entrar na conta</h1>
            <p className="text-gray-500 text-sm mt-1">Acesse a plataforma DataSearch</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="seu@email.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Sua senha"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-gray-400"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 active:bg-brand-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {biometriaSuportada() && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">ou</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <button
                type="button"
                onClick={handleBiometria}
                disabled={bioLoading}
                className="w-full py-3 border border-brand-200 bg-brand-50 text-brand-700 font-semibold rounded-lg hover:bg-brand-100 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 11c0 3-1 5-1 5"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M12 12a6 6 0 0 1 6 6"/><path d="M22 16c0-2-1-3-1-4"/><circle cx="12" cy="12" r="1"/>
                </svg>
                {bioLoading ? 'Verificando...' : 'Entrar com biometria'}
              </button>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Nao tem conta?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              Criar conta gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
