'use client';

import { useState } from 'react';
import { computeSuitability, SuitabilityAnswers, SuitabilityResult } from '@/lib/suitability';
import { CheckCircle2, ArrowRight, ArrowLeft, Shield, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

interface OnboardingSuitabilityProps {
  onComplete?: (answers: SuitabilityAnswers, result: SuitabilityResult) => void;
}

const STEP_LABELS: Record<Step, string> = {
  1: 'Objetivos',
  2: 'Tolerância',
  3: 'Experiência',
  4: 'Situação financeira',
};

const GOAL_OPTIONS: { value: SuitabilityAnswers['primaryGoal']; label: string; desc: string }[] = [
  { value: 'preservar', label: 'Preservar capital', desc: 'Quero proteger o que tenho, sem assumir riscos altos' },
  { value: 'renda', label: 'Gerar renda', desc: 'Quero dividendos e fluxo de caixa recorrente' },
  { value: 'crescimento', label: 'Crescimento', desc: 'Quero maximizar retorno no longo prazo' },
  { value: 'aposentadoria', label: 'Aposentadoria', desc: 'Quero complementar minha renda futura' },
];

const RISK_OPTIONS: { value: SuitabilityAnswers['lossReaction']; label: string; icon: any }[] = [
  { value: 'desespero', label: 'Vendo tudo', icon: TrendingDown },
  { value: 'duvida', label: 'Em dúvida', icon: TrendingDown },
  { value: 'seguro', label: 'Seguro', icon: TrendingUp },
  { value: 'vendo', label: 'Vendo oportunidade', icon: TrendingUp },
];

const EXPERIENCE_OPTIONS: { value: SuitabilityAnswers['experience']; label: string }[] = [
  { value: 'nenhuma', label: 'Nenhuma (começando agora)' },
  { value: 'rf', label: 'Renda fixa (CDB, Tesouro)' },
  { value: 'fundos', label: 'Fundos de investimento' },
  { value: 'acoes', label: 'Ações + FIIs' },
  { value: 'derivativos', label: 'Derivativos + Opções' },
];

export default function OnboardingSuitability({ onComplete }: OnboardingSuitabilityProps) {
  const [step, setStep] = useState<Step>(1);
  const [answers, setAnswers] = useState<SuitabilityAnswers>({
    primaryGoal: 'renda',
    horizonYears: 5,
    lossReaction: 'seguro',
    riskCapacity: 30,
    experience: 'nenhuma',
    yearsInvesting: 0,
    monthlyIncome: 5000,
    reserveMonths: 6,
    hasEmergencyFund: false,
  });

  const [result, setResult] = useState<SuitabilityResult | null>(null);

  function update<K extends keyof SuitabilityAnswers>(key: K, value: SuitabilityAnswers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function next() {
    if (step < 4) setStep((step + 1) as Step);
    else {
      const r = computeSuitability(answers);
      setResult(r);
      onComplete?.(answers, r);
    }
  }

  function back() {
    if (step > 1) setStep((step - 1) as Step);
  }

  if (result) {
    return <ResultPanel result={result} onReset={() => setResult(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-brand-purple' : 'bg-gray-700'}`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400 text-center">
        Passo {step} de 4 — {STEP_LABELS[step]}
      </p>

      {/* Step content */}
      <div className="glass-panel p-6 rounded-2xl space-y-6 min-h-[400px]">
        {step === 1 && <StepGoals answers={answers} update={update} />}
        {step === 2 && <StepTolerance answers={answers} update={update} />}
        {step === 3 && <StepExperience answers={answers} update={update} />}
        {step === 4 && <StepSituation answers={answers} update={update} />}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={back}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <span className="text-xs text-gray-500">
          CVM 30 — Lei 13.709/2018 — perfil por objetivo
        </span>
        <button
          onClick={next}
          className="flex items-center gap-2 bg-brand-purple hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold"
        >
          {step === 4 ? 'Calcular perfil' : 'Próximo'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function StepGoals({ answers, update }: { answers: SuitabilityAnswers; update: <K extends keyof SuitabilityAnswers>(k: K, v: SuitabilityAnswers[K]) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Wallet className="h-5 w-5 text-brand-purple" />
        Qual seu objetivo principal?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {GOAL_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update('primaryGoal', opt.value)}
            className={`p-4 rounded-xl border text-left transition-all ${
              answers.primaryGoal === opt.value
                ? 'bg-brand-purple/20 border-brand-purple'
                : 'bg-gray-900/50 border-white/10 hover:border-white/30'
            }`}
          >
            <p className="font-semibold">{opt.label}</p>
            <p className="text-xs text-gray-400 mt-1">{opt.desc}</p>
          </button>
        ))}
      </div>
      <div className="pt-4">
        <label className="block text-sm text-gray-400 mb-2">
          Horizonte (anos): <span className="text-brand-blue font-bold">{answers.horizonYears}</span>
        </label>
        <input
          type="range"
          min={0}
          max={30}
          value={answers.horizonYears}
          onChange={(e) => update('horizonYears', Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}

function StepTolerance({ answers, update }: { answers: SuitabilityAnswers; update: <K extends keyof SuitabilityAnswers>(k: K, v: SuitabilityAnswers[K]) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Shield className="h-5 w-5 text-brand-yellow" />
        Como reagiria a uma queda de 20%?
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {RISK_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => update('lossReaction', opt.value)}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                answers.lossReaction === opt.value
                  ? 'bg-brand-purple/20 border-brand-purple'
                  : 'bg-gray-900/50 border-white/10 hover:border-white/30'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm">{opt.label}</span>
            </button>
          );
        })}
      </div>
      <div className="pt-4">
        <label className="block text-sm text-gray-400 mb-2">
          Quanto do seu patrimônio aceita perder em um ano adverso? <span className="text-brand-blue font-bold">{answers.riskCapacity}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={answers.riskCapacity}
          onChange={(e) => update('riskCapacity', Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}

function StepExperience({ answers, update }: { answers: SuitabilityAnswers; update: <K extends keyof SuitabilityAnswers>(k: K, v: SuitabilityAnswers[K]) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Shield className="h-5 w-5 text-brand-blue" />
        Qual sua experiência com investimentos?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {EXPERIENCE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update('experience', opt.value)}
            className={`p-3 rounded-xl border text-left transition-all ${
              answers.experience === opt.value
                ? 'bg-brand-purple/20 border-brand-purple'
                : 'bg-gray-900/50 border-white/10 hover:border-white/30'
            }`}
          >
            <p className="text-sm">{opt.label}</p>
          </button>
        ))}
      </div>
      <div className="pt-4">
        <label className="block text-sm text-gray-400 mb-2">
          Anos investindo: <span className="text-brand-blue font-bold">{answers.yearsInvesting}</span>
        </label>
        <input
          type="range"
          min={0}
          max={50}
          value={answers.yearsInvesting}
          onChange={(e) => update('yearsInvesting', Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}

function StepSituation({ answers, update }: { answers: SuitabilityAnswers; update: <K extends keyof SuitabilityAnswers>(k: K, v: SuitabilityAnswers[K]) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Wallet className="h-5 w-5 text-brand-green" />
          Situação financeira
        </h2>
      <div>
        <label className="block text-sm text-gray-400 mb-2">Renda mensal (R$)</label>
        <input
          type="number"
          value={answers.monthlyIncome}
          onChange={(e) => update('monthlyIncome', Number(e.target.value))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Reserva de emergência (meses de despesas): <span className="text-brand-blue font-bold">{answers.reserveMonths}</span>
        </label>
        <input
          type="range"
          min={0}
          max={24}
          value={answers.reserveMonths}
          onChange={(e) => update('reserveMonths', Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-white/10 bg-gray-900/50">
        <input
          type="checkbox"
          checked={answers.hasEmergencyFund}
          onChange={(e) => update('hasEmergencyFund', e.target.checked)}
          className="w-5 h-5"
        />
        <span>Já tenho reserva de emergência (≥ 6 meses)</span>
      </label>
    </div>
  );
}

function ResultPanel({ result, onReset }: { result: SuitabilityResult; onReset: () => void }) {
  const profileColors = {
    conservador: 'text-brand-blue',
    moderado: 'text-brand-yellow',
    agressivo: 'text-brand-green',
  };
  const profileLabels = {
    conservador: 'Conservador',
    moderado: 'Moderado',
    agressivo: 'Agressivo',
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-8 rounded-2xl text-center">
        <CheckCircle2 className="h-12 w-12 mx-auto text-brand-green mb-2" />
        <h2 className="text-2xl font-bold mb-2">Seu perfil é</h2>
        <p className={`text-4xl font-bold ${profileColors[result.profile]}`}>
          {profileLabels[result.profile]}
        </p>
        <p className="text-sm text-gray-400 mt-2">Score: {result.score.toFixed(0)}/100</p>
      </div>

      {/* Recomendações */}
      <section className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-3">📊 Alocação recomendada</h3>
        <ul className="space-y-2">
          {result.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-brand-green font-bold">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Proibidos */}
      <section className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-3">⛔ Restrições</h3>
        <ul className="space-y-2">
          {result.prohibitedAssets.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-brand-red">
              <span>✗</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Flags */}
      {result.flags.length > 0 && (
        <section className="glass-panel p-6 rounded-2xl border-l-4 border-brand-yellow">
          <h3 className="text-lg font-bold mb-3">⚠️ Alertas</h3>
          <ul className="space-y-2">
            {result.flags.map((f, i) => (
              <li key={i} className="text-sm text-yellow-300">{f}</li>
            ))}
          </ul>
        </section>
      )}

      <button
        onClick={onReset}
        className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
      >
        Refazer questionário
      </button>
    </div>
  );
}
