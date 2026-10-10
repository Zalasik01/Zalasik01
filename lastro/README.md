# Lastro

Lastro mostra a escritórios contábeis quais clientes do Simples Nacional vão ficar sem caixa com o fim do regime de caixa em 2027, quanto precisam reservar e o que fazer antes da virada.

## A necessidade (pesquisa de mercado, outubro de 2026)

| Fato | Fonte |
| --- | --- |
| A Resolução CGSN 190/2026 extingue o regime de caixa no Simples a partir de 1º/01/2027. O DAS passa a incidir sobre as notas emitidas, mesmo que o cliente pague depois ou não pague. | [Fenacon](https://fenacon.org.br/noticias/regime-de-caixa-deixara-de-ser-utilizado-na-apuracao-do-simples-nacional/), [Portal Contábeis](https://www.contabeis.com.br/artigos/78817/simples-nacional-fim-do-regime-de-caixa-em-2027-muda-gestao/) |
| Não há regra de transição para notas de 2026 recebidas em 2027. | [Elscon](https://www.elscon.com.br/post/regime-caixa-simples-2027) |
| Inadimplência recorde: 9,1 milhões de CNPJs com dívidas em atraso em junho de 2026; 95% são micro e pequenas empresas. | [Serasa via Tribuna PR](https://www.tribunapr.com.br/noticias/economia/inadimplencia-de-empresas-bate-recorde-e-atinge-91-milhoes-no-brasil) |
| PMEs têm 43% do crédito e cerca de ¾ do crédito vencido; o atraso de microempresas subiu 45% em um ano. | [Correio Braziliense (FecomercioSP/BC)](https://blogs.correiobraziliense.com.br/aricunha/inadimplencia-das-empresas-2027/) |
| Próxima janela para recolher IBS/CBS fora do DAS: 1 a 31 de março de 2027. | [Tecnospeed](https://blog.tecnospeed.com.br/reforma-tributaria-para-simples-nacional/) |
| Split payment foi adiado e está sem data. | [Nota Gateway](https://notagateway.com.br/?p=14298) |

**Lacuna:** os simuladores da reforma para o Simples (e-Auditoria, TAX SimpliQ, VEROT) comparam IBS/CBS dentro e fora do DAS e geram relatórios pontuais. Nenhum projeta o descasamento entre imposto e recebimento, que é onde a regra de faturamento dói, nem transforma isso em ação.

**Cliente:** escritórios contábeis. Eles atendem a maioria das empresas do Simples, são quem recebe a ligação quando o caixa do cliente aperta e podem vender a análise como consultoria de virada.

## O produto

- **Carteira:** todas as empresas do escritório ordenadas pelo caixa que precisarão reservar, com nível de risco, alíquota efetiva, prazo médio e inadimplência reais.
- **Diagnóstico 2027:** DAS mês a mês pela regra de caixa e pela de faturamento, diferença acumulada, pico e como os clientes da empresa pagam (curva de recebimento aprendida das notas).
- **Dois cenários de transição:** pior caso (notas de 2026 tributadas no recebimento em 2027) e sem bitributação.
- **Recebíveis:** notas em aberto, quais caem em 2027, DAS antecipado por nota, concentração por devedor e mensagem de cobrança pronta.
- **Plano de ação:** ações com valor e prazo (reserva, antecipação de recebíveis de 2026, cobrança, reprecificação, concentração, inadimplência, Simples híbrido) e mensagem para o cliente.
- **Preço a prazo:** preço mínimo para que vender a prazo renda o mesmo que à vista, separando juros, risco e imposto antecipado, com o desconto máximo para Pix à vista.
- **Triagem IBS/CBS:** indica quem deve simular o Simples híbrido antes de março.
- **Calendário 2026–2027** com contagem regressiva e fontes.
- **Importação por CSV** (contas a receber ou lista de notas). Os dados ficam no navegador.

## Como o cálculo funciona

`src/lib/simples.ts` tem as tabelas dos Anexos I a V (LC 123/2006, redação da LC 155/2016) e a fórmula da alíquota efetiva. `src/lib/engine.ts`:

1. Monta os últimos 12 meses de faturado e recebido e calcula o RBT12.
2. Aprende, nas notas emitidas há mais de 180 dias, que fração de cada real faturado entra no mesmo mês, em +1, +2… meses, ou nunca.
3. Projeta 2027 repetindo a sazonalidade com o crescimento informado e calcula, mês a mês, o DAS sobre recebimentos (regra antiga) e sobre emissão (regra nova), incluindo os recebíveis emitidos até dezembro de 2026.
4. O pico da diferença acumulada é o capital de giro a reservar.

O preço a prazo resolve `x = P(1 − a) / (F − a)`, em que `F` é o valor presente esperado de R$ 1 a receber nas parcelas, descontado pelos juros e pela inadimplência.

## Rodando

```bash
cd lastro
npm install
npm run dev        # http://localhost:5173
npm test           # verificações do motor de cálculo
npm run build      # gera dist/index.html autocontido
```

## Limites conhecidos

- A carteira de demonstração tem notas fictícias geradas a partir da data de hoje.
- A triagem de IBS/CBS usa a CBS de referência estimada pelo CGIBS e a parcela aproximada de PIS/Cofins no DAS; a decisão exige a apuração com os XMLs.
- Sem backend: para uso real, o próximo passo é login multi-escritório e importação direta dos XMLs de NF-e/NFS-e e do PGDAS-D.
