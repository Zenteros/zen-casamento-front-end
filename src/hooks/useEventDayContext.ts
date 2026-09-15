import { useState, useEffect, useCallback } from 'react';
import type { EventDayContextDTO } from '../contracts/index.js';
import { apiFetch } from '../lib/api.js';

interface UseEventDayContextReturn {
  eventDayContext: EventDayContextDTO | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEventDayContext(enabled: boolean = true): UseEventDayContextReturn {
  const [eventDayContext, setEventDayContext] = useState<EventDayContextDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const res = await apiFetch(`/api/v1/event/day-context${search}`, {
        method: 'GET',
      });

      if (!res.ok) {
        if (res.status === 401) {
          setEventDayContext(null);
          return;
        }
        throw new Error('Falha ao consultar informações do dia do casamento');
      }

      const data: { eventDayContext: EventDayContextDTO } = await res.json();
      setEventDayContext(data.eventDayContext);
    } catch (err: unknown) {
      setError((err as Error).message || 'Erro ao carregar dados do dia');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  return {
    eventDayContext,
    loading,
    error,
    refetch: fetchContext,
  };
}
