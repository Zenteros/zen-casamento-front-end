import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { InviteDTO, GuestRsvpItem } from '../contracts/index.js';
import { useEventState } from '../hooks/useEventState.js';
import { HeroSection } from '../components/HeroSection.js';
import { CountdownSection } from '../components/CountdownSection.js';
import { EventSection } from '../components/EventSection.js';
import { AttireSection } from '../components/AttireSection.js';
import { AccommodationSection } from '../components/AccommodationSection.js';
import { EditorialPhotoBreak } from '../components/EditorialPhotoBreak.js';
import { GiftPixSection } from '../components/GiftPixSection.js';
import { Monogram } from '../components/Monogram.js';
import { MusicPlayer, type MusicPlayerHandle } from '../components/MusicPlayer.js';
import { InviteEntryScreen } from '../components/InviteEntryScreen.js';
import { EventDayPage } from './EventDayPage.js';
import { apiFetch } from '../lib/api.js';

/* ──────────────────────────────────────────────────────────
   Section separator motif
   ────────────────────────────────────────────────────────── */
const SectionSeparator: React.FC = () => (
  <div className="section-separator" aria-hidden="true">
    <div className="section-separator__line" />
    <svg
      width="36" height="36" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
      className="section-separator__motif"
    >
      <path d="M12 2C12 2 13.5 6.5 17 8C20.5 9.5 22 12 22 12C22 12 17.5 13.5 16 17C14.5 20.5 12 22 12 22C12 22 10.5 17.5 7 16C3.5 14.5 2 12 2 12C2 12 6.5 10.5 8 7C9.5 3.5 12 2 12 2Z" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
    <div className="section-separator__line" />
  </div>
);

/* ──────────────────────────────────────────────────────────
   Page Footer editorial
   ────────────────────────────────────────────────────────── */
const PageFooter: React.FC = () => (
  <footer className="page-footer" aria-label="Assinatura do casal">
    <div className="page-footer__monogram-letters">P &amp; E</div>
    <div className="page-footer__rule" />
    <div className="page-footer__date">21 &bull; 11 &bull; 2026</div>
    <div className="page-footer__location">Nova Veneza &bull; SC</div>
  </footer>
);

const CheckIcon: React.FC = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ──────────────────────────────────────────────────────────
   InvitePage
   ────────────────────────────────────────────────────────── */
const STORAGE_KEY_OPENED = 'zen_casamento_opened';

