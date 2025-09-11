export function getApiBase() {
  // @ts-ignore
  const runtime = typeof window !== 'undefined' && (window as any).__APP_CONFIG__;
  return runtime?.API_BASE_URL || window.location.origin;
}

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const base = getApiBase();
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  return fetch(url, opts);
}

export default apiFetch;
