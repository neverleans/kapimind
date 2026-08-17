'use client';

import { Shield } from 'lucide-react';
import OnboardingSuitability from '@/components/OnboardingSuitability';

export default function SuitabilityPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="text-center space-y-2">
        <Shield className="h-12 w-12 mx-auto text-brand-blue" />
        <h1 className="text-3xl font-bold">Suitability CVM 30</h1>
        <p className="text-sm text-gray-400">
          Questionário de 4 pilares: objetivos, tolerância, experiência, situação financeira.
        </p>
      </header>

      <OnboardingSuitability />

      <p className="text-xs text-gray-500 text-center italic">
        Implementação conforme Res. CVM 30 (vigente desde jan/2025). Apenas single-tenant
        (uso pessoal). Não substitui suitability oficial de plataforma CVM registrada.
      </p>
    </div>
  );
}
