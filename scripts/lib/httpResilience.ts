type HostCircuitState = {
  consecutiveFailures: number;
  openUntil: number;
};

const hostCircuitState = new Map<string, HostCircuitState>();

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getRetryAttempts(): number {
  return intFromEnv('SCRAPER_RETRY_ATTEMPTS', 3);
}

export function getRetryBaseDelayMs(): number {
  return intFromEnv('SCRAPER_RETRY_BASE_DELAY_MS', 350);
}

export function getRetryMaxDelayMs(): number {
  return intFromEnv('SCRAPER_RETRY_MAX_DELAY_MS', 4_000);
}

export function getCircuitFailureThreshold(): number {
  return intFromEnv('SCRAPER_CIRCUIT_FAILURE_THRESHOLD', 4);
}

export function getCircuitCooldownMs(): number {
  return intFromEnv('SCRAPER_CIRCUIT_COOLDOWN_MS', 60_000);
}

export function getHostFromUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function shouldShortCircuitHost(host: string): { blocked: boolean; retryInMs: number } {
  const state = hostCircuitState.get(host);
  if (!state) {
    return { blocked: false, retryInMs: 0 };
  }

  const now = Date.now();
  if (state.openUntil > now) {
    return { blocked: true, retryInMs: state.openUntil - now };
  }

  return { blocked: false, retryInMs: 0 };
}

export function recordHostSuccess(host: string): void {
  hostCircuitState.delete(host);
}

export function recordHostFailure(host: string): { tripped: boolean; failures: number } {
  const threshold = getCircuitFailureThreshold();
  const cooldownMs = getCircuitCooldownMs();

  const current = hostCircuitState.get(host) ?? {
    consecutiveFailures: 0,
    openUntil: 0,
  };

  const failures = current.consecutiveFailures + 1;
  const tripped = failures >= threshold;

  hostCircuitState.set(host, {
    consecutiveFailures: tripped ? 0 : failures,
    openUntil: tripped ? Date.now() + cooldownMs : 0,
  });

  return { tripped, failures };
}

export function shouldRetryHttpStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export async function sleepWithBackoff(attempt: number): Promise<void> {
  const baseDelay = getRetryBaseDelayMs();
  const maxDelay = getRetryMaxDelayMs();
  const exp = Math.min(maxDelay, baseDelay * 2 ** Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * 120);
  await new Promise((resolve) => setTimeout(resolve, exp + jitter));
}

export function __resetHostCircuitStateForTests(): void {
  hostCircuitState.clear();
}
