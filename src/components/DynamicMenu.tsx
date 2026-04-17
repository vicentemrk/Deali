"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
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
  const getHref = (item: Category) => item.href || `/categoria/${item.slug}`;

  return (
    <NavigationMenu.Root className="relative z-50 flex w-full justify-center">
      <NavigationMenu.List className="m-0 flex list-none rounded-xl bg-white p-1 shadow-sm border border-border gap-1">
        {categories.map((cat) => (
          <NavigationMenu.Item key={cat.id}>
             {cat.children && cat.children.length > 0 ? (
                <>
                  <NavigationMenu.Trigger className="text-gray-700 hover:text-teal focus:text-teal group flex select-none items-center justify-between gap-1 rounded-lg px-4 py-2.5 text-sm font-medium leading-none outline-none focus:bg-teal-light/40 focus:shadow-[0_0_0_2px]">
                    {cat.name}
                    <ChevronDown
                      className="text-gray-400 group-data-[state=open]:rotate-180 transition-transform duration-250 ease-in"
                      aria-hidden
                    />
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content className="absolute top-full left-0 mt-3 w-[320px] max-w-[calc(100vw-2rem)]">
                    <ul className="m-0 grid list-none gap-1 p-3 bg-white rounded-2xl shadow-xl border border-border max-h-[60vh] overflow-y-auto">
                      {cat.children.map(child => (
                        <li key={child.id}>
                          <NavigationMenu.Link asChild>
                            <Link 
                                href={getHref(child)}
                                className={clsx(
                                  "block select-none rounded-lg px-4 py-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-teal-light whitespace-nowrap",
                                  pathname === getHref(child) ? 'text-teal font-medium' : 'text-gray-700 hover:text-teal'
                                )}
                            >
                                {child.name}
                            </Link>
                          </NavigationMenu.Link>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenu.Content>
                </>
             ) : (
                <NavigationMenu.Link asChild>
                    <Link 
                      href={getHref(cat)}
                        className={clsx(
                      "text-gray-700 hover:text-teal focus:text-teal block select-none rounded-lg px-4 py-2.5 text-sm font-medium leading-none no-underline outline-none focus:bg-teal-light/40 focus:shadow-[0_0_0_2px]",
                        pathname === getHref(cat) ? 'text-teal font-medium' : ''
                        )}
                    >
                        {cat.name}
                    </Link>
                </NavigationMenu.Link>
             )}
          </NavigationMenu.Item>
        ))}
      </NavigationMenu.List>

    </NavigationMenu.Root>
  );
}
