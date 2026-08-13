import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ScoreBadge } from './ScoreBadge';
import { SuggestionCard } from './SuggestionCard';

describe('ScoreBadge', () => {
  it('renders score REDUCE with red colors', () => {
    const { container } = render(<ScoreBadge score={32} bucket="REDUCE" />);
    expect(container.textContent).toContain('32');
    expect(container.textContent).toContain('REDUCE');
  });

  it('renders score HOLD with yellow colors', () => {
    const { container } = render(<ScoreBadge score={55} bucket="HOLD" />);
    expect(container.textContent).toContain('55');
    expect(container.textContent).toContain('HOLD');
  });

  it('renders score INCREASE with green colors', () => {
    const { container } = render(<ScoreBadge score={82} bucket="INCREASE" />);
    expect(container.textContent).toContain('82');
    expect(container.textContent).toContain('INCREASE');
  });
});

describe('SuggestionCard', () => {
  const suggestion = {
    id: 's1',
    fromTicker: 'VGHF11',
    toTicker: 'HGLG11',
    score: 32,
    bucket: 'REDUCE' as const,
    reason: 'VGHF11 em seca de dividendos ha 3 meses; P/VP em 0,63 indica stress.',
    paperTradeGain: 850,
    createdAt: '2026-08-11T00:00:00Z',
  };

  it('renders ticker pair and reason', () => {
    const { container } = render(<SuggestionCard suggestion={suggestion} />);
    expect(container.textContent).toContain('VGHF11');
    expect(container.textContent).toContain('HGLG11');
    expect(container.textContent).toMatch(/VGHF11 em seca/);
  });

  it('shows positive paper trade gain formatted as BRL', () => {
    const { container } = render(<SuggestionCard suggestion={suggestion} />);
    expect(container.textContent).toMatch(/R\$\s*850/);
  });

  it('shows negative paper trade gain with - sign', () => {
    const { container } = render(
      <SuggestionCard suggestion={{ ...suggestion, paperTradeGain: -200 }} />,
    );
    expect(container.textContent).toMatch(/-R\$\s*200/);
  });

  it('renders action buttons', () => {
    const { container } = render(<SuggestionCard suggestion={suggestion} />);
    expect(container.textContent).toContain('Aceitar e rebalancear');
    expect(container.textContent).toContain('Agora nao');
    expect(container.textContent).toContain('Lembrar em 7 dias');
  });
});
