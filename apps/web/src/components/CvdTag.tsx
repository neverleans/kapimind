import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface CvdTagProps {
  value: number; // ex: 0.15 = +15%, -0.08 = -8%
  showPercent?: boolean;
  className?: string;
}

/**
 * Tag CVD-safe: nunca usar só cor para transmitir ganho/perda.
 * Mostra ícone + texto + (opcional) percentual.
 * Testado em simuladores de daltonismo (Coblis, Sim Daltonism).
 */
export function CvdTag({ value, showPercent = true, className = '' }: CvdTagProps) {
  const isUp = value > 0;
  const isDown = value < 0;
  const isFlat = value === 0;

  const Icon = isUp ? ArrowUp : isDown ? ArrowDown : Minus;
  const tone = isUp ? 'up' : isDown ? 'down' : 'flat';
  const label = isUp ? 'Ganho' : isDown ? 'Perda' : 'Estável';

  const tones = {
    up: 'bg-brand-green/15 text-brand-green border-brand-green/40',
    down: 'bg-brand-red/15 text-brand-red border-brand-red/40',
    flat: 'bg-gray-500/15 text-gray-400 border-gray-500/40',
  };

  const sign = isUp ? '+' : '';
  const pct = showPercent ? `${sign}${(value * 100).toFixed(2)}%` : '';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono font-bold ${tones[tone]} ${className}`}
      role="status"
      aria-label={`${label} ${pct}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{label}</span>
      {showPercent && pct && <span aria-hidden="true">{pct}</span>}
    </span>
  );
}

interface CvdColorProps {
  value: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * CvdColor — aplica cor verde/vermelho + ícone ▲/▼ para daltonismo.
 * Substitui uso direto de `text-brand-green` ou `text-brand-red` em resultados.
 */
export function CvdColor({ value, children, className = '' }: CvdColorProps) {
  const tone = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const tones = {
    up: 'text-brand-green',
    down: 'text-brand-red',
    flat: 'text-gray-400',
  };
  return <span className={`${tones[tone]} ${className}`}>{children}</span>;
}
