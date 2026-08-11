import { Suspense } from 'react';
import LoginForm from './login-form';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-gray-400">Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
