"use client";

import React, { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'ofertas' | 'categorias' | 'scraping'>('scraping');
  const [runState, setRunState] = useState<Record<string, 'idle' | 'running' | 'success' | 'error'>>({});
  const [logs, setLogs] = useState<Record<string, string>>({});
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/login');
  };

  const triggerScraper = async (storeSlug: string) => {
    setRunState(prev => ({ ...prev, [storeSlug]: 'running' }));
    try {
      const res = await fetch('/api/admin/scraper/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeSlug })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setRunState(prev => ({ ...prev, [storeSlug]: 'success' }));
      setLogs(prev => ({ ...prev, [storeSlug]: data.log || data.message }));
    } catch (error: any) {
      setRunState(prev => ({ ...prev, [storeSlug]: 'error' }));
      setLogs(prev => ({ ...prev, [storeSlug]: error.message }));
    }
  };

  return (
    <div className="min-h-screen bg-bg-page p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-border p-6">
        <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <button onClick={handleLogout} className="text-deal-red font-medium hover:underline">
            Cerrar Sesión
          </button>
        </div>

        <div className="flex gap-4 mb-8">
          {(['ofertas', 'categorias', 'scraping'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium capitalize ${
                activeTab === tab ? 'bg-purple text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'scraping' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Ejecutar Scrapers</h2>
            <div className="space-y-4">
              {['jumbo', 'lider', 'unimarc', 'acuenta', 'tottus', 'santa-isabel'].map(store => (
                <div key={store} className="flex items-center gap-4 bg-bg-card p-4 rounded-lg border border-border">
                  <div className="w-32 font-medium capitalize">{store}</div>
                  <button
                    onClick={() => triggerScraper(store)}
                    disabled={runState[store] === 'running'}
                    className="bg-teal text-white px-4 py-2 rounded font-medium disabled:opacity-50"
                  >
                    {runState[store] === 'running' ? 'Ejecutando...' : 'Ejecutar'}
                  </button>
                  <div className="flex-1 text-sm">
                    {runState[store] === 'success' && <span className="text-green-600">Completado con éxito.</span>}
                    {runState[store] === 'error' && <span className="text-deal-red">Error: {logs[store]}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ofertas' && (
          <div className="text-center py-12 text-gray-500">
            Módulo de gestión de ofertas — Tabla CRUD con react-hook-form + zod
          </div>
        )}

        {activeTab === 'categorias' && (
          <div className="text-center py-12 text-gray-500">
            Módulo de gestión de categorías — Árbol drag-and-drop con dnd-kit
          </div>
        )}
      </div>
    </div>
  );
}
