/**
 * Helpers de formatação monetária (pt-BR) e número.
 * Re-exporta formatBRL legado + adiciona variações.
 */

export const formatBRL = (value: number): string =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatBRLCompact = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1)}k`;
  }
  return formatBRL(value);
};

export const formatPercent = (value: number, decimals = 2): string =>
  `${(value * 100).toFixed(decimals)}%`;

export const formatNumber = (value: number, decimals = 2): string =>
  value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
};
