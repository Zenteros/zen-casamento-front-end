import type { ScheduleItemDTO } from '../contracts/event.js';

export type ScheduleItemStatus = 'PAST' | 'HAPPENING_NOW' | 'NEXT' | 'FUTURE';

export interface ClassifiedScheduleItem {
  item: ScheduleItemDTO;
  status: ScheduleItemStatus;
  formattedStartTime: string;
  formattedEndTime: string | null;
  effectiveEndsAt: Date;
}

export interface ScheduleClassificationResult {
  classifiedItems: ClassifiedScheduleItem[];
  currentItem: ClassifiedScheduleItem | null;
  nextItem: ClassifiedScheduleItem | null;
  pastItems: ClassifiedScheduleItem[];
  futureItems: ClassifiedScheduleItem[];
}

/**
 * Formata um timestamp ISO ou Date para o formato canônico de horário brasileiro (ex: 10h30, 12h00)
 * respeitando a timezone oficial do evento (padrão: America/Sao_Paulo).
 */
export function formatScheduleTime(
  dateInput: string | Date | null | undefined,
  timeZone: string = 'America/Sao_Paulo'
): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';

  return `${hour}h${minute}`;
}

/**
 * Calcula a data efetiva de término para um item da programação.
 */
export function getEffectiveEndsAt(
  item: ScheduleItemDTO,
  nextItemInList?: ScheduleItemDTO | null,
  eventEndsAt?: string | Date | null
): Date {
  if (item.endsAt) {
    const parsed = new Date(item.endsAt);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  if (nextItemInList) {
    const nextStart = new Date(nextItemInList.startsAt);
    if (!isNaN(nextStart.getTime())) return nextStart;
  }

  if (eventEndsAt) {
    const parsedEnd = typeof eventEndsAt === 'string' ? new Date(eventEndsAt) : eventEndsAt;
    if (!isNaN(parsedEnd.getTime())) return parsedEnd;
  }

  // Fallback seguro: 1 hora de vigência
  const start = new Date(item.startsAt);
  return new Date(start.getTime() + 60 * 60 * 1000);
}

/**
 * Classifica uma lista ordenada de itens de cronograma em relação a um ponto no tempo (now).
 */
export function classifySchedule(
  items: ScheduleItemDTO[],
  nowInput: string | Date = new Date(),
  eventEndsAt?: string | Date | null,
  timeZone: string = 'America/Sao_Paulo'
): ScheduleClassificationResult {
  const now = typeof nowInput === 'string' ? new Date(nowInput) : nowInput;
  const nowMs = now.getTime();

  // Filtrar apenas ativos e ordenar
  const sorted = [...items]
    .filter((item) => item.active !== false)
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    });

  let currentItem: ClassifiedScheduleItem | null = null;
  let nextItem: ClassifiedScheduleItem | null = null;
  const pastItems: ClassifiedScheduleItem[] = [];
  const futureItems: ClassifiedScheduleItem[] = [];
  const classifiedItems: ClassifiedScheduleItem[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    const nextInList = sorted[i + 1] || null;
    const effectiveEndsAt = getEffectiveEndsAt(item, nextInList, eventEndsAt);

    const startMs = new Date(item.startsAt).getTime();
    const endMs = effectiveEndsAt.getTime();

    let status: ScheduleItemStatus;

    if (nowMs >= endMs) {
      status = 'PAST';
    } else if (nowMs >= startMs && nowMs < endMs) {
      status = 'HAPPENING_NOW';
    } else {
      // nowMs < startMs
      if (!nextItem) {
        status = 'NEXT';
      } else {
        status = 'FUTURE';
      }
    }

    const classified: ClassifiedScheduleItem = {
      item,
      status,
      formattedStartTime: formatScheduleTime(item.startsAt, timeZone),
      formattedEndTime: item.endsAt ? formatScheduleTime(item.endsAt, timeZone) : null,
      effectiveEndsAt,
    };

    if (status === 'HAPPENING_NOW') {
      if (!currentItem) {
        currentItem = classified;
      }
    } else if (status === 'NEXT') {
      nextItem = classified;
    } else if (status === 'PAST') {
      pastItems.push(classified);
    } else if (status === 'FUTURE') {
      futureItems.push(classified);
    }

    classifiedItems.push(classified);
  }

  return {
    classifiedItems,
    currentItem,
    nextItem,
    pastItems,
    futureItems,
  };
}
