import { NextRequest } from 'next/server';

type LogLevel = 'info' | 'warn' | 'error';

type LogData = Record<string, unknown>;

function write(level: LogLevel, payload: LogData): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    ...payload,
  });

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function getRequestId(request?: NextRequest): string {
  const existing = request?.headers.get('x-request-id');
  if (existing && existing.trim()) {
    return existing.trim();
  }
  return crypto.randomUUID();
}

export function getRequestMeta(request: NextRequest) {
  const requestId = getRequestId(request);
  return {
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
  };
}

export function logApiStart(event: string, meta: LogData): void {
  write('info', { event, phase: 'start', ...meta });
}

export function logApiSuccess(event: string, meta: LogData): void {
  write('info', { event, phase: 'success', ...meta });
}

export function logApiWarn(event: string, meta: LogData): void {
  write('warn', { event, ...meta });
}

export function logApiError(event: string, error: unknown, meta: LogData): void {
  const message = error instanceof Error ? error.message : String(error);
  write('error', {
    event,
    error: message,
    ...meta,
  });
}