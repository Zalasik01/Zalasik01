# Vértice — Revenue OS para negócios high-ticket

Vértice é um SaaS de gestão de receita para negócios que vendem contratos de alto valor (consultorias, mentorias, clínicas premium, escritórios, agências, imobiliárias de alto padrão). Ele junta pipeline, propostas com aceite online, previsão de receita e um copiloto de IA num único produto.

## O que tem no produto

| Área | O que faz |
| --- | --- |
| **Landing page** | Hero, recursos, demonstração do copiloto, depoimentos, preços (mensal/anual), FAQ e CTA |
| **Login / cadastro** | Fluxo completo de autenticação, com rotas protegidas e entrada direta na demo |
| **Visão geral** | KPIs (receita do mês vs. meta, forecast ponderado, conversão, ticket médio, ciclo), gráfico de 12 meses, funil, negócios quentes, ranking do time, receita por canal e atividade em tempo real |
| **Pipeline** | Kanban com arrastar e soltar, zonas de ganho/perda, alerta de negócios parados, filtros por responsável e busca, painel lateral de edição |
| **Clientes** | Tabela com LTV, valor em aberto, filtros, ordenação, cadastro e exportação para CSV |
| **Propostas** | Editor com pré-visualização ao vivo, itens, desconto, parcelamento e validade, além de métricas de abertura e aceite |
| **Página pública da proposta** | O cliente abre sem login, escolhe a forma de pagamento e aceita com um clique. A visualização e o aceite atualizam o pipeline e a receita automaticamente |
| **Copiloto IA** | Chat com respostas em streaming: previsão de receita, negócios em risco, foco do dia, performance do time, canais e follow-ups prontos, tudo calculado a partir dos dados do workspace |
| **Paleta de comandos** | `⌘K` / `Ctrl+K` para buscar negócios e clientes, navegar e criar registros |
| **Configurações** | Workspace e meta, plano e faturamento (upgrade, ciclo, uso, faturas), equipe, integrações e segurança (2FA, SSO, sessões) |

## Stack

- React 19 + TypeScript (strict) + Vite 7
- Tailwind CSS v4 com design tokens próprios (grafite + dourado, Inter + Instrument Serif)
- Recharts (gráficos), dnd-kit (kanban) e lucide-react (ícones)
- O build gera **um único `index.html` autocontido** (`vite-plugin-singlefile`), que pode ser hospedado em qualquer CDN

## Arquitetura

```
src/
├── lib/
│   ├── types.ts      # modelo de domínio (Deal, Client, Proposal, Activity, Workspace…)
│   ├── store.tsx     # estado global + persistência (camada de "API")
│   ├── seed.ts       # dados de demonstração determinísticos (12 meses de histórico)
│   ├── metrics.ts    # KPIs, forecast, funil, ranking, insights
│   ├── copilot.ts    # motor do Copiloto (pergunta → análise em texto)
│   └── format.ts     # formatação pt-BR (moeda, datas, relativos)
├── components/       # UI kit (Button, Card, Modal, Drawer…), paleta de comandos, documento de proposta
├── layouts/          # shell do app (sidebar, topbar, notificações)
└── pages/            # Landing, Auth, Dashboard, Pipeline, Clients, Proposals, ProposalEditor, PublicProposal, Copilot, Settings
```

Hoje os dados ficam no `localStorage` do navegador, para a demo funcionar sem servidor. Toda leitura e escrita passa pelo `store.tsx`, então ligar um backend real (Supabase, Postgres + API, Firebase) é trocar a implementação das ações sem mexer nas telas. O mesmo vale para o Copiloto: `answer(db, pergunta)` tem a mesma interface de uma chamada a um LLM.

## Rodando localmente

```bash
cd vertice
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/index.html
npm run typecheck
```

Na tela de login, use **“Entrar com a conta demo”** para abrir um workspace com 12 meses de dados. O botão *Configurações → Workspace → Restaurar* volta tudo ao estado original.

## Próximos passos para produção

1. Backend com autenticação real e multi-tenant (ex.: Supabase com Row Level Security)
2. Cobrança recorrente com Stripe Billing e webhooks de aceite de proposta
3. Copiloto ligado a um LLM via API, usando as métricas de `metrics.ts` como ferramentas
4. Envio de propostas por e-mail e WhatsApp e assinatura eletrônica
