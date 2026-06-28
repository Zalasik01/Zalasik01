import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { EntityDetail as IEntityDetail, PersonDetail, CompanyDetail } from '../types';
import StatusBadge from '../components/StatusBadge';

function SectionCard({ title, icon, badge, children }: { title: string; icon: React.ReactNode; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
        <span className="text-gray-400">{icon}</span>
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
        {badge}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-0 py-2.5 border-b border-gray-50 last:border-0">
      <span className="sm:w-48 text-xs font-medium text-gray-400 uppercase tracking-wide flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 flex-1">{value}</span>
    </div>
  );
}

export default function EntityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<IEntityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    const liveState = location.state as { liveData?: boolean; cnpj?: string } | null;

    if (id?.startsWith('cnpj_') || liveState?.liveData) {
      const cnpj = liveState?.cnpj || id?.replace('cnpj_', '');
      api.get(`/search/cnpj/${cnpj}`)
        .then(({ data: d }) => {
          setData(d);
          setSource(d.source || 'Receita Federal (BrasilAPI)');
        })
        .catch((err) => setError(err.response?.data?.error || 'Erro ao consultar CNPJ.'))
        .finally(() => setLoading(false));
    } else {
      api.get(`/entities/${id}`)
        .then(({ data: d }) => setData(d))
        .catch((err) => setError(err.response?.data?.error || 'Erro ao carregar dados.'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">
            {id?.startsWith('cnpj_') ? 'Consultando Receita Federal...' : 'Carregando perfil...'}
          </span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 mb-4">{error || 'Entidade nao encontrada.'}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-brand-600 font-medium hover:underline">
          Voltar para resultados
        </button>
      </div>
    );
  }

  const { entity, detail, addresses, phones, emails, processes } = data;
  const isPerson = entity.type === 'person';
  const pd = isPerson ? detail as PersonDetail : null;
  const cd = !isPerson ? detail as CompanyDetail & { qsa?: any[] } : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Voltar
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${isPerson ? 'bg-blue-50' : 'bg-purple-50'}`}>
            {isPerson ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{entity.name}</h1>
              {pd?.pep === 1 && (
                <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">PEP</span>
              )}
            </div>
            {cd?.trade_name && <p className="text-sm text-gray-500 mb-2">{cd.trade_name}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm bg-gray-50 text-gray-600 px-2.5 py-1 rounded border border-gray-100">
                {entity.document_type}: {entity.document}
              </span>
              <StatusBadge status={entity.status} size="md" />
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isPerson ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                {isPerson ? 'Pessoa Fisica' : 'Pessoa Juridica'}
              </span>
              {source && (
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full font-medium">
                  {source}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Details */}
          <SectionCard
            title={isPerson ? 'Dados Pessoais' : 'Dados da Empresa'}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 7h10M7 12h10M7 17h4"/>
              </svg>
            }
          >
            {isPerson && pd && (
              <div>
                <DataRow label="Data de Nascimento" value={pd.birth_date ? new Date(pd.birth_date).toLocaleDateString('pt-BR') : null} />
                <DataRow label="Genero" value={pd.gender === 'M' ? 'Masculino' : pd.gender === 'F' ? 'Feminino' : pd.gender} />
                <DataRow label="Nome da Mae" value={pd.mother_name} />
                <DataRow label="Nacionalidade" value={pd.nationality} />
                <DataRow label="PEP" value={pd.pep ? 'Sim — Pessoa Exposta Politicamente' : 'Nao'} />
              </div>
            )}
            {!isPerson && cd && (
              <div>
                <DataRow label="Razao Social" value={entity.name} />
                <DataRow label="Nome Fantasia" value={cd.trade_name} />
                <DataRow label="Natureza Juridica" value={cd.legal_nature} />
                <DataRow label="Atividade Principal" value={cd.main_activity} />
                <DataRow label="Porte" value={cd.size} />
                <DataRow label="Capital Social" value={cd.share_capital ? `R$ ${Number(cd.share_capital).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null} />
                <DataRow label="Data de Abertura" value={cd.foundation_date ? new Date(cd.foundation_date).toLocaleDateString('pt-BR') : null} />
              </div>
            )}
          </SectionCard>

          {/* QSA (for CNPJ live results) */}
          {cd?.qsa && cd.qsa.length > 0 && (
            <SectionCard
              title={`Quadro Societario (${cd.qsa.length})`}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              }
              badge={
                <span className="ml-auto text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">
                  Receita Federal
                </span>
              }
            >
              <div className="space-y-3">
                {cd.qsa.map((s: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                      {s.nome_socio?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{s.nome_socio}</p>
                      <p className="text-xs text-gray-400">{s.qualificacao_socio}</p>
                      {s.data_entrada_sociedade && (
                        <p className="text-xs text-gray-400">
                          Desde: {new Date(s.data_entrada_sociedade).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Legal Processes */}
          {processes.length > 0 && (
            <SectionCard
              title={`Processos Judiciais (${processes.length})`}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              }
            >
              <div className="space-y-4">
                {processes.map((proc) => (
                  <div key={proc.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="font-mono text-xs text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded">
                        {proc.process_number}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge status={proc.status} />
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium">{proc.role}</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-1">{proc.subject}</p>
                    <p className="text-xs text-gray-400">{proc.court}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Ultima atualizacao: {new Date(proc.last_update).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-5">
          <SectionCard
            title={`Enderecos (${addresses.length})`}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
            }
          >
            {addresses.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">Sem enderecos.</p>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr, i) => (
                  <div key={addr.id ?? i} className={`text-sm rounded-lg p-3 ${addr.is_current ? 'bg-brand-50 border border-brand-100' : 'bg-gray-50'}`}>
                    {addr.is_current ? (
                      <span className="text-xs font-semibold text-brand-600 uppercase tracking-wide block mb-1.5">Atual</span>
                    ) : null}
                    <p className="text-gray-800 font-medium">
                      {addr.street}, {addr.number}
                      {addr.complement ? `, ${addr.complement}` : ''}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {addr.neighborhood} — {addr.city}/{addr.state}
                    </p>
                    {addr.zip_code && (
                      <p className="text-gray-400 text-xs font-mono">{addr.zip_code}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {(phones.length > 0 || emails.length > 0) && (
            <SectionCard
              title="Contatos"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 10.5 19.79 19.79 0 0 1 1.65 2.18 2 2 0 0 1 3.62 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 7.91a16 16 0 0 0 6.1 6.1l.75-1.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              }
            >
              <div className="space-y-2">
                {phones.map((ph) => (
                  <div key={ph.id} className="flex items-center gap-2.5">
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium capitalize">
                      {ph.type === 'mobile' ? 'Celular' : 'Fixo'}
                    </span>
                    <span className="text-sm text-gray-700 font-mono">{ph.number}</span>
                  </div>
                ))}
                {emails.map((em) => (
                  <div key={em.id} className="flex items-center gap-2.5">
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">Email</span>
                    <span className="text-sm text-gray-700 break-all">{em.address}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