export const InvitePage: React.FC = () => {
  const { token } = useParams<{ token?: string }>();

  const [invite, setInvite] = useState<InviteDTO | null>(null);
  const { eventState, loading: eventStateLoading, error: eventStateError } = useEventState(Boolean(invite));
  const [rsvps, setRsvps] = useState<Record<string, { status: 'CONFIRMED' | 'DECLINED'; dietaryRestrictions: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isOpened, setIsOpened] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(STORAGE_KEY_OPENED) === 'true';
    }
    return false;
  });

  const musicPlayerRef = React.useRef<MusicPlayerHandle | null>(null);

  const handleOpenInvite = () => {
    setIsOpened(true);
    try {
      sessionStorage.setItem(STORAGE_KEY_OPENED, 'true');
    } catch {
      // ignore
    }

    try {
      musicPlayerRef.current?.play();
    } catch (err) {
      console.warn('[InvitePage] Erro ao iniciar música:', err);
    }
  };

  // Registro técnico discreto da fase temporal em ambiente de desenvolvimento
  useEffect(() => {
    if (import.meta.env.DEV && eventState) {
      console.debug(`[Zen Casamento] Fase temporal ativa: ${eventState.phase} (Timezone: ${eventState.timezone})`);
    }
  }, [eventState]);

  // Inicializa o estado dos formulários a partir do DTO do convite
  const populateRsvpState = (inviteData: InviteDTO) => {
    const initialState: Record<string, { status: 'CONFIRMED' | 'DECLINED'; dietaryRestrictions: string }> = {};
    for (const g of inviteData.guests) {
      initialState[g.id] = {
        status: g.rsvp?.status === 'DECLINED' ? 'DECLINED' : 'CONFIRMED',
        dietaryRestrictions: g.rsvp?.dietaryRestrictions || '',
      };
    }
    setRsvps(initialState);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadInvite() {
      setLoading(true);
      setError(null);

      try {
        if (token) {
          // Validar token via POST /api/v1/invites/c/:token
          const res = await apiFetch(`/api/v1/invites/c/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Convite inválido ou expirado.');
          }

          const data: { invite: InviteDTO } = await res.json();
          if (isMounted) {
            setInvite(data.invite);
            populateRsvpState(data.invite);
            // Remover o token da URL sem recarregar a página
            window.history.replaceState(null, '', '/');
          }
        } else {
          // Consultar sessão ativa via GET /api/v1/invites/me
          const res = await apiFetch('/api/v1/invites/me', {
            method: 'GET',
          });

          if (!res.ok) {
            if (res.status === 401) {
              if (isMounted) {
                setInvite(null);
                setLoading(false);
              }
              return;
            }
            throw new Error('Falha ao carregar informações do convite.');
          }

          const data: { invite: InviteDTO } = await res.json();
          if (isMounted) {
            setInvite(data.invite);
            populateRsvpState(data.invite);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError((err as Error).message || 'Erro ao carregar o convite.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInvite();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleStatusChange = (guestId: string, status: 'CONFIRMED' | 'DECLINED') => {
    setRsvps((prev) => ({
      ...prev,
      [guestId]: {
        ...prev[guestId],
        status,
      },
    }));
  };

  const handleDietaryChange = (guestId: string, dietaryRestrictions: string) => {
    setRsvps((prev) => ({
      ...prev,
      [guestId]: {
        ...prev[guestId],
        dietaryRestrictions,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;

    setSaving(true);
    setError(null);

    const payloadItems: GuestRsvpItem[] = invite.guests.map((g) => ({
      guestId: g.id,
      status: rsvps[g.id]?.status || 'CONFIRMED',
      dietaryRestrictions: rsvps[g.id]?.dietaryRestrictions?.trim() || null,
    }));

    try {
      const res = await apiFetch('/api/v1/invites/me/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rsvps: payloadItems }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao salvar RSVP.');
      }

      const data: { invite: InviteDTO } = await res.json();
      setInvite(data.invite);
      populateRsvpState(data.invite);
    } catch (err: unknown) {
      setError((err as Error).message || 'Ocorreu um erro ao salvar o RSVP.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--paper-warm)', padding: '2rem' }}>
        <Monogram variant="hero" />
        <p className="font-serif" style={{ marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
          Carregando convite especial...
        </p>
      </div>
    );
  }

  /* ── Error state ── */
  if (error && !invite) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--paper-warm)', padding: '2rem', textAlign: 'center' }}>
        <Monogram variant="hero" />
        <h2 className="font-serif" style={{ fontSize: '1.6rem', color: '#c53030', margin: '1.5rem 0 0.5rem 0' }}>
          Acesso Inválido
        </h2>
        <p className="font-sans" style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', maxWidth: '400px' }}>
          {error}
        </p>
        <p className="font-sans" style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginTop: '1rem', maxWidth: '400px' }}>
          Por favor, utilize o link de convite exclusivo enviado pelos noivos via WhatsApp.
        </p>
      </div>
    );
  }

  /* ── No session ── */
  if (!invite) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--paper-warm)', padding: '2rem', textAlign: 'center' }}>
        <Monogram variant="hero" />
        <h1 className="font-serif" style={{ fontSize: '1.8rem', margin: '1.5rem 0 0.5rem 0', color: 'var(--color-text-main)' }}>
          Patrício &amp; Evandria
        </h1>
        <p className="font-sans" style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', maxWidth: '400px' }}>
          Nenhum convite ativo foi localizado neste dispositivo.<br />
          Por favor, acesse através do seu link exclusivo de convite.
        </p>
      </div>
    );
  }

  /* ── EVENT_DAY Phase render ── */
  if (eventState?.phase === 'EVENT_DAY') {
    return (
      <>
        <InviteEntryScreen
          familyTitle={invite.familyTitle}
          isOpened={isOpened}
          onOpenInvite={handleOpenInvite}
        />
        <EventDayPage invite={invite} eventState={eventState} />
        <MusicPlayer ref={musicPlayerRef} isVisible={isOpened} />
      </>
    );
  }

  // Determina se o RSVP do convite foi efetivamente concluído (todos os convidados com status final CONFIRMED ou DECLINED)
  const isRsvpCompleted = Boolean(
    invite &&
    invite.guests &&
    invite.guests.length > 0 &&
    invite.guests.every((g) => g.rsvp && (g.rsvp.status === 'CONFIRMED' || g.rsvp.status === 'DECLINED'))
  );

  const hasAnyConfirmed = Boolean(
    invite &&
    invite.guests &&
    invite.guests.some((g) => {
      const status = g.rsvp?.status || rsvps[g.id]?.status;
      return status === 'CONFIRMED';
    })
  );

  /* ── Main render (PRE_EVENT) ── */
  return (
    <>
      {/* 0. Tela de Entrada Elegante do Convite */}
      <InviteEntryScreen
        familyTitle={invite.familyTitle}
        isOpened={isOpened}
        onOpenInvite={handleOpenInvite}
      />

      {/* 1. Hero — Full Viewport Editorial */}
      <HeroSection familyTitle={invite.familyTitle} />

      {/* Transition gradient from hero paper to content */}
      <div className="content-transition" />

      {/* 2. Page content — editorial layout */}
      <div className="page-editorial">

        {/* 2. Contagem Regressiva Oficial — Alvo: ceremonyAt (vindo de EventStateDTO) */}
        <CountdownSection
          eventState={eventState}
          loading={eventStateLoading}
          error={eventStateError}
        />

        {/* Separator before Ceremony */}
        <SectionSeparator />

        {/* 3. Cerimônia + Recepção */}
        <EventSection />

        {/* 4. Pausa editorial fotográfica — entre Recepção e Traje (Foto 7.jpg) */}
        <EditorialPhotoBreak />

        {/* 5. Traje */}
        <AttireSection />

        {/* Separator before Accommodation */}
        <SectionSeparator />

        {/* 6. Hospedagem */}
        <AccommodationSection />

        {/* Separator before RSVP */}
        <SectionSeparator />

        {/* ═══════════════════════════════════
            7. RSVP — Confirmação de Presença
            ═══════════════════════════════════ */}
        <section
          className="editorial-section rsvp-section animate-fade-in"
          id="rsvp"
          aria-labelledby="rsvp-heading"
        >
          <div className="rsvp-inner">
            <span className="editorial-eyebrow">Confirmação de Presença</span>

            {isRsvpCompleted ? (
              /* ── Estado Somente Leitura (Confirmado / Salvo) ── */
              <div className="rsvp-confirmed-box animate-fade-in">
                <h2
                  id="rsvp-heading"
                  className="editorial-title"
                  style={{ marginBottom: '0.75rem' }}
                >
                  {hasAnyConfirmed ? '✓ Presença confirmada' : 'Confirmação registrada'}
                </h2>

                <p
                  className="editorial-subtitle"
                  style={{ marginBottom: '1.5rem' }}
                >
                  {hasAnyConfirmed
                    ? 'Obrigado por confirmar. Esperamos você para celebrar conosco!'
                    : 'Agradecemos por nos avisar. Sentiremos sua falta!'}
                </p>

                {error && (
                  <div className="rsvp-error" role="alert" aria-live="polite">
                    {error}
                  </div>
                )}

                {/* Discreet deadline notice */}
                <div className="rsvp-deadline-notice">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="rsvp-deadline-notice__icon"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <p className="rsvp-deadline-notice__text">
                    Prazo para confirmação:{' '}
                    <strong className="rsvp-deadline-notice__date">10 de outubro de 2026</strong>
                  </p>
                </div>

                <div className="rsvp-confirmed-list">
                  {invite.guests.map((guest) => {
                    const guestStatus = guest.rsvp?.status || rsvps[guest.id]?.status || 'CONFIRMED';
                    const isConfirmed = guestStatus === 'CONFIRMED';
                    const dietary = guest.rsvp?.dietaryRestrictions || rsvps[guest.id]?.dietaryRestrictions;

                    return (
                      <div key={guest.id} className="rsvp-confirmed-guest">
                        <div className="rsvp-confirmed-guest__header">
                          <span className="rsvp-confirmed-guest__name">{guest.name}</span>
                          {guest.isChild && (
                            <span className="rsvp-guest__child-badge">Criança</span>
                          )}
                        </div>

                        <div className="rsvp-confirmed-guest__status-row">
                          {isConfirmed ? (
                            <div className="rsvp-confirmed-pill rsvp-confirmed-pill--yes">
                              <CheckIcon />
                              <span>Presença confirmada</span>
                            </div>
                          ) : (
                            <div className="rsvp-confirmed-pill rsvp-confirmed-pill--no">
                              <span>Não poderá comparecer</span>
                            </div>
                          )}
                        </div>

                        {isConfirmed && dietary && dietary.trim() ? (
                          <div className="rsvp-confirmed-dietary">
                            <span className="rsvp-confirmed-dietary__label">Restrição alimentar informada:</span>
                            <span className="rsvp-confirmed-dietary__text">{dietary.trim()}</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div className="rsvp-confirmed-footer">
                  <p className="rsvp-confirmed-footer__text">
                    Precisa alterar sua confirmação? Entre em contato conosco.
                  </p>
                </div>
              </div>
            ) : (
              /* ── Formulário Editável (Pendente) ── */
              <div className="rsvp-editable-box">
                <h2
                  id="rsvp-heading"
                  className="editorial-title"
                  style={{ marginBottom: '0.75rem' }}
                >
                  Confirme sua presença
                </h2>

                <p
                  className="editorial-subtitle"
                  style={{ marginBottom: '1.5rem' }}
                >
                  Será uma alegria celebrar este momento com você.
                </p>

                {/* Error message */}
                {error && (
                  <div className="rsvp-error" role="alert" aria-live="polite">
                    {error}
                  </div>
                )}

                {/* Discreet deadline notice */}
                <div className="rsvp-deadline-notice">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="rsvp-deadline-notice__icon"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <p className="rsvp-deadline-notice__text">
                    Por gentileza, confirme sua presença até{' '}
                    <strong className="rsvp-deadline-notice__date">10 de outubro de 2026</strong>.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="rsvp-form" noValidate>
                  {invite.guests.map((guest) => {
                    const guestRsvp = rsvps[guest.id] || { status: 'CONFIRMED', dietaryRestrictions: '' };
                    return (
                      <div key={guest.id} className="rsvp-guest">
                        <div className="rsvp-guest__header">
                          <span className="rsvp-guest__name">{guest.name}</span>
                          {guest.isChild && (
                            <span className="rsvp-guest__child-badge">Criança</span>
                          )}
                        </div>

                        {/* Attendance choice */}
                        <div className="rsvp-choices">
                          <label className="rsvp-choice">
                            <input
                              type="radio"
                              name={`status-${guest.id}`}
                              value="CONFIRMED"
                              checked={guestRsvp.status === 'CONFIRMED'}
                              onChange={() => handleStatusChange(guest.id, 'CONFIRMED')}
                            />
                            <span>Sim, estarei lá</span>
                          </label>

                          <label className="rsvp-choice">
                            <input
                              type="radio"
                              name={`status-${guest.id}`}
                              value="DECLINED"
                              checked={guestRsvp.status === 'DECLINED'}
                              onChange={() => handleStatusChange(guest.id, 'DECLINED')}
                            />
                            <span>Não poderei ir</span>
                          </label>
                        </div>

                        {/* Dietary restrictions */}
                        {guestRsvp.status === 'CONFIRMED' && (
                          <div className="rsvp-dietary-wrap animate-fade-in">
                            <label
                              htmlFor={`dietary-${guest.id}`}
                              className="rsvp-dietary-label"
                            >
                              Restrições alimentares (opcional)
                            </label>
                            <input
                              id={`dietary-${guest.id}`}
                              type="text"
                              placeholder="Ex: vegetariano, alergia a glúten..."
                              value={guestRsvp.dietaryRestrictions}
                              onChange={(e) => handleDietaryChange(guest.id, e.target.value)}
                              className="rsvp-dietary-input"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="rsvp-submit-wrap">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rsvp-submit-btn"
                    >
                      {saving ? 'Salvando...' : 'Confirmar Presença'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* Separator before Pix Gift */}
        <SectionSeparator />

        {/* 8. Presente via Pix — Opcional, Elegante e Discreto */}
        <GiftPixSection />

      </div>

      {/* 3. Footer editorial */}
      <PageFooter />

      {/* 4. Player de Música Flutuante (Canto Inferior Direito) */}
      <MusicPlayer ref={musicPlayerRef} isVisible={isOpened} />
    </>
  );
};
