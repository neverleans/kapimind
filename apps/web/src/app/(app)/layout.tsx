import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OnboardingTour } from '@/components/onboarding-tour';

/**
 * Layout autenticado da aplicação.
 * Redireciona para /login se o usuário não estiver autenticado.
 * Envolve todas as rotas privadas: /dashboard, /simulator, /explorer, /ir-helper, /alerts, /roadmap, /settings.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 glass-panel">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-blue to-brand-purple">
            Investimentos
          </Link>
          <nav className="hidden md:flex gap-6 text-sm text-gray-400">
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            <Link href="/portfolio" className="hover:text-white">Portfólio</Link>
            <Link href="/simulator" className="hover:text-white">Simulador</Link>
            <Link href="/calculators" className="hover:text-white">Calculadoras</Link>
            <Link href="/explorer" className="hover:text-white">FIIs</Link>
            <Link href="/alerts" className="hover:text-white">Alertas</Link>
            <Link href="/roadmap" className="hover:text-white">Roadmap</Link>
            <Link href="/ir-helper" className="hover:text-white">IR</Link>
          </nav>
          <div className="text-sm text-gray-500">{session.user?.email}</div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">{children}</main>
      <OnboardingTour />
    </div>
  );
}
