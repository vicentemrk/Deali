"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  children?: CategoryNode[];
};

type AdminOffer = {
  offer_id: string;
  product_name: string;
  store_name: string;
  offer_price: number;
  original_price: number;
  discount_pct: number;
};

type FlatCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  level: number;
};

type ApiResponseMessage = {
  message?: string;
  log?: string;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function flattenCategories(nodes: CategoryNode[], level = 0): FlatCategory[] {
  return nodes.flatMap((node) => [
    {
      id: node.id,
      name: node.name,
      slug: node.slug,
      parent_id: node.parent_id,
      level,
    },
    ...flattenCategories(node.children || [], level + 1),
  ]);
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'ofertas' | 'categorias' | 'scraping'>('scraping');
  const [runState, setRunState] = useState<Record<string, 'idle' | 'running' | 'success' | 'error'>>({});
  const [logs, setLogs] = useState<Record<string, string>>({});
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [newCategoryParentId, setNewCategoryParentId] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategorySlug, setEditingCategorySlug] = useState('');
  const [tabMessage, setTabMessage] = useState<string | null>(null);
  const router = useRouter();

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const showMessage = useCallback((message: string) => {
    setTabMessage(message);
    setTimeout(() => setTabMessage(null), 4000);
  }, []);

  const loadOffers = useCallback(async () => {
    setOffersLoading(true);
    try {
      const res = await fetch('/api/offers?limit=100&page=1&sort=discount_desc', { cache: 'no-store' });
      const data = (await res.json()) as { data?: AdminOffer[] } & ApiResponseMessage;
      if (!res.ok) throw new Error(data.message || 'No se pudieron cargar ofertas');
      setOffers(data.data || []);
    } catch (error: unknown) {
      showMessage(getErrorMessage(error, 'No se pudieron cargar ofertas'));
    } finally {
      setOffersLoading(false);
    }
  }, [showMessage]);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      const data = (await res.json()) as CategoryNode[] & ApiResponseMessage;
      if (!res.ok) throw new Error(data.message || 'No se pudieron cargar categorias');
      setCategories(data || []);
    } catch (error: unknown) {
      showMessage(getErrorMessage(error, 'No se pudieron cargar categorias'));
    } finally {
      setCategoriesLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    if (activeTab === 'ofertas') {
      loadOffers();
    }
    if (activeTab === 'categorias') {
      loadCategories();
    }
  }, [activeTab, loadCategories, loadOffers]);

  const deleteOffer = async (offerId: string) => {
    if (!confirm('Eliminar esta oferta?')) return;
    try {
      const res = await fetch(`/api/admin/offers/${offerId}`, { method: 'DELETE' });
      const data = (await res.json()) as ApiResponseMessage;
      if (!res.ok) throw new Error(data.message || 'No se pudo eliminar la oferta');
      setOffers((current) => current.filter((offer) => offer.offer_id !== offerId));
      showMessage('Oferta eliminada');
    } catch (error: unknown) {
      showMessage(getErrorMessage(error, 'No se pudo eliminar la oferta'));
    }
  };

  const createCategory = async () => {
    if (!newCategoryName.trim() || !newCategorySlug.trim()) {
      showMessage('Nombre y slug son obligatorios');
      return;
    }

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          slug: newCategorySlug.trim(),
          parent_id: newCategoryParentId || null,
        }),
      });
      const data = (await res.json()) as ApiResponseMessage;
      if (!res.ok) throw new Error(data.message || 'No se pudo crear la categoria');

      setNewCategoryName('');
      setNewCategorySlug('');
      setNewCategoryParentId('');
      showMessage('Categoria creada');
      await loadCategories();
    } catch (error: unknown) {
      showMessage(getErrorMessage(error, 'No se pudo crear la categoria'));
    }
  };

  const beginEditCategory = (category: FlatCategory) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
    setEditingCategorySlug(category.slug);
  };

  const saveCategory = async () => {
    if (!editingCategoryId) return;
    if (!editingCategoryName.trim() || !editingCategorySlug.trim()) {
      showMessage('Nombre y slug son obligatorios');
      return;
    }

    try {
      const res = await fetch(`/api/admin/categories/${editingCategoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingCategoryName.trim(),
          slug: editingCategorySlug.trim(),
        }),
      });
      const data = (await res.json()) as ApiResponseMessage;
      if (!res.ok) throw new Error(data.message || 'No se pudo actualizar la categoria');

      setEditingCategoryId(null);
      setEditingCategoryName('');
      setEditingCategorySlug('');
      showMessage('Categoria actualizada');
      await loadCategories();
    } catch (error: unknown) {
      showMessage(getErrorMessage(error, 'No se pudo actualizar la categoria'));
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Eliminar esta categoria?')) return;
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, { method: 'DELETE' });
      const data = (await res.json()) as ApiResponseMessage;
      if (!res.ok) throw new Error(data.message || 'No se pudo eliminar la categoria');
      showMessage('Categoria eliminada');
      await loadCategories();
    } catch (error: unknown) {
      showMessage(getErrorMessage(error, 'No se pudo eliminar la categoria'));
    }
  };

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
      const data = (await res.json()) as ApiResponseMessage;
      if (!res.ok) throw new Error(data.message);

      setRunState(prev => ({ ...prev, [storeSlug]: 'success' }));
      setLogs(prev => ({ ...prev, [storeSlug]: data.log || data.message || 'Scraper ejecutado' }));
    } catch (error: unknown) {
      setRunState(prev => ({ ...prev, [storeSlug]: 'error' }));
      setLogs(prev => ({ ...prev, [storeSlug]: getErrorMessage(error, 'Error desconocido') }));
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

        {tabMessage && (
          <div className="mb-6 rounded-lg border border-border bg-bg-card px-4 py-3 text-sm text-gray-700">
            {tabMessage}
          </div>
        )}

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
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Gestion de ofertas</h2>
              <button
                onClick={loadOffers}
                className="bg-white border border-border text-gray-700 px-3 py-2 rounded-lg text-sm"
              >
                Refrescar
              </button>
            </div>

            {offersLoading ? (
              <p className="text-gray-500">Cargando ofertas...</p>
            ) : offers.length === 0 ? (
              <p className="text-gray-500">No hay ofertas para mostrar.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-bg-card text-left">
                    <tr>
                      <th className="p-3">Producto</th>
                      <th className="p-3">Tienda</th>
                      <th className="p-3">Precio oferta</th>
                      <th className="p-3">Precio original</th>
                      <th className="p-3">Descuento</th>
                      <th className="p-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((offer) => (
                      <tr key={offer.offer_id} className="border-t border-border">
                        <td className="p-3">{offer.product_name}</td>
                        <td className="p-3">{offer.store_name}</td>
                        <td className="p-3">${offer.offer_price}</td>
                        <td className="p-3">${offer.original_price}</td>
                        <td className="p-3">{offer.discount_pct}%</td>
                        <td className="p-3">
                          <button
                            onClick={() => deleteOffer(offer.offer_id)}
                            className="text-deal-red hover:underline"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'categorias' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-bg-card p-4 space-y-3">
              <h2 className="text-lg font-bold">Crear categoria</h2>
              <div className="grid md:grid-cols-3 gap-3">
                <input
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  className="bg-white border border-border rounded-lg px-3 py-2 text-sm"
                  placeholder="Nombre"
                />
                <input
                  value={newCategorySlug}
                  onChange={(event) => setNewCategorySlug(event.target.value)}
                  className="bg-white border border-border rounded-lg px-3 py-2 text-sm"
                  placeholder="slug"
                />
                <select
                  value={newCategoryParentId}
                  onChange={(event) => setNewCategoryParentId(event.target.value)}
                  className="bg-white border border-border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Sin categoria padre</option>
                  {flatCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {`${'  '.repeat(category.level)}${category.name}`}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={createCategory}
                className="bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Crear categoria
              </button>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Gestion de categorias</h2>
              <button
                onClick={loadCategories}
                className="bg-white border border-border text-gray-700 px-3 py-2 rounded-lg text-sm"
              >
                Refrescar
              </button>
            </div>

            {categoriesLoading ? (
              <p className="text-gray-500">Cargando categorias...</p>
            ) : flatCategories.length === 0 ? (
              <p className="text-gray-500">No hay categorias para mostrar.</p>
            ) : (
              <div className="rounded-lg border border-border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-card text-left">
                    <tr>
                      <th className="p-3">Nombre</th>
                      <th className="p-3">Slug</th>
                      <th className="p-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flatCategories.map((category) => {
                      const isEditing = editingCategoryId === category.id;
                      return (
                        <tr key={category.id} className="border-t border-border">
                          <td className="p-3">
                            {isEditing ? (
                              <input
                                value={editingCategoryName}
                                onChange={(event) => setEditingCategoryName(event.target.value)}
                                className="bg-white border border-border rounded px-2 py-1 w-full"
                              />
                            ) : (
                              <span>{`${'  '.repeat(category.level)}${category.name}`}</span>
                            )}
                          </td>
                          <td className="p-3">
                            {isEditing ? (
                              <input
                                value={editingCategorySlug}
                                onChange={(event) => setEditingCategorySlug(event.target.value)}
                                className="bg-white border border-border rounded px-2 py-1 w-full"
                              />
                            ) : (
                              category.slug
                            )}
                          </td>
                          <td className="p-3 space-x-3">
                            {isEditing ? (
                              <>
                                <button onClick={saveCategory} className="text-teal hover:underline">Guardar</button>
                                <button onClick={() => setEditingCategoryId(null)} className="text-gray-500 hover:underline">Cancelar</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => beginEditCategory(category)} className="text-purple hover:underline">Editar</button>
                                <button onClick={() => deleteCategory(category.id)} className="text-deal-red hover:underline">Eliminar</button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
