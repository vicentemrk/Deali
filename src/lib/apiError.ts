import { NextResponse } from 'next/server';

/**
 * Retorna siempre una respuesta JSON estructurada para errores de API.
 */
export function apiError(code: string, message: string, status: number): NextResponse {
  return NextResponse.json(
    {
      error: true,
      code,
      message,
      status,
    },
    { status }
  );
}
