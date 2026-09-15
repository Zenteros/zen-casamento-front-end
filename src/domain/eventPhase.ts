import type { EventPhase, EventStateDTO } from '../contracts/event.js';

export interface WeddingEventInput {
  weddingDate: Date | string;
  timezone: string;
  ceremonyAt: Date | string;
  receptionAt?: Date | string | null;
  eventEndsAt?: Date | string | null;
}

export interface CountdownResult {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

/**
 * Retorna o instante UTC correspondente às 00:00:00 da data (ano, mês, dia)
 * no fuso horário informado (ex: 'America/Sao_Paulo').
 */
export function getZonedMidnight(year: number, month: number, day: number, timezone: string): Date {
  const utcEstimate = Date.UTC(year, month - 1, day, 0, 0, 0);

  const partsFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const getOffset = (timestamp: number): number => {
    const parts = partsFormatter.formatToParts(new Date(timestamp));
    const p: Record<string, number> = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        p[part.type] = parseInt(part.value, 10);
      }
    }
    const hour = p.hour === 24 ? 0 : p.hour;
    const localUtcEquivalent = Date.UTC(p.year, p.month - 1, p.day, hour, p.minute, p.second);
    return localUtcEquivalent - timestamp;
  };

  const offset1 = getOffset(utcEstimate);
  const targetTimestamp = utcEstimate - offset1;
  const offset2 = getOffset(targetTimestamp);

  return new Date(utcEstimate - offset2);
}

/**
 * Função de domínio pura que resolve a fase atual do casamento (PRE_EVENT, EVENT_DAY, POST_EVENT)
 * e o próximo momento de transição temporal (nextTransitionAt).
 */
export function resolveEventPhase(
  event: WeddingEventInput,
  nowInput: Date | string = new Date()
): EventStateDTO {
  const timezone = event.timezone || 'America/Sao_Paulo';
  const nowDate = typeof nowInput === 'string' ? new Date(nowInput) : nowInput;
  const weddingDate = typeof event.weddingDate === 'string' ? new Date(event.weddingDate) : event.weddingDate;
  const ceremonyDate = typeof event.ceremonyAt === 'string' ? new Date(event.ceremonyAt) : event.ceremonyAt;

  const partsFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = partsFormatter.formatToParts(weddingDate);
  const p: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      p[part.type] = parseInt(part.value, 10);
    }
  }

  const weddingDayStart = getZonedMidnight(p.year, p.month, p.day, timezone);
  const nextDayStart = getZonedMidnight(p.year, p.month, p.day + 1, timezone);

  const eventEnd = event.eventEndsAt
    ? (typeof event.eventEndsAt === 'string' ? new Date(event.eventEndsAt) : event.eventEndsAt)
    : nextDayStart;

  const nowMs = nowDate.getTime();
  const startMs = weddingDayStart.getTime();
  const endMs = eventEnd.getTime();

  let phase: EventPhase;
  let nextTransitionAt: string | null = null;

  if (nowMs < startMs) {
    phase = 'PRE_EVENT';
    nextTransitionAt = weddingDayStart.toISOString();
  } else if (nowMs < endMs) {
    phase = 'EVENT_DAY';
    nextTransitionAt = eventEnd.toISOString();
  } else {
    phase = 'POST_EVENT';
    nextTransitionAt = null;
  }

  return {
    phase,
    now: nowDate.toISOString(),
    timezone,
    weddingDate: weddingDate.toISOString(),
    ceremonyAt: ceremonyDate.toISOString(),
    receptionAt: event.receptionAt ? new Date(event.receptionAt).toISOString() : null,
    eventEndsAt: event.eventEndsAt ? new Date(event.eventEndsAt).toISOString() : null,
    nextTransitionAt,
  };
}

/**
 * Utilitário puro de contagem regressiva entre dois instantes.
 */
export function getCountdown(
  targetInput: Date | string,
  nowInput: Date | string = new Date()
): CountdownResult {
  const target = typeof targetInput === 'string' ? new Date(targetInput) : targetInput;
  const now = typeof nowInput === 'string' ? new Date(nowInput) : nowInput;

  const totalMs = target.getTime() - now.getTime();
  const isPast = totalMs <= 0;

  if (isPast) {
    return {
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: true,
    };
  }

  const totalSeconds = Math.floor(totalMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);

  return {
    totalMs,
    days,
    hours,
    minutes,
    seconds,
    isPast: false,
  };
}
