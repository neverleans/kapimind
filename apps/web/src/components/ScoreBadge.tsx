import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface ScoreBadgeProps {
  score: number; // 0-100
  bucket: 'REDUCE' | 'HOLD' | 'INCREASE';
  size?: 'sm' | 'md' | 'lg';
}

const BUCKET_COLORS: Record<ScoreBadgeProps['bucket'], { bg: string; text: string; border: string }> = {
  REDUCE: {
    bg: 'bg-brand-red/20',
    text: 'text-brand-red',
    border: 'border-brand-red/50',
  },
  HOLD: {
    bg: 'bg-brand-yellow/20',
    text: 'text-brand-yellow',
    border: 'border-brand-yellow/50',
  },
  INCREASE: {
    bg: 'bg-brand-green/20',
    text: 'text-brand-green',
    border: 'border-brand-green/50',
  },
};

const SIZES: Record<NonNullable<ScoreBadgeProps['size']>, { padding: string; text: string }> = {
  sm: { padding: 'px-2 py-0.5', text: 'text-xs' },
  md: { padding: 'px-3 py-1', text: 'text-sm' },
  lg: { padding: 'px-4 py-2', text: 'text-base font-bold' },
};

export function ScoreBadge({ score, bucket, size = 'md' }: ScoreBadgeProps) {
  const colors = BUCKET_COLORS[bucket];
  const sizing = SIZES[size];
  const Icon = bucket === 'INCREASE' ? ArrowUp : bucket === 'REDUCE' ? ArrowDown : Minus;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizing.padding} ${sizing.text}`}
    >
      <Icon className="h-3 w-3" />
      <span className="font-mono font-bold tabular-nums">{score}</span>
      <span className="text-xs uppercase tracking-wide">{bucket}</span>
    </div>
  );
}
