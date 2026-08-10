const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertConfigured() {
  if (!url || !serviceKey) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
}

export async function supabaseRest<T = unknown>(
  path: string,
  init: RequestInit & { prefer?: string } = {}
): Promise<T> {
  assertConfigured();

  const headers = new Headers(init.headers);
  headers.set('apikey', serviceKey!);
  headers.set('Authorization', `Bearer ${serviceKey}`);
  headers.set('Content-Type', 'application/json');
  if (init.prefer) headers.set('Prefer', init.prefer);

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase ${response.status}: ${text}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function isSupabaseConfigured() {
  return Boolean(url && serviceKey);
}
