"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  href?: string;
  children?: Category[];
}

interface DynamicMenuProps {
  categories: Category[];
}

export function DynamicMenu({ categories }: DynamicMenuProps) {
  const pathname = usePathname();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const getHref = (item: Category) => item.href || `/categoria/${item.slug}`;

  return (
    <nav className="relative z-50">
      <ul className="m-0 flex list-none items-center gap-2 rounded-full border border-border bg-white/90 p-1 shadow-soft backdrop-blur-sm">
        {categories.map((cat) => (
          <li key={cat.id} className="relative">
            {cat.children && cat.children.length > 0 ? (
              <div
                onMouseEnter={() => setOpenMenuId(cat.id)}
                onMouseLeave={() => setOpenMenuId(null)}
              >
                <button
                  onClick={() => setOpenMenuId(openMenuId === cat.id ? null : cat.id)}
                  className="flex cursor-pointer list-none items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-teal-light hover:text-teal"
                >
                  {cat.name}
                  <ChevronDown 
                    className={`h-4 w-4 text-ink-weak transition-transform ${
                      openMenuId === cat.id ? 'rotate-180' : ''
                    }`} 
                    aria-hidden 
                  />
                </button>
                {openMenuId === cat.id && (
                  <div className="absolute left-0 top-full mt-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-white p-2 shadow-soft">
                    <ul className="grid max-h-[60vh] list-none gap-1 overflow-y-auto">
                      {cat.children.map(child => (
                        <li key={child.id}>
                          <Link
                            href={getHref(child)}
                            onClick={() => setOpenMenuId(null)}
                            className={clsx(
                              'block rounded-xl px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-teal-light hover:text-teal',
                              pathname === getHref(child) ? 'bg-teal-light text-teal' : ''
                            )}
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={getHref(cat)}
                className={clsx(
                  'block rounded-full px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-teal-light hover:text-teal',
                  pathname === getHref(cat) ? 'bg-teal-light text-teal' : ''
                )}
              >
                {cat.name}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
