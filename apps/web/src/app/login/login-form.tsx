'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { TrendingUp, LogIn } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  const [email, setEmail] = useState('lucas@local');
  const [password, setPassword] = useState('local');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Credenciais inválidas. Verifique email e senha.');
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="glass-panel p-8 rounded-2xl max-w-md w-full space-y-6">
      <div className="text-center space-y-2">
        <TrendingUp className="h-12 w-12 mx-auto text-brand-purple" />
        <h1 className="text-2xl font-bold">Investimentos</h1>
        <p className="text-sm text-gray-400">Entre para acessar a plataforma</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-gray-400 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono focus:outline-none focus:border-brand-purple"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-gray-400 mb-1">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono focus:outline-none focus:border-brand-purple"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-purple hover:bg-purple-600 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <LogIn className="h-4 w-4" />
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="text-xs text-gray-500 text-center">
        <p>Dev mode: use lucas@local / local</p>
      </div>
    </div>
  );
}
