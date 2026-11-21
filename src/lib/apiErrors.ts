import type { AdminFieldErrorDTO } from '../contracts/index.js';

export interface ApiFormError {
  /** Frase pronta para o alerta do formulário, já citando campo e motivo. */
  message: string;
  /** Motivo por campo (chave = nome do campo na API: "description", "title"...). */
  fields: Record<string, string>;
}

/**
 * Lê o corpo de erro da API e devolve campo + motivo em português.
 * Funciona com o formato novo ({ error, fields }) e com o antigo ({ error, details }).
 */
export async function readApiFormError(res: Response, fallback: string): Promise<ApiFormError> {
  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
    fields?: AdminFieldErrorDTO[];
    details?: Record<string, { _errors?: string[] } | string[]>;
  };

  const fields: Record<string, string> = {};
  const labeled: string[] = [];

  if (Array.isArray(body.fields) && body.fields.length > 0) {
    for (const f of body.fields) {
      if (!fields[f.field]) fields[f.field] = f.message;
      labeled.push(f.field === '_form' ? f.message : `${f.label}: ${f.message}`);
    }
  } else if (body.details && typeof body.details === 'object') {
    for (const [key, value] of Object.entries(body.details)) {
      if (key === '_errors' || Array.isArray(value)) continue;
      const first = value?._errors?.[0];
      if (first) {
        fields[key] = first;
        labeled.push(`${key}: ${first}`);
      }
    }
  }

  if (res.status === 401) {
    return { message: 'Sua sessão expirou. Entre de novo no painel para salvar.', fields };
  }

  // O formato novo já traz campo e motivo em `error`; no antigo, montamos a frase.
  const base = body.error || body.message || fallback;
  const message =
    labeled.length > 0 && !body.fields ? `${base} ${labeled.join('; ')}.` : base;

  return { message, fields };
}
