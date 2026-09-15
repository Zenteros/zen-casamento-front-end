import { useState, useEffect, useCallback } from 'react';
import type { EventStateDTO } from '../contracts/index.js';
import { apiFetch } from '../lib/api.js';

interface UseEventStateReturn {
  eventState: EventStateDTO | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEventState(enabled: boolean = true): UseEventStateReturn {
  const [eventState, setEventState] = useState<EventStateDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchEventState = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const res = await apiFetch(`/api/v1/event/state${search}`, {
        method: 'GET',
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Sem sessão de convidado ativa
          setEventState(null);
          return;
        }
        throw new Error('Falha ao consultar estado do evento');
      }

      const data: { eventState: EventStateDTO } = await res.json();
      setEventState(data.eventState);
    } catch (err: unknown) {
      setError((err as Error).message || 'Erro ao carregar estado temporal');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchEventState();
  }, [fetchEventState]);

  return {
    eventState,
    loading,
    error,
    refetch: fetchEventState,
  };
}
