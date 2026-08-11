import { Bell, Send, ExternalLink, AlertCircle, CheckCircle2, Terminal } from 'lucide-react';
import Link from 'next/link';

const stack = [
  { name: 'TradingView Pro', cost: '~R$ 90/mês', role: 'Origem dos sinais. Pine Script cria regras, alert() envia POST quando dispara.' },
  { name: 'Nossa Plataforma', cost: 'Grátis', role: 'Captura o alerta, valida (HMAC), enriquece com cotação brapi, manda pra IA e Telegram.' },
  { name: 'Anthropic API', cost: '~R$ 0,10/alerta', role: 'Recebe alerta bruto + contexto, devolve sugestão contextual (BUY/HOLD/SELL/REVIEW).' },
  { name: 'Telegram Bot', cost: 'Grátis', role: 'Mensagem formatada chega no celular. Comandos: /start, /status, /pause, /resume.' },
];

const reasons = [
  { pro: 'Combo padrão de mercado', detail: 'TradingView → webhook → BullMQ → IA → Telegram.' },
  { pro: 'Você ainda decide', detail: 'Alerta vira "sugestão" no Telegram. Você decide se compra, vende ou ignora. Sem auto-trade.' },
  { pro: 'IA contextualiza', detail: 'Malkiel/Graham/Damodaran entram no prompt. A sugestão cita o livro que justifica a decisão.' },
  { pro: 'Histórico pesquisável', detail: 'Cada alerta persistido em PostgreSQL. Recomendação + confidence + reasoning + citation.' },
  { pro: 'Seguro', detail: 'HMAC SHA256 obrigatório. Sem confetti. Só notificação clara baseada em dados.' },
];

const notReasons = [
  'TradingView Pro não tem integração nativa com Make/Zapier. Precisa de webhook direto.',
  'Cripto com R$ 600/mês é furada. Custa 1-2% por trade em spreads.',
  'Day-trade com R$ 600/mês está fora de questão.',
  'Auto-trade é regulado e arriscado.',
  'Grupos de "sinal" pago no Telegram: 90%+ são afiliado/pseudo. CVM alerta.',
];

const curlExample = `curl -X POST https://api.investimentos.lucas.app/webhook/tv \\
  -H "Content-Type: application/json" \\
  -H "TradingView-Signature: sha256=HMAC_HEX" \\
  -d '{
    "ticker": "MXRF11",
    "action": "BUY",
    "price": 9.50,
    "strategy": "rsi_oversold",
    "interval": "1d"
  }'`;

const pineScriptExample = `//@version=5
strategy("RSI Oversold", overlay=true)

rsi = ta.rsi(close, 2)
oversold = ta.crossunder(rsi, 10)

if (oversold)
    strategy.entry("Long", strategy.long)

if (strategy.position_size > 0)
    alert("Ticker: {{ticker}}, Action: BUY, Price: {{close}}, Strategy: rsi_oversold", alert.freq_once_per_bar_close)`;

