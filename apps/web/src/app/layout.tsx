import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Investimentos — Plano de aceleração',
  description:
    'Plataforma de investimentos pessoais: portfólio, simulador, alertas 24/7 e roadmap educacional.',
  keywords: ['investimentos', 'FIIs', 'ações', 'B3', 'carteira', 'renda variável'],
  authors: [{ name: 'Lucas' }],
  openGraph: {
    type: 'website',
    title: 'Investimentos — Plano de aceleração',
    description: 'Plataforma pessoal de investimentos',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
