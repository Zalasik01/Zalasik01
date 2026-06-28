import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { SearchHistory, User } from '../types';

interface Stats {
  user: User;
  stats: {
    total_searches: number;
    today_searches: number;
    recent_queries: string[];
  };
}

interface Props {
  user: User | null;
  onUserUpdate: (u: Partial<User>) => void;
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard({ user, onUserUpdate }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/search/stats'),
      api.get('/search/history')
    ]).then(([statsRes, histRes]) => {
      setStats(statsRes.data);
      setHistory(histRes.data.data);
      onUserUpdate(statsRes.data.user);
    }).finally(() => setLoading(false));
  }, []);

  const planLabels: Record<string, string> = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' };
  const planColors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-600',
    pro: 'bg-blue-100 text-blue-700',
    enterprise: 'bg-purple-100 text-purple-700'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentUser = stats?.user || user;
  const usagePercent = currentUser ? Math.min(100, (currentUser.searches_used / currentUser.searches_limit) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ola, {currentUser?.name.split(' ')[0]}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Bem-vindo ao seu painel de controle</p>
        </div>
        <Link
          to="/search"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          Nova busca
        </Link>
      </div>

      {/* Plan + Usage */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-lg">
              {currentUser?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{currentUser?.name}</p>
              <p className="text-xs text-gray-400">{currentUser?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${planColors[currentUser?.plan || 'free']}`}>
              {planLabels[currentUser?.plan || 'free']}
            </span>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-gray-600">Consultas utilizadas</span>
            <span className="text-sm font-semibold text-gray-900">
              {currentUser?.searches_used} / {currentUser?.searches_limit}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-brand-500'}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          {usagePercent >= 80 && (
            <p className="text-xs text-amber-600 mt-1.5">
              Voce esta proximo do limite. Considere fazer upgrade para continuar usando.
            </p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total de buscas"
          value={stats?.stats.total_searches || 0}
          color="text-gray-900"
        />
        <StatCard
          label="Buscas hoje"
          value={stats?.stats.today_searches || 0}
          color="text-brand-600"
        />
        <StatCard
          label="Restantes"
          value={(currentUser?.searches_limit || 0) - (currentUser?.searches_used || 0)}
          sub="no plano atual"
          color="text-emerald-600"
        />
        <StatCard
          label="Plano"
          value={planLabels[currentUser?.plan || 'free']}
          sub="ativo"
          color="text-gray-900"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Search History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-800 text-sm">Historico de buscas</h2>
              <span className="text-xs text-gray-400">{history.length} registros</span>
            </div>
            <div className="divide-y divide-gray-50">
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-400">Nenhuma busca realizada ainda.</p>
                  <Link to="/search" className="text-sm text-brand-600 font-medium hover:underline mt-1 block">
                    Fazer primeira busca
                  </Link>
                </div>
              ) : (
                history.slice(0, 20).map((h) => (
                  <Link
                    key={h.id}
                    to={`/search?q=${encodeURIComponent(h.query)}${h.query_type !== 'all' ? `&type=${h.query_type}` : ''}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-50 transition-colors">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-brand-500">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate group-hover:text-brand-700">{h.query}</p>
                      <p className="text-xs text-gray-400">
                        {h.results_count} resultado{h.results_count !== 1 ? 's' : ''} · {new Date(h.searched_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      h.query_type === 'person' ? 'bg-blue-50 text-blue-600' :
                      h.query_type === 'company' ? 'bg-purple-50 text-purple-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {h.query_type === 'person' ? 'PF' : h.query_type === 'company' ? 'PJ' : 'Todos'}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="space-y-5">
          {/* Recent Queries */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-800 text-sm">Buscas recentes</h2>
            </div>
            <div className="p-4 space-y-2">
              {stats?.stats.recent_queries.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">Nenhuma busca ainda.</p>
              ) : (
                stats?.stats.recent_queries.map((q) => (
                  <Link
                    key={q}
                    to={`/search?q=${encodeURIComponent(q)}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-700 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                    </svg>
                    {q}
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Upgrade */}
          {currentUser?.plan === 'free' && (
            <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl p-5 text-white">
              <h3 className="font-bold mb-1.5">Upgrade para Pro</h3>
              <p className="text-brand-200 text-xs mb-4 leading-relaxed">
                500 consultas/mes, dados completos PEP e exportacao de relatorios.
              </p>
              <button className="w-full py-2.5 bg-white text-brand-700 font-semibold text-sm rounded-lg hover:bg-brand-50 transition-colors">
                Ver planos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
