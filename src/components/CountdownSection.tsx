import React, { useEffect, useState } from 'react';
import type { EventStateDTO } from '../contracts/index.js';
import { getCountdown, type CountdownResult } from '../domain/index.js';

export interface CountdownSectionProps {
  /** Estado do evento vindo do backend/hook */
  eventState?: EventStateDTO | null;
  /** Alvo opcional da contagem (caso não queira usar ceremonyAt do eventState) */
  targetDate?: string | Date;
  /** Indicador de carregamento do estado temporal */
  loading?: boolean;
  /** Erro ao carregar o estado temporal */
  error?: string | null;
}

function padTwo(num: number): string {
  return String(num).padStart(2, '0');
}

function formatCeremonySubtitle(dateInput: string | Date, timezone: string = 'America/Sao_Paulo'): string {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';

    const day = new Intl.DateTimeFormat('pt-BR', { timeZone: timezone, day: 'numeric' }).format(date);
    const month = new Intl.DateTimeFormat('pt-BR', { timeZone: timezone, month: 'long' }).format(date);
    const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1);
    const year = new Intl.DateTimeFormat('pt-BR', { timeZone: timezone, year: 'numeric' }).format(date);

    const parts = new Intl.DateTimeFormat('pt-BR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const hour = parts.find((p) => p.type === 'hour')?.value || '';
    const minute = parts.find((p) => p.type === 'minute')?.value || '';
    const timeStr = minute && minute !== '00' ? `${hour}h${minute}` : `${hour}h`;

    return `${day} de ${monthCapitalized} de ${year} \u2022 ${timeStr}`;
  } catch {
    return '';
  }
}

export const CountdownSection: React.FC<CountdownSectionProps> = ({
  eventState,
  targetDate,
  loading = false,
  error: _error = null,
}) => {
  const target = targetDate || eventState?.ceremonyAt || null;

  const [countdown, setCountdown] = useState<CountdownResult | null>(() =>
    target ? getCountdown(target, new Date()) : null
  );

  useEffect(() => {
    if (!target) {
      setCountdown(null);
      return;
    }

    // Atualização imediata ao montar ou mudar o target
    setCountdown(getCountdown(target, new Date()));

    const intervalId = window.setInterval(() => {
      setCountdown(getCountdown(target, new Date()));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [target]);

  // Enquanto estiver carregando e ainda não houver target definido:
  // Renderiza skeleton/placeholder discreto e editorial sem layout shift
  if (loading && !target) {
    return (
      <section
        className="editorial-section countdown-section animate-fade-in"
        id="countdown"
        aria-label="Contagem regressiva para a cerimônia"
      >
        <div className="countdown-inner">
          <span className="editorial-eyebrow">Contagem Regressiva</span>
          <h2 className="editorial-title countdown-title">
            Está chegando o nosso dia
          </h2>
          <p className="editorial-subtitle countdown-subtitle">
            Preparando os corações para este momento
          </p>

          <div
            className="countdown-grid countdown-grid--loading"
            role="status"
            aria-label="Carregando contagem regressiva"
          >
            <div className="countdown-item countdown-item--loading">
              <span className="countdown-value countdown-value--placeholder">—</span>
              <span className="countdown-label">Dias</span>
            </div>
            <div className="countdown-divider" aria-hidden="true">:</div>
            <div className="countdown-item countdown-item--loading">
              <span className="countdown-value countdown-value--placeholder">—</span>
              <span className="countdown-label">Horas</span>
            </div>
            <div className="countdown-divider" aria-hidden="true">:</div>
            <div className="countdown-item countdown-item--loading">
              <span className="countdown-value countdown-value--placeholder">—</span>
              <span className="countdown-label">Minutos</span>
            </div>
            <div className="countdown-divider" aria-hidden="true">:</div>
            <div className="countdown-item countdown-item--loading">
              <span className="countdown-value countdown-value--placeholder">—</span>
              <span className="countdown-label">Segundos</span>
            </div>
          </div>

          <p className="countdown-quote">
            Contando cada segundo para vivermos este momento juntos.
          </p>
        </div>
      </section>
    );
  }

  // Se o endpoint falhou ou o target não está disponível:
  // Exibe mensagem afetiva neutra sem inventar datas nem bloquear o restante do convite
  if (!target || !countdown) {
    return (
      <section
        className="editorial-section countdown-section animate-fade-in"
        id="countdown"
        aria-label="Contagem regressiva"
      >
        <div className="countdown-inner">
          <span className="editorial-eyebrow">Contagem Regressiva</span>
          <h2 className="editorial-title countdown-title">
            Está chegando o nosso dia
          </h2>
          <p className="countdown-quote" style={{ marginTop: '1.5rem' }}>
            Mal podemos esperar para viver este momento ao lado de vocês.
          </p>
        </div>
      </section>
    );
  }

  const formattedSubtitle = target
    ? formatCeremonySubtitle(target, eventState?.timezone || 'America/Sao_Paulo')
    : '';

  return (
    <section
      className="editorial-section countdown-section animate-fade-in"
      id="countdown"
      aria-label="Contagem regressiva para a cerimônia"
    >
      <div className="countdown-inner">
        {/* Eyebrow */}
        <span className="editorial-eyebrow">Contagem Regressiva</span>

        {countdown.isPast ? (
          /* Estado quando a cerimônia é alcançada */
          <div className="countdown-reached">
            <h2 className="editorial-title countdown-reached__title">
              Chegou o nosso grande dia!
            </h2>
            <p className="countdown-reached__heart" aria-hidden="true">
              ❤️
            </p>
            <p className="editorial-subtitle countdown-reached__subtitle">
              Hoje celebramos o nosso amor diante de Deus e de todos vocês.
            </p>
          </div>
        ) : (
          /* Contagem ativa */
          <>
            <h2 className="editorial-title countdown-title">
              Está chegando o nosso dia
            </h2>

            {formattedSubtitle ? (
              <p className="editorial-subtitle countdown-subtitle">
                {formattedSubtitle}
              </p>
            ) : null}

            {/* Grid dos 4 blocos temporais */}
            <div className="countdown-grid" role="timer" aria-live="off">
              {/* Dias */}
              <div className="countdown-item">
                <span className="countdown-value">{countdown.days}</span>
                <span className="countdown-label">
                  {countdown.days === 1 ? 'Dia' : 'Dias'}
                </span>
              </div>

              <div className="countdown-divider" aria-hidden="true">:</div>

              {/* Horas */}
              <div className="countdown-item">
                <span className="countdown-value">{padTwo(countdown.hours)}</span>
                <span className="countdown-label">
                  {countdown.hours === 1 ? 'Hora' : 'Horas'}
                </span>
              </div>

              <div className="countdown-divider" aria-hidden="true">:</div>

              {/* Minutos */}
              <div className="countdown-item">
                <span className="countdown-value">{padTwo(countdown.minutes)}</span>
                <span className="countdown-label">
                  {countdown.minutes === 1 ? 'Minuto' : 'Minutos'}
                </span>
              </div>

              <div className="countdown-divider" aria-hidden="true">:</div>

              {/* Segundos */}
              <div className="countdown-item">
                <span className="countdown-value">{padTwo(countdown.seconds)}</span>
                <span className="countdown-label">
                  {countdown.seconds === 1 ? 'Segundo' : 'Segundos'}
                </span>
              </div>
            </div>

            {/* Frase poética / afetiva */}
            <p className="countdown-quote">
              Contando cada segundo para vivermos este momento juntos.
            </p>
          </>
        )}
      </div>
    </section>
  );
};