export default function AlertsPage() {
  return (
    <div className="space-y-8">
      <header className="text-center space-y-4 py-6">
        <Bell className="h-12 w-12 mx-auto text-brand-yellow" />
        <h1 className="text-4xl md:text-5xl font-bold">Alertas 24/7</h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          TradingView detecta → Nossa plataforma processa → IA sugere → Telegram entrega.
        </p>
      </header>

      <section className="glass-panel p-6 rounded-2xl text-center">
        <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Custo total mensal</div>
        <div className="text-4xl font-bold text-brand-yellow">~R$ 90</div>
        <div className="text-xs text-gray-500 mt-1">≈ 15% do seu aporte de R$ 600</div>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-bold">Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stack.map((tool) => (
            <article key={tool.name} className="glass-panel p-6 rounded-2xl border-l-4 border-brand-purple">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold">{tool.name}</h3>
                <span className="text-xs font-mono text-brand-yellow">{tool.cost}</span>
              </div>
              <p className="text-sm text-gray-300">{tool.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <CheckCircle2 className="h-7 w-7 text-brand-green" />
          Por que usar este stack
        </h2>
        <ul className="space-y-3">
          {reasons.map((r, idx) => (
            <li key={idx} className="glass-panel p-4 rounded-xl">
              <div className="font-semibold text-brand-green mb-1">✓ {r.pro}</div>
              <div className="text-sm text-gray-400">{r.detail}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <AlertCircle className="h-7 w-7 text-brand-red" />
          Por que NÃO usar alternativas
        </h2>
        <ul className="space-y-2">
          {notReasons.map((r, idx) => (
            <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
              <span className="text-brand-red">✗</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Step by step */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold">Passo a passo</h2>
        <ol className="space-y-3">
          {[
            { step: 1, title: 'Assine TradingView Pro', detail: 'Permite webhook (US$ 12.95/mês). Crie o gráfico com seus tickers (MXRF11, HGLG11, IVVB11, etc.).' },
            { step: 2, title: 'Crie uma regra no Pine Script', detail: 'Exemplo: RSI(2) cruza abaixo de 10. → alert("rsi_oversold", alert.freq_once_per_bar_close).' },
            { step: 3, title: 'No alerta, adicione Webhook URL', detail: 'Cole: https://api.investimentos.lucas.app/webhook/tv + token HMAC. Configure o segredo na env TV_WEBHOOK_SECRET.' },
            { step: 4, title: 'Nossa plataforma recebe', detail: 'Valida HMAC, enfileira em BullMQ, busca cotação na brapi, chama Anthropic API.' },
            { step: 5, title: 'Você recebe no Telegram', detail: 'Mensagem formatada com sugestão + raciocínio + base teórica (qual livro justifica).' },
          ].map((s) => (
            <li key={s.step} className="glass-panel p-5 rounded-2xl flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-purple text-white flex items-center justify-center font-bold">
                {s.step}
              </div>
              <div>
                <h3 className="font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-gray-400">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Pine Script example */}
      <section className="glass-panel p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Terminal className="h-6 w-6 text-brand-green" />
          Pine Script de exemplo
        </h2>
        <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto">
          {pineScriptExample}
        </pre>
      </section>

      {/* curl example */}
      <section className="glass-panel p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Send className="h-6 w-6 text-brand-blue" />
          Teste o webhook manualmente
        </h2>
        <p className="text-sm text-gray-400 mb-3">
          Use este curl para testar o webhook sem o TradingView. Substitua <code>HMAC_HEX</code> pelo
          HMAC SHA256 do body.
        </p>
        <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto">
          {curlExample}
        </pre>
      </section>

      {/* Architecture */}
      <section className="glass-panel p-6 rounded-2xl">
        <h2 className="text-2xl font-bold mb-4">Pipeline (assíncrono)</h2>
        <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto">
{`TradingView alert() ──POST──► NestJS /webhook/tv
                                  │ valida HMAC SHA256
                                  ▼
                          BullMQ Queue: alerts.raw
                                  │ worker (concurrency=5)
                                  ▼
                          ai-suggest worker (Anthropic)
                                  │ claude-haiku-4-5
                                  ▼
                          Recommendation persistida
                                  │
                                  ▼
                          BullMQ Queue: alerts.suggested
                                  │ worker (concurrency=2)
                                  ▼
                          TelegramDispatchWorker (Telegraf)
                                  │
                                  ▼
                          📱 Telegram: "🔔 MXRF11 — BUY..."`}
        </pre>
      </section>

      {/* CTA */}
      <section className="glass-panel p-8 rounded-2xl text-center space-y-4">
        <h2 className="text-2xl font-bold">Backend pronto</h2>
        <p className="text-gray-400">
          O pipeline completo (webhook → fila → IA → Telegram) está implementado no NestJS. Falta
          configurar as env vars de produção (ANTHROPIC_API_KEY, TELEGRAM_BOT_TOKEN, REDIS_URL).
        </p>
        <Link
          href="/portfolio"
          className="inline-block bg-brand-purple hover:bg-purple-600 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-purple-500/30"
        >
          Ver portfólio →
        </Link>
      </section>
    </div>
  );
}
