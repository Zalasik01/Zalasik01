import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Entity, SearchMeta } from '../types';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';

// DJEN (busca de processo por nome) e bloqueado pelo CNJ em qualquer cloud.
// Codigo mantido pronto; mude para true ao rodar em IP residencial/comercial BR.
const ENABLE_DJEN = false;

function isCNPJ(q: string) { return /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(q.trim()); }
function isCPF(q: string) { return /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(q.trim()); }
function isProcessNumber(q: string) { return q.replace(/\D/g, '').length === 20; }
function isPureName(q: string) { return !isCNPJ(q) && !isCPF(q) && !isProcessNumber(q) && q.trim().length >= 3; }

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

function SourceBadge({ label, color = 'emerald' }: { label: string; color?: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    gray: 'bg-gray-100 text-gray-600 border-gray-200'
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${colors[color] || colors.gray}`}>
      {label}
    </span>
  );
}

interface Pep {
  nome: string;
  cpf: string | null;
  funcao: string | null;
  orgao: string | null;
  inicio_exercicio: string | null;
  fim_exercicio: string | null;
}

interface Sancao {
  nome: string;
  documento: string | null;
  tipo_pessoa: string | null;
  tipo_sancao: string | null;
  orgao_sancionador: string | null;
  fonte: string | null;
  inicio_sancao: string | null;
  fim_sancao: string | null;
  lista: string;
}

interface Processo {
  numero: string;
  tribunal: string;
  classe: string | null;
  classe_codigo: number | null;
  grau: string | null;
  sistema: string | null;
  nivel_sigilo: number | null;
  assuntos: string[];
  data_ajuizamento: string | null;
  orgao_julgador: string | null;
  ultima_movimentacao: string | null;
  ultima_atualizacao: string | null;
  formato: string | null;
  total_movimentos: number;
  fonte_tribunal: string;
}

interface ProcessoNome {
  numero: string | null;
  tribunal: string | null;
  orgao: string | null;
  classe: string | null;
  tipo_comunicacao: string | null;
  data_disponibilizacao: string | null;
  texto: string | null;
  destinatarios: { nome: string; polo: string }[];
  advogados: { nome: string; oab: string | null }[];
  link: string | null;
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const [localResults, setLocalResults] = useState<Entity[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [cnpjResult, setCnpjResult] = useState<Entity | null>(null);
  const [pep, setPep] = useState<Pep[]>([]);
  const [sancoes, setSancoes] = useState<Sancao[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [processosNome, setProcessosNome] = useState<ProcessoNome[]>([]);
  const [djenBlocked, setDjenBlocked] = useState(false);
  const [nameSearchNote, setNameSearchNote] = useState(false);
  const [apiStatus, setApiStatus] = useState<{ transparencia: { configured: boolean }; datajud: { configured: boolean; using_public_key?: boolean } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/pessoa/status').then(r => setApiStatus(r.data)).catch(() => {});
  }, []);

  const doSearch = useCallback(async () => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    setCnpjResult(null);
    setLocalResults([]);
    setPep([]);
    setSancoes([]);
    setProcessos([]);
    setProcessosNome([]);
    setDjenBlocked(false);
    setNameSearchNote(false);
    setMeta(null);

    try {
      if (isCNPJ(q)) {
        const clean = q.replace(/\D/g, '');
        const { data } = await api.get(`/search/cnpj/${clean}`);
        setCnpjResult(data.entity);
      } else if (isProcessNumber(q)) {
        // CNJ process number -> DataJud lookup by number
        const { data } = await api.get('/pessoa/processos', { params: { numero: q } });
        if (data?.data) setProcessos(data.data);
      } else {
        const params: Record<string, string> = { q, page: String(page) };
        if (type) params.type = type;

        const promises: Promise<any>[] = [api.get('/search', { params })];

        if (isPureName(q)) {
          promises.push(api.get('/pessoa/busca', { params: { nome: q } }).catch(() => null));
          // DJEN (processo por nome) fica pronto, mas inativo: o CloudFront do CNJ
          // bloqueia acesso de qualquer cloud. Para reativar, defina ENABLE_DJEN=true.
          if (ENABLE_DJEN) {
            promises.push(api.get('/pessoa/processos-nome', { params: { nome: q } }).catch(() => null));
          }
          setNameSearchNote(true);
        }

        const [localRes, buscaRes, djenRes] = await Promise.all(promises);

        setLocalResults(localRes.data.data);
        setMeta(localRes.data.meta);
        if (buscaRes?.data?.pep) setPep(buscaRes.data.pep);
        if (buscaRes?.data?.sancoes) setSancoes(buscaRes.data.sancoes);
        if (djenRes?.data?.blocked) setDjenBlocked(true);
        else if (djenRes?.data?.data) setProcessosNome(djenRes.data.data);
      }
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

  const hasResults = cnpjResult || localResults.length > 0 || pep.length > 0 || sancoes.length > 0 || processos.length > 0 || processosNome.length > 0;
  const transparenciaNeeded = apiStatus && !apiStatus.transparencia.configured;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <SearchBar initialQuery={q} initialType={type} />
        {q && (
          <p className="text-xs text-gray-400 mt-2 ml-1">
            Dica: CNPJ (Receita Federal), nome (politicos e sancionados) ou numero de processo CNJ (20 digitos).
          </p>
        )}
      </div>

      {/* Name-search scope notice */}
      {!loading && nameSearchNote && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 mb-6 flex items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
          </svg>
          <div className="text-sm">
            <p className="font-semibold text-blue-800 mb-1">Sobre a busca por nome</p>
            <p className="text-blue-700">A busca por nome cobre fontes oficiais abertas: processos no DJEN/CNJ, pessoas politicamente expostas (PEP), sancionados (CEIS/CNEP) e a base local. Dados de cidadaos sem cargo publico/processos nao sao publicos (LGPD).</p>
            {djenBlocked && (
              <p className="text-blue-600 mt-2 text-xs">Nota: a consulta de processos por nome (DJEN/CNJ) so aceita acesso a partir do Brasil. Neste servidor (fora do BR) ela fica indisponivel — veja a observacao no chat sobre hospedagem.</p>
            )}
          </div>
        </div>
      )}

      {/* Transparencia key notice */}
      {transparenciaNeeded && (type === '' || type === 'person') && !isCNPJ(q) && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-5 py-4 mb-6 flex items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          <div className="text-sm">
            <p className="font-semibold text-amber-800 mb-1">Para buscar dados governamentais por nome</p>
            <p className="text-amber-700">Cadastre sua chave gratuita em <span className="font-mono text-xs bg-amber-100 px-1 rounded">portaldatransparencia.gov.br/api-de-dados/cadastrar-email</span> e configure <span className="font-mono text-xs bg-amber-100 px-1 rounded">TRANSPARENCIA_API_KEY</span> no Railway.</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">
              {isCNPJ(q) ? 'Consultando Receita Federal...'
                : isProcessNumber(q) ? 'Consultando CNJ DataJud...'
                : 'Consultando multiplas fontes...'}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-5 py-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-8">
          {/* CNPJ direct result */}
          {cnpjResult && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Resultado direto</h2>
                <SourceBadge label="Receita Federal" color="emerald" />
              </div>
              <Link
                to={`/entity/cnpj_${cnpjResult.document.replace(/\D/g, '')}`}
                state={{ liveData: true, cnpj: cnpjResult.document.replace(/\D/g, '') }}
                className="block bg-white rounded-xl border border-emerald-200 p-5 hover:border-brand-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                      <CompanyIcon />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors truncate">{cnpjResult.name}</h3>
                      {cnpjResult.trade_name && <p className="text-xs text-gray-400 mt-0.5">{cnpjResult.trade_name}</p>}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">CNPJ: {cnpjResult.document}</span>
                        {cnpjResult.secondary_date && (
                          <span className="text-xs text-gray-400">Fund.: {new Date(cnpjResult.secondary_date).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={cnpjResult.status} />
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-brand-500 transition-colors">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Pessoas Politicamente Expostas (PEP) */}
          {pep.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Pessoas Politicamente Expostas ({pep.length})</h2>
                <SourceBadge label="Portal da Transparencia" color="blue" />
              </div>
              <div className="space-y-3">
                {pep.map((p, i) => (
                  <div key={i} className="bg-white rounded-xl border border-blue-100 p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <PersonIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{p.nome}</h3>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          {p.cpf && <span>CPF: <span className="text-gray-700 font-mono">{p.cpf}</span></span>}
                          {p.funcao && <span>Funcao: <span className="text-gray-700 font-medium">{p.funcao}</span></span>}
                          {p.orgao && <span>Orgao/Local: <span className="text-gray-700 font-medium">{p.orgao}</span></span>}
                          {p.inicio_exercicio && <span>Exercicio: <span className="text-gray-700 font-medium">{new Date(p.inicio_exercicio).toLocaleDateString('pt-BR')}{p.fim_exercicio ? ' a ' + new Date(p.fim_exercicio).toLocaleDateString('pt-BR') : ''}</span></span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sanções (CEIS / CNEP) */}
          {sancoes.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Sancoes e Inidoneidade ({sancoes.length})</h2>
                <SourceBadge label="CEIS / CNEP" color="purple" />
              </div>
              <div className="space-y-3">
                {sancoes.map((s, i) => (
                  <div key={i} className="bg-white rounded-xl border border-red-100 p-5">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 min-w-0">{s.nome}</h3>
                      <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded font-medium flex-shrink-0">{s.lista}</span>
                    </div>
                    {s.tipo_sancao && <p className="text-sm text-gray-700 mb-1">{s.tipo_sancao}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      {s.documento && <span className="font-mono">{s.documento}</span>}
                      {s.tipo_pessoa && <span>{s.tipo_pessoa}</span>}
                      {s.orgao_sancionador && <span>Orgao: {s.orgao_sancionador}</span>}
                      {s.inicio_sancao && <span>Periodo: {s.inicio_sancao}{s.fim_sancao ? ' a ' + s.fim_sancao : ''}</span>}
                      {s.fonte && <span>Fonte: {s.fonte}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Processos CNJ */}
          {processos.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Processos Judiciais ({processos.length})</h2>
                <SourceBadge label="CNJ DataJud" color="purple" />
              </div>
              <div className="space-y-3">
                {processos.map((p, i) => (
                  <div key={p.numero || i} className="bg-white rounded-xl border border-purple-100 p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="font-mono text-xs text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded break-all">{p.numero}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {p.fonte_tribunal && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">{p.fonte_tribunal}</span>}
                        {p.grau && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{p.grau}</span>}
                        {p.formato && <span className="text-xs bg-gray-50 text-gray-400 px-2 py-0.5 rounded border border-gray-100">{p.formato}</span>}
                      </div>
                    </div>
                    {p.classe && <p className="text-sm font-medium text-gray-800 mb-1">{p.classe}</p>}
                    {p.assuntos.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {p.assuntos.slice(0, 4).map((a, j) => (
                          <span key={j} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">{a}</span>
                        ))}
                      </div>
                    )}
                    {p.sistema && <p className="text-xs text-gray-500 mb-1">Sistema: <span className="text-gray-700">{p.sistema}</span></p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      {p.orgao_julgador && <span>{p.orgao_julgador}</span>}
                      {p.data_ajuizamento && <span>Ajuizado: {new Date(p.data_ajuizamento).toLocaleDateString('pt-BR')}</span>}
                      {p.ultima_movimentacao && <span>Ultima mov.: {p.ultima_movimentacao}</span>}
                      {p.ultima_atualizacao && <span>Atualizado: {new Date(p.ultima_atualizacao).toLocaleDateString('pt-BR')}</span>}
                      {p.total_movimentos > 0 && <span>{p.total_movimentos} movimentos</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Processos por nome (DJEN) */}
          {processosNome.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Processos por nome ({processosNome.length})</h2>
                <SourceBadge label="DJEN — CNJ" color="purple" />
              </div>
              <div className="space-y-3">
                {processosNome.map((p, i) => (
                  <div key={i} className="bg-white rounded-xl border border-purple-100 p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      {p.numero && <span className="font-mono text-xs text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded break-all">{p.numero}</span>}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {p.tribunal && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">{p.tribunal}</span>}
                        {p.tipo_comunicacao && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{p.tipo_comunicacao}</span>}
                      </div>
                    </div>
                    {p.classe && <p className="text-sm font-medium text-gray-800 mb-1">{p.classe}</p>}
                    {p.destinatarios.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {p.destinatarios.slice(0, 6).map((d, j) => (
                          <span key={j} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{d.polo ? `${d.polo}: ` : ''}{d.nome}</span>
                        ))}
                      </div>
                    )}
                    {p.texto && <p className="text-xs text-gray-500 mb-2 leading-relaxed">{p.texto}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      {p.orgao && <span>{p.orgao}</span>}
                      {p.data_disponibilizacao && <span>Publicado: {new Date(p.data_disponibilizacao).toLocaleDateString('pt-BR')}</span>}
                      {p.advogados.length > 0 && <span>Adv.: {p.advogados.slice(0, 2).map(a => a.nome).join(', ')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Local DB results */}
          {localResults.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Cadastros ({meta?.total})</h2>
                <SourceBadge label="Base local" color="gray" />
              </div>
              <div className="space-y-3">
                {localResults.map((entity) => (
                  <Link
                    key={entity.id}
                    to={`/entity/${entity.id}`}
                    className="block bg-white rounded-xl border border-gray-100 p-5 hover:border-brand-200 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${entity.type === 'person' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                          {entity.type === 'person' ? <PersonIcon /> : <CompanyIcon />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors truncate">{entity.name}</h3>
                          {entity.trade_name && <p className="text-xs text-gray-400 mt-0.5">{entity.trade_name}</p>}
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
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${entity.type === 'person' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
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

              {meta && meta.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-5">
                  <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Anterior
                  </button>
                  <span className="text-sm text-gray-500 px-2">Pagina {meta.page} de {meta.pages}</span>
                  <button onClick={() => goToPage(page + 1)} disabled={page >= meta.pages}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Proxima
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Empty state */}
          {!loading && q && !hasResults && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Nenhum resultado encontrado</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Nomes so retornam dados quando a pessoa tem cargo politico (PEP) ou sancao (CEIS/CNEP) — dados de cidadaos comuns nao sao publicos (LGPD). Para empresas, use o CNPJ; para processos, o numero CNJ (20 digitos).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
