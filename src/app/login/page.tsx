"use client";

import React, { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient();
    if (!supabase) {
      setError('Supabase no está configurado. Agrega las variables de entorno.');
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else {
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-md border border-border w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-teal tracking-tighter mb-2">Deali Admin</h1>
          <p className="text-gray-500 text-sm">Ingresa tus credenciales para acceder al panel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-deal-red/10 border border-deal-red text-deal-red text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              placeholder="admin@deali.cl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple text-white font-medium py-2 rounded-lg hover:bg-opacity-90 transition-opacity disabled:opacity-50 mt-4"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
