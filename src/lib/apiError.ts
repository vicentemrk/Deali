import { NextResponse } from 'next/server';

/**
 * Retorna siempre una respuesta JSON estructurada para errores de API.
 */
export function apiError(
  code: string,
  message: string,
  status: number,
  options?: { requestId?: string }
): NextResponse {
  const requestId = options?.requestId;
  return NextResponse.json(
    {
      error: true,
      code,
      message,
      status,
      ...(requestId ? { requestId } : {}),
    },
    {
      status,
      headers: requestId ? { 'X-Request-Id': requestId } : undefined,
    }
  );
}
