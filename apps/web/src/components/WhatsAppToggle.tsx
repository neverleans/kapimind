'use client';

import { useState } from 'react';
import { Phone, CheckCircle2, AlertCircle } from 'lucide-react';

interface WhatsAppToggleProps {
  enabled: boolean;
  phoneNumber?: string;
  onChange: (enabled: boolean, phone?: string) => void;
  loading?: boolean;
}

export function WhatsAppToggle({ enabled, phoneNumber, onChange, loading }: WhatsAppToggleProps) {
  const [phone, setPhone] = useState(phoneNumber ?? '');
  const [showPhone, setShowPhone] = useState(!phoneNumber);

  const validPhone = /^\d{10,13}$/.test(phone.replace(/\D/g, ''));

  function handleToggle() {
    const newVal = !enabled;
    onChange(newVal, phone || undefined);
  }

  function handlePhoneSave() {
    onChange(enabled, phone);
    setShowPhone(false);
  }

  return (
    <div className="glass-panel p-5 rounded-2xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-bold flex items-center gap-2">
            <svg
              className="h-5 w-5 text-brand-green"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
            </svg>
            WhatsApp 1-clique
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Receber sugestões de rebalanceamento com Quick Reply (SIM/NÃO)
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading || (showPhone && !validPhone)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-brand-green' : 'bg-gray-600'
          } ${loading ? 'opacity-50' : ''}`}
          aria-label="Toggle WhatsApp notifications"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          {showPhone ? (
            <div className="space-y-2">
              <label className="block text-xs text-gray-400">
                Seu número WhatsApp (com DDI, ex: 5511987654321)
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="5511999998888"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-brand-green"
                />
                <button
                  onClick={handlePhoneSave}
                  disabled={!validPhone}
                  className="px-3 py-2 bg-brand-green text-white text-sm rounded-lg font-semibold disabled:opacity-50 flex items-center gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Salvar
                </button>
              </div>
              {!validPhone && phone.length > 0 && (
                <p className="text-xs text-brand-red flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Formato: DDI + DDD + número (10-13 dígitos)
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 flex items-center gap-2">
                <Phone className="h-3 w-3" /> {phoneNumber}
              </span>
              <button
                onClick={() => setShowPhone(true)}
                className="text-xs text-brand-blue hover:text-white"
              >
                Editar
              </button>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 italic">
        ⚠️ Templates WhatsApp Utility precisam ser pré-aprovados pela Meta. Em produção, use o
        <a
          href="https://business.facebook.com/wa/manage/template/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-blue hover:text-white ml-1"
        >
          Business Manager
        </a>
        .
      </div>
    </div>
  );
}
