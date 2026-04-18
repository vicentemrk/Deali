"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronRight, Search } from 'lucide-react';

interface MobileMenuItem {
  id: string;
  name: string;
  slug: string;
  href?: string;
  children?: MobileMenuItem[];
}

interface MobileMenuProps {
  categories: MobileMenuItem[];
}

export function MobileMenu({ categories }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const getHref = (item: MobileMenuItem) => item.href || `/categoria/${item.slug}`;

  return (
    <>
      {/* Hamburger button — only visible on mobile/tablet */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden inline-flex items-center justify-center rounded-xl border border-border bg-white/90 p-2.5 text-ink shadow-sm transition-colors hover:bg-teal-light hover:text-teal"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 z-50 h-full w-[85vw] max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="text-xl font-black tracking-tight text-teal font-display">Deali.</span>
          <button
            onClick={() => setOpen(false)}
            className="rounded-xl p-2 text-ink-weak transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-4">
          <form action="/buscar" method="GET" className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-weak" />
            <input
              type="search"
              name="q"
              placeholder="Buscar productos..."
              className="w-full rounded-xl border border-border bg-bg-input py-2.5 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink-weak focus:border-purple focus:ring-2 focus:ring-purple/20"
            />
          </form>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 pb-8">
          {categories.map((section) => (
            <div key={section.id} className="mb-1">
              {section.children && section.children.length > 0 ? (
                <>
                  <button
                    onClick={() => setExpanded(expanded === section.id ? null : section.id)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-bold text-ink transition-colors hover:bg-teal-light"
                  >
                    {section.name}
                    <ChevronRight
                      className={`h-4 w-4 text-ink-weak transition-transform duration-200 ${
                        expanded === section.id ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      expanded === section.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="ml-2 space-y-0.5 border-l-2 border-teal-light pl-3 py-1">
                      {section.children.map((child) => (
                        <Link
                          key={child.id}
                          href={getHref(child)}
                          onClick={() => setOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-weak transition-colors hover:bg-teal-light hover:text-teal"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  href={getHref(section)}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-3 text-sm font-bold text-ink transition-colors hover:bg-teal-light hover:text-teal"
                >
                  {section.name}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
