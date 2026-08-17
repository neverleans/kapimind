'use client';

import { Toaster as SonnerToaster } from 'sonner';

/**
 * Toaster Sonner — substitui o toast customizado.
 * Padrão 2025 recomendado pelas shadcn.
 *
 * Props ajustadas para tema escuro (Kapimind é dark-first).
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      duration={5000}
      theme="dark"
      toastOptions={{
        style: {
          background: 'rgba(30, 41, 59, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#f8fafc',
        },
        classNames: {
          success: 'border-l-4 border-l-brand-green',
          error: 'border-l-4 border-l-brand-red',
          warning: 'border-l-4 border-l-brand-yellow',
          info: 'border-l-4 border-l-brand-blue',
        },
      }}
    />
  );
}
