import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

export function Pagination({ currentPage, totalPages, buildHref }: PaginationProps) {
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Calculate visible page numbers (show current ± 2)
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginación" className="mt-10 flex items-center justify-center gap-1.5">
      {/* Previous */}
      {hasPrev ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="inline-flex items-center gap-1 rounded-xl border border-border bg-white px-3.5 py-2 text-sm font-medium text-ink-weak shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:text-teal"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-xl border border-border px-3.5 py-2 text-sm font-medium text-ink-weak/40 cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </span>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {start > 1 && (
          <>
            <Link
              href={buildHref(1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium text-ink-weak transition-all hover:bg-teal-light hover:text-teal"
            >
              1
            </Link>
            {start > 2 && (
              <span className="px-1 text-ink-weak/50">···</span>
            )}
          </>
        )}

        {pages.map((page) => (
          <Link
            key={page}
            href={buildHref(page)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-all ${
              page === currentPage
                ? 'bg-purple text-white shadow-md shadow-purple/25'
                : 'text-ink-weak hover:bg-teal-light hover:text-teal'
            }`}
          >
            {page}
          </Link>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && (
              <span className="px-1 text-ink-weak/50">···</span>
            )}
            <Link
              href={buildHref(totalPages)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium text-ink-weak transition-all hover:bg-teal-light hover:text-teal"
            >
              {totalPages}
            </Link>
          </>
        )}
      </div>

      {/* Next */}
      {hasNext ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="inline-flex items-center gap-1 rounded-xl border border-border bg-white px-3.5 py-2 text-sm font-medium text-ink-weak shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:text-teal"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-xl border border-border px-3.5 py-2 text-sm font-medium text-ink-weak/40 cursor-not-allowed">
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
