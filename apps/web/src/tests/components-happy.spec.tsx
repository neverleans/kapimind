import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ScoreBadge } from '../components/ScoreBadge';
import { CvdTag } from '../components/CvdTag';

const h = React.createElement;

describe('ScoreBadge (happy-dom + jest-dom)', () => {
  it('renders score 50 no bucket HOLD', () => {
    render(h(ScoreBadge, { score: 50, bucket: 'HOLD' }));
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('HOLD')).toBeInTheDocument();
  });

  it('renders score 32 no bucket REDUCE', () => {
    render(h(ScoreBadge, { score: 32, bucket: 'REDUCE' }));
    expect(screen.getByText('32')).toBeInTheDocument();
    expect(screen.getByText('REDUCE')).toBeInTheDocument();
  });

  it('renders score 80 no bucket INCREASE', () => {
    render(h(ScoreBadge, { score: 80, bucket: 'INCREASE' }));
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('INCREASE')).toBeInTheDocument();
  });

  it('aceita prop size (lg)', () => {
    const { container } = render(h(ScoreBadge, { score: 50, bucket: 'HOLD', size: 'lg' }));
    expect(container.firstChild).toHaveClass('px-4 py-2');
  });
});

describe('CvdTag (happy-dom + jest-dom)', () => {
  it('renders ganho para valor positivo', () => {
    render(h(CvdTag, { value: 0.15 }));
    expect(screen.getByText('Ganho')).toBeInTheDocument();
    expect(screen.getByText(/15\.00/)).toBeInTheDocument();
  });

  it('renders perda para valor negativo', () => {
    render(h(CvdTag, { value: -0.08 }));
    expect(screen.getByText('Perda')).toBeInTheDocument();
    expect(screen.getByText(/8\.00/)).toBeInTheDocument();
  });

  it('renders estavel para zero', () => {
    render(h(CvdTag, { value: 0 }));
    expect(screen.getByText(/Est/i)).toBeInTheDocument();
  });

  it('oculta percentual quando showPercent=false', () => {
    render(h(CvdTag, { value: 0.05, showPercent: false }));
    expect(screen.getByText('Ganho')).toBeInTheDocument();
    expect(screen.queryByText(/5\.00/)).not.toBeInTheDocument();
  });
});
