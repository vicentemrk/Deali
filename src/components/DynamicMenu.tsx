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
  children?: Category[];
}

interface DynamicMenuProps {
  categories: Category[];
}

export function DynamicMenu({ categories }: DynamicMenuProps) {
  const pathname = usePathname();

  return (
    <NavigationMenu.Root className="relative z-50 flex w-full justify-center">
      <NavigationMenu.List className="m-0 flex list-none rounded-md bg-white p-1 shadow-sm border border-border">
        {categories.map((cat) => (
          <NavigationMenu.Item key={cat.id}>
             {cat.children && cat.children.length > 0 ? (
                <>
                  <NavigationMenu.Trigger className="text-gray-700 hover:text-teal focus:text-teal group flex select-none items-center justify-between gap-1 rounded px-3 py-2 text-sm font-medium leading-none outline-none focus:shadow-[0_0_0_2px]">
                    {cat.name}
                    <ChevronDown
                      className="text-gray-400 group-data-[state=open]:rotate-180 transition-transform duration-250 ease-in"
                      aria-hidden
                    />
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content className="absolute top-0 left-0 w-auto mt-2">
                    <ul className="m-0 grid list-none gap-2 p-4 grid-cols-2 bg-white rounded-md shadow-lg border border-border min-w-max">
                      {cat.children.map(child => (
                        <li key={child.id}>
                          <NavigationMenu.Link asChild>
                            <Link 
                                href={`/categoria/${child.slug}`}
                                className={clsx(
                                  "block select-none rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-teal-light whitespace-nowrap",
                                  pathname === `/categoria/${child.slug}` ? 'text-teal font-medium' : 'text-gray-700 hover:text-teal'
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
                        href={`/categoria/${cat.slug}`}
                        className={clsx(
                            "text-gray-700 hover:text-teal focus:text-teal block select-none rounded px-3 py-2 text-sm font-medium leading-none no-underline outline-none focus:shadow-[0_0_0_2px]",
                            pathname === `/categoria/${cat.slug}` ? 'text-teal font-medium' : ''
                        )}
                    >
                        {cat.name}
                    </Link>
                </NavigationMenu.Link>
             )}
          </NavigationMenu.Item>
        ))}
      </NavigationMenu.List>

      <div className="perspective-[2000px] absolute top-full left-0 flex w-full justify-center">
        <NavigationMenu.Viewport className="data-[state=open]:animate-scaleIn data-[state=closed]:animate-scaleOut relative mt-[10px] h-[var(--radix-navigation-menu-viewport-height)] w-full origin-[center_top] overflow-hidden rounded-md bg-white transition-[width,_height] duration-300 sm:w-[var(--radix-navigation-menu-viewport-width)]" />
      </div>
    </NavigationMenu.Root>
  );
}
