import React from 'react';
import Link from 'next/link';
import { DynamicMenu } from './DynamicMenu';
import { MobileMenu } from './MobileMenu';
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
    <header className="sticky top-0 z-40 border-b border-border/80 bg-white/80 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 text-2xl font-black tracking-tight text-teal transition-transform hover:scale-[1.03] sm:text-3xl">
          <span className="font-display">Deali.</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden flex-shrink-0 lg:block">
          <DynamicMenu categories={menuCategories} />
        </div>

        {/* Search + Mobile Menu */}
        <div className="flex items-center gap-3 lg:flex-1 lg:justify-end">
          <form action="/buscar" method="GET" className="hidden w-full max-w-md items-center gap-2 sm:flex lg:justify-end">
            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-weak">
                <svg className="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="search"
                name="q"
                className="block w-full rounded-xl border border-border bg-bg-input p-2.5 pl-9 text-sm text-ink outline-none transition-all placeholder:text-ink-weak focus:border-purple focus:ring-2 focus:ring-purple/20"
                placeholder="Buscar ofertas..."
                required
              />
            </div>
            <button type="submit" className="rounded-xl bg-purple px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition-all hover:bg-purple/90 hover:shadow-md hover:shadow-purple/20">
              Buscar
            </button>
          </form>

          {/* Mobile Menu Button */}
          <MobileMenu categories={menuCategories} />
        </div>
      </div>
    </header>
  );
}
