'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[UI_ERROR_BOUNDARY]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-16 bg-bg-page">
      <div className="max-w-xl w-full bg-white border border-border rounded-2xl p-8 text-center shadow-sm">
        <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">Error inesperado</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">No pudimos cargar esta vista</h2>
        <p className="text-gray-600 mb-6">
          Ocurrio un problema temporal. Puedes reintentar ahora o volver al inicio.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="bg-teal text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
          >
            Reintentar
          </button>
          <Link href="/" className="bg-white px-4 py-2 rounded-lg border border-border text-gray-700 hover:bg-gray-50">
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
