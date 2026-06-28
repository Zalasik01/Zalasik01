import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { User } from '../types';

interface Props {
  user: User | null;
}

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Pessoas Fisicas',
    desc: 'Consulte CPF, enderecos, telefones, emails e historico de processos judiciais.'
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    title: 'Pessoas Juridicas',
    desc: 'Pesquise CNPJ, socios, natureza juridica, capital social e situacao cadastral.'
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    title: 'Processos Judiciais',
    desc: 'Acesse processos em andamento, historico judicial e situacao processual atualizada.'
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'PEP e Compliance',
    desc: 'Identifique Pessoas Expostas Politicamente e realize due diligence com seguranca.'
  }
];

const stats = [
  { value: '250M+', label: 'Registros indexados' },
  { value: '98.7%', label: 'Precisao dos dados' },
  { value: '< 200ms', label: 'Tempo de resposta' },
  { value: 'LGPD', label: 'Em conformidade' }
];

export default function Landing({ user }: Props) {
  return (
    <div>
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-brand-100">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            Plataforma de dados publicos em tempo real
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Consulta inteligente de
            <span className="text-brand-600"> dados publicos</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Acesse informacoes de pessoas fisicas, empresas e processos judiciais a partir de fontes abertas e registros publicos do Brasil.
          </p>

          {user ? (
            <SearchBar large />
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors text-base shadow-sm"
              >
                Comecar gratuitamente
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-base border border-gray-200 shadow-sm"
              >
                Ja tenho conta
              </Link>
            </div>
          )}

          {!user && (
            <p className="mt-4 text-sm text-gray-400">
              Plano gratuito inclui 10 consultas por mes. Sem necessidade de cartao de credito.
            </p>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-brand-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
                <div className="text-sm text-brand-200">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Tudo que voce precisa em um lugar</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Plataforma completa para consulta, analise e monitoramento de dados publicos brasileiros.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-xl p-6 border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all group"
              >
                <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 mb-4 group-hover:bg-brand-100 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Planos e precos</h2>
            <p className="text-gray-500">Escolha o plano ideal para o seu negocio.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Free', price: 'R$ 0', period: '/mes', searches: '10 consultas/mes', features: ['Busca por nome e documento', 'Dados cadastrais basicos', 'Enderecos e contatos', 'Historico de processos'], cta: 'Comecar gratis', highlight: false },
              { name: 'Pro', price: 'R$ 89', period: '/mes', searches: '500 consultas/mes', features: ['Tudo do Free', 'Dados completos PEP', 'Exportacao em PDF/Excel', 'Historico ilimitado', 'Suporte prioritario'], cta: 'Assinar Pro', highlight: true },
              { name: 'Enterprise', price: 'Sob consulta', period: '', searches: 'Ilimitado', features: ['Tudo do Pro', 'API RESTful dedicada', 'SLA 99.9%', 'Integracao customizada', 'Gerente de conta'], cta: 'Falar com vendas', highlight: false }
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border-2 flex flex-col ${
                  plan.highlight
                    ? 'border-brand-500 bg-brand-600 text-white shadow-xl scale-105'
                    : 'border-gray-100 bg-white'
                }`}
              >
                {plan.highlight && (
                  <span className="text-xs font-bold bg-white text-brand-600 px-3 py-1 rounded-full w-fit mb-4">MAIS POPULAR</span>
                )}
                <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-3xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? 'text-brand-200' : 'text-gray-400'}`}>{plan.period}</span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-brand-200' : 'text-gray-400'}`}>{plan.searches}</p>
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? '#a5b8fb' : '#10b981'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span className={plan.highlight ? 'text-brand-100' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={user ? '/dashboard' : '/register'}
                  className={`w-full py-3 rounded-xl font-semibold text-center text-sm transition-colors ${
                    plan.highlight
                      ? 'bg-white text-brand-600 hover:bg-brand-50'
                      : 'bg-brand-600 text-white hover:bg-brand-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
