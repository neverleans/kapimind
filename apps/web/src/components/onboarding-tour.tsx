'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

const STORAGE_KEY = 'investimentos-tour-completed';

const STEPS = [
  {
    title: 'Bem-vindo à plataforma!',
    body: 'Vamos fazer um tour rápido de 30s pelas áreas principais.',
    target: null,
  },
  {
    title: '📊 Dashboard',
    body: 'Visão geral do portfólio atual, com holdings, P&L e diagnóstico contextual.',
    target: '/dashboard',
    cta: 'Ir para Dashboard',
  },
  {
    title: '💼 Portfólio',
    body: 'CRUD completo dos seus holdings. Adicione, remova, importe do Inter.',
    target: '/portfolio',
    cta: 'Ir para Portfólio',
  },
  {
    title: '🧮 Calculadoras',
    body: 'Quick wins: meta de aporte, renda alvo, impacto de aporte extra.',
    target: '/calculators',
    cta: 'Ver calculadoras',
  },
  {
    title: '📚 Roadmap Educacional',
    body: '7 livros, 1 lição por noite. Streak + progresso persistido.',
    target: '/roadmap',
    cta: 'Começar leitura',
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Show only once per browser
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  function close() {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      close();
    }
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  if (!open) return null;

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="glass-panel p-6 rounded-2xl max-w-md w-full space-y-4 relative">
        <button onClick={close} className="absolute top-3 right-3 text-gray-400 hover:text-white">
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-purple" />
          <span className="text-xs text-gray-400 uppercase tracking-wider">
            Passo {step + 1} de {STEPS.length}
          </span>
        </div>

        <h2 className="text-2xl font-bold">{currentStep.title}</h2>
        <p className="text-gray-300">{currentStep.body}</p>

        {/* Progress bar */}
        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-purple transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={prev}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          <div className="flex gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i === step ? 'bg-brand-purple' : 'bg-gray-700'}`}
              />
            ))}
          </div>

          {currentStep.target && !isLast ? (
            <Link
              href={currentStep.target}
              onClick={next}
              className="flex items-center gap-1 text-sm text-brand-purple hover:text-white"
            >
              {currentStep.cta}
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              onClick={next}
              className="flex items-center gap-1 text-sm bg-brand-purple hover:bg-purple-600 text-white px-4 py-2 rounded-full"
            >
              {isLast ? 'Começar' : 'Próximo'}
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        <button onClick={close} className="text-xs text-gray-500 hover:text-gray-300 w-full text-center">
          Pular tour
        </button>
      </div>
    </div>
  );
}
