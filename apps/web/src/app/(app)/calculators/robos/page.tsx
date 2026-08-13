'use client';

import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, Wallet, AlertCircle, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { ROBO_ADVISORS, calculateRoboCompare, RoboAdvisor } from '@/lib/robo-advisors';
import { formatBRL, formatBRLCompact, formatPercent } from '@/lib/format';

const PROS_CONS_COLORS: Record<'pro' | 'contra', string> = {
  pro: 'text-brand-green',
  contra: 'text-brand-red',
};

export default function RobosPage() {
  const [patrimonio, setPatrimonio] = useState(5000);
  const [aporte, setAporte] = useState(600);
  const [anos, setAnos] = useState(10);
  const [rentabilidade, setRentabilidade] = useState(0.10);
  const [selectedRobo, setSelectedRobo] = useState<RoboAdvisor>(ROBO_ADVISORS[0]);

  const result = useMemo(() => {
    return calculateRoboCompare({
      patrimonioAtual: patrimonio,
      aporteMensal: aporte,
      anos,
      rentabilidadeBruta: rentabilidade,
      taxaRobo: selectedRobo.taxaAnual,
      anosIR: 2,
    });
  }, [patrimonio, aporte, anos, rentabilidade, selectedRobo]);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Wallet className="h-8 w-8 text-brand-blue" />
        <div>
          <h1 className="text-3xl font-bold">Robo-advisors</h1>
          <p className="text-sm text-gray-400">Comparativo Warren, Vérios, Magnetis, BTG, Genial</p>
        </div>
      </header>

      {/* Disclaimer */}
      <div className="glass-panel p-4 rounded-2xl border-l-4 border-brand-yellow">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-brand-yellow mt-0.5" />
          <p className="text-sm text-gray-300">
            <strong>Importante:</strong> Open Banking permite apenas <em>leitura</em> de investimentos.
            Execução de compra/venda permanece manual via Pix. A Warren/Vérios/Magnetis operam com
            custódia própria — você não compra via sua corretora.
          </p>
        </div>
      </div>

      {/* Comparativo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Comparativo de Plataformas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROBO_ADVISORS.map((robo) => {
            const isSelected = robo.slug === selectedRobo.slug;
            return (
              <article
                key={robo.slug}
                onClick={() => setSelectedRobo(robo)}
                className={`glass-panel p-5 rounded-2xl cursor-pointer transition-all border-2 ${
                  isSelected ? 'border-brand-purple' : 'border-transparent hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold">{robo.name}</h3>
                  <span className="text-xs text-gray-500 font-mono">{robo.foco}</span>
                </div>
                <p className="text-sm text-gray-400 mb-3 min-h-[3em]">{robo.descricao}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Taxa a.a.</span>
                    <span className="font-mono font-bold text-brand-purple">
                      {formatPercent(robo.taxaAnual, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Aporte mín.</span>
                    <span className="font-mono font-bold">{formatBRL(robo.aporteMinimo)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10 space-y-1 text-xs">
                  {robo.pros.map((pro, i) => (
                    <p key={i} className="flex items-start gap-1">
                      <CheckCircle2 className="h-3 w-3 text-brand-green mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{pro}</span>
                    </p>
                  ))}
                  {robo.contras.map((contra, i) => (
                    <p key={i} className="flex items-start gap-1">
                      <XCircle className="h-3 w-3 text-brand-red mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{contra}</span>
                    </p>
                  ))}
                </div>
                <a
                  href={robo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-brand-blue hover:text-white"
                >
                  Visitar site <ExternalLink className="h-3 w-3" />
                </a>
              </article>
            );
          })}
        </div>
      </section>

      {/* Calculadora */}
      <section className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-brand-purple" />
          Calculadora: Vale a pena um robo? ({selectedRobo.name})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Slider
            label="Patrimônio atual"
            min={0}
            max={100000}
            step={1000}
            value={patrimonio}
            onChange={setPatrimonio}
            prefix="R$ "
          />
          <Slider
            label="Aporte mensal"
            min={100}
            max={3000}
            step={50}
            value={aporte}
            onChange={setAporte}
            prefix="R$ "
          />
          <Slider
            label="Horizonte"
            min={1}
            max={30}
            step={1}
            value={anos}
            onChange={setAnos}
            suffix=" anos"
            formatValue={(v) => `${v}`}
          />
          <Slider
            label="Rentabilidade bruta esperada"
            min={4}
            max={20}
            step={0.5}
            value={rentabilidade * 100}
            onChange={(v) => setRentabilidade(v / 100)}
            suffix="%"
          />
        </div>

        {/* Resultado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <article className="glass-panel p-4 rounded-xl border-l-4 border-brand-blue">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-2">Fazer Manual (DIY)</h3>
            <p className="text-2xl font-bold tabular-nums">
              {formatBRL(result.valorLiquidoDIY)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              IR no resgate: {formatBRL(result.irPagoDIY)} (alíquota 15%)
            </p>
          </article>
          <article
            className={`glass-panel p-4 rounded-xl border-l-4 ${
              result.valeAPena ? 'border-brand-green' : 'border-brand-yellow'
            }`}
          >
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-2">
              {selectedRobo.name}
            </h3>
            <p className="text-2xl font-bold tabular-nums">
              {formatBRL(result.valorLiquidoRobo)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Custo total taxa: {formatBRL(result.custoTaxaTotal)}
            </p>
          </article>
        </div>

        <div
          className={`mt-4 p-4 rounded-2xl border-l-4 ${
            result.valeAPena ? 'border-brand-green' : 'border-brand-yellow'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.valeAPena ? (
              <CheckCircle2 className="h-5 w-5 text-brand-green mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-brand-yellow mt-0.5" />
            )}
            <div>
              <p className="font-semibold">
                {result.valeAPena ? 'Vale a pena fazer manual' : 'Vale a pena usar o robo'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Diferença: {formatBRLCompact(Math.abs(result.diferencaLiquida))} em{' '}
                {anos} anos ({formatPercent(Math.abs(result.diferencaLiquida) / result.valorLiquidoDIY, 2)}{' '}
                do total DIY).
                {result.valeAPena
                  ? ' Para R$ 600/mês em 10 anos, a taxa do robo pode consumir centenas de reais.'
                  : ' Em horizontes curtos, a taxa do robo pesa menos que o IR.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel p-4 rounded-2xl text-xs text-gray-500">
        <p>
          <strong>Premissas:</strong> rentabilidade bruta igual nas duas estratégias (não há alpha). IR
          regressivo aplicado só no resgate (15% após 720 dias). Robo: taxa cobrada anualmente sobre
          patrimônio médio. Fonte: <code>src/lib/robo-advisors.ts</code>.
        </p>
      </section>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  prefix = '',
  suffix = '',
  formatValue,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  formatValue?: (v: number) => string;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-brand-blue font-bold text-sm w-24 text-right tabular-nums">
          {formatValue ? formatValue(value) : `${prefix}${value.toLocaleString('pt-BR')}${suffix}`}
        </span>
      </div>
    </div>
  );
}
