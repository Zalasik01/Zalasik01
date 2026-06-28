import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Entity, SearchMeta } from '../types';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function CompanyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const [results, setResults] = useState<Entity[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doSearch = useCallback(async () => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { q, page: String(page) };
      if (type) params.type = type;
      const { data } = await api.get('/search', { params });
      setResults(data.data);
      setMeta(data.meta);
    } catch (err: any) {
      if (err.response?.data?.upgrade_required) {
        setError('Limite de buscas atingido. Acesse seu dashboard para fazer upgrade.');
      } else {
        setError(err.response?.data?.error || 'Erro ao buscar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }, [q, type, page]);

  useEffect(() => { doSearch(); }, [doSearch]);

  const goToPage = (p: number) => {
    const params = new URLSearchParams({ q, page: String(p) });
    if (type) params.set('type', type);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <SearchBar initialQuery={q} initialType={type} />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Consultando registros...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-5 py-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {!loading && !error && q && (
        <>
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="text-sm text-gray-500">
                {meta ? (
                  <>
                    <span className="font-semibold text-gray-900">{meta.total.toLocaleString('pt-BR')}</span>
                    {' '}resultado{meta.total !== 1 ? 's' : ''} para{' '}
                    <span className="font-semibold text-gray-900">"{q}"</span>
                  </>
                ) : 'Sem resultados'}
              </span>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Nenhum resultado encontrado</h3>
              <p className="text-gray-500 text-sm">Tente buscar por outro nome, CPF ou CNPJ.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((entity) => (
                <Link
                  key={entity.id}
                  to={`/entity/${entity.id}`}
                  className="block bg-white rounded-xl border border-gray-100 p-5 hover:border-brand-200 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        entity.type === 'person'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-purple-50 text-purple-600'
                      }`}>
                        {entity.type === 'person' ? <PersonIcon /> : <CompanyIcon />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors truncate">
                          {entity.name}
                        </h3>
                        {entity.trade_name && (
                          <p className="text-xs text-gray-400 mt-0.5">{entity.trade_name}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                            {entity.document_type}: {entity.document}
                          </span>
                          {entity.secondary_date && (
                            <span className="text-xs text-gray-400">
                              {entity.type === 'person' ? 'Nasc.:' : 'Fund.:'} {new Date(entity.secondary_date).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={entity.status} />
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        entity.type === 'person'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-purple-50 text-purple-600'
                      }`}>
                        {entity.type === 'person' ? 'PF' : 'PJ'}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-brand-500 transition-colors">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {meta && meta.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-500 px-2">
                Pagina {meta.page} de {meta.pages}
              </span>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= meta.pages}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Proxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
