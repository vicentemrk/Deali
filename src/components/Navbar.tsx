import React from 'react';
import Link from 'next/link';
import { DynamicMenu } from './DynamicMenu';
import { CATEGORY_OPTIONS } from '@/lib/catalog';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type DbCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

function isSupportedSlug(slug: string, supportedSlugs: Set<string>): boolean {
  return supportedSlugs.has(slug);
}

function buildHeaderCategories(categories: DbCategory[]) {
  const byParent = new Map<string | null, DbCategory[]>();

  for (const category of categories) {
    const key = category.parent_id ?? null;
    const list = byParent.get(key) || [];
    list.push(category);
    byParent.set(key, list);
  }

  const topLevel = byParent.get(null) || [];

  return topLevel.map((parent) => {
    const children = (byParent.get(parent.id) || []).map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
    }));

    return {
      id: parent.id,
      name: parent.name,
      slug: parent.slug,
      children,
    };
  });
}

const HEADER_CATEGORIES = [
  {
    id: 'supermercados',
    name: 'Supermercados',
    slug: 'supermercados',
    children: [
      { id: 'jumbo', name: 'Jumbo', slug: 'jumbo' },
      { id: 'lider', name: 'Lider', slug: 'lider' },
      { id: 'unimarc', name: 'Unimarc', slug: 'unimarc' },
      { id: 'acuenta', name: 'aCuenta', slug: 'acuenta' },
      { id: 'tottus', name: 'Tottus', slug: 'tottus' },
      { id: 'santa-isabel', name: 'Santa Isabel', slug: 'santa-isabel' },
    ].map((store) => ({ ...store, href: `/supermercado/${store.slug}` }))
  },
  {
    id: 'categorias',
    name: 'Categorias',
    slug: 'categorias',
    children: CATEGORY_OPTIONS.map((cat) => ({ id: cat.slug, name: cat.name, slug: cat.slug }))
  }
];

export async function Navbar() {
  const supabase = await createServerSupabaseClient();

  let dynamicCategories = CATEGORY_OPTIONS.map((cat) => ({
    id: cat.slug,
    name: cat.name,
    slug: cat.slug,
  }));

  if (supabase) {
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id')
      .order('name');

    const parsed = (data || []) as DbCategory[];
    if (parsed.length > 0) {
      const built = buildHeaderCategories(parsed);
      const supportedSlugs = new Set(CATEGORY_OPTIONS.map((cat) => cat.slug));
      const filteredBuilt = built
        .filter((category) => isSupportedSlug(category.slug, supportedSlugs))
        .map((category) => ({
          ...category,
          children: (category.children || []).filter((child) => isSupportedSlug(child.slug, supportedSlugs)),
        }))
        .filter((category) => category.children.length > 0 || isSupportedSlug(category.slug, supportedSlugs));

      dynamicCategories = (filteredBuilt.length > 0
        ? filteredBuilt
        : parsed
            .filter((cat) => isSupportedSlug(cat.slug, supportedSlugs))
            .map((cat) => ({ id: cat.slug, name: cat.name, slug: cat.slug }))) as typeof dynamicCategories;
    }
  }

  const menuCategories = HEADER_CATEGORIES.map((section) =>
    section.id === 'categorias'
      ? { ...section, children: dynamicCategories }
      : section
  );

  return (
    <header className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        
        {/* Logo */}
        <Link href="/" className="text-3xl font-black text-teal tracking-tighter">
          Deali.
        </Link>
        
        {/* Navigation Dropdown */}
        <div className="hidden md:block flex-shrink-0 z-50">
            <DynamicMenu categories={menuCategories} />
        </div>

        {/* Search Bar */}
        <form action="/buscar" method="GET" className="flex-1 min-w-[200px] max-w-xl mx-auto flex">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
               <svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
               </svg>
            </div>
            <input 
              type="search" 
              name="q"
              className="block w-full p-3 pl-10 text-sm text-gray-900 border border-gray-200 rounded-full bg-bg-page focus:ring-purple focus:border-purple outline-none transition-all" 
              placeholder="Buscar marcas, pisco, arroz, atún..." 
              required 
            />
          </div>
          <button type="submit" className="hidden" aria-label="Buscar">Buscar</button>
        </form>

      </div>
    </header>
  );
}
