/**
 * Centralized API Client configuration and fetch wrappers.
 *
 * Em desenvolvimento (Vite dev server), se VITE_API_URL não estiver definido,
 * utiliza fallback para http://localhost:3000.
 * Em produção, se não definido, usa string vazia (same-origin).
 */
const envApiUrl = import.meta.env.VITE_API_URL;

export const API_URL: string =
  typeof envApiUrl === 'string'
    ? envApiUrl.replace(/\/+$/, '')
    : (import.meta.env.DEV ? 'http://localhost:3000' : '');

/**
 * URL pública oficial da aplicação (convite digital).
 * Utilizada para geração de links compartilháveis (WhatsApp, Copiar Link).
 */
const envPublicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL;

export const PUBLIC_APP_URL: string =
  typeof envPublicAppUrl === 'string' && envPublicAppUrl.trim() !== ''
    ? envPublicAppUrl.trim().replace(/\/+$/, '')
    : 'https://patricioeevandria.com.br';

/**
 * Constrói o link público canônico do convite a partir do token.
 */
export function buildInviteUrl(token: string): string {
  return `${PUBLIC_APP_URL}/c/${token}`;
}

/**
 * Constrói uma URL completa para o endpoint da API a partir de um caminho relativo.
 */
export function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
}

/**
 * Wrapper padronizado de fetch com credentials: 'include' por padrão para suportar
 * sessões baseadas em cookies HttpOnly (Guest, Admin, Screen).
 */
export async function apiFetch(input: string | URL, init: RequestInit = {}): Promise<Response> {
  const url = typeof input === 'string' && input.startsWith('/')
    ? buildApiUrl(input)
    : input.toString();

  const options: RequestInit = {
    credentials: 'include',
    ...init,
    headers: {
      ...(init.headers || {}),
    },
  };

  return fetch(url, options);
}

/**
 * Helper para requisições JSON tipadas.
 */
export async function apiFetchJson<T>(input: string | URL, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await apiFetch(input, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Erro na requisição: ${response.status} ${response.statusText}`;
    try {
      const errBody = await response.json();
      if (errBody && typeof errBody === 'object' && 'message' in errBody) {
        errorMessage = String((errBody as { message: unknown }).message);
      }
    } catch {
      // noop
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}
