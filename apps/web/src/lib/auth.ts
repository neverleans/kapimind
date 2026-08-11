import { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';

/**
 * NextAuth configuration.
 *
 * MVP: single-user local. Para evitar dependência de SMTP no dev,
 * usamos CredentialsProvider com credenciais fixas (configuráveis via env).
 *
 * Em produção, trocar por EmailProvider (magic link) com SMTP real.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    // Provider para desenvolvimento local (single-user, sem SMTP).
    CredentialsProvider({
      name: 'Local',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'lucas@local' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const expectedEmail = process.env.AUTH_LOCAL_EMAIL ?? 'lucas@local';
        const expectedPassword = process.env.AUTH_LOCAL_PASSWORD ?? 'local';
        if (
          credentials?.email === expectedEmail &&
          credentials?.password === expectedPassword
        ) {
          return {
            id: '1',
            name: 'Lucas',
            email: expectedEmail,
          };
        }
        return null;
      },
    }),
    // Em produção, descomentar:
    // EmailProvider({
    //   server: process.env.EMAIL_SERVER,
    //   from: process.env.EMAIL_FROM,
    // }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user && 'id' in user && user.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
