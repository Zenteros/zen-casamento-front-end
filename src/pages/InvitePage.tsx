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
import { Monogram } from '../components/Monogram.js';
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

/* ──────────────────────────────────────────────────────────
   InvitePage
   ────────────────────────────────────────────────────────── */
export const InvitePage: React.FC = () => {
  const { token } = useParams<{ token?: string }>();

  const [invite, setInvite] = useState<InviteDTO | null>(null);
  const { eventState, loading: eventStateLoading, error: eventStateError } = useEventState(Boolean(invite));
  const [rsvps, setRsvps] = useState<Record<string, { status: 'CONFIRMED' | 'DECLINED'; dietaryRestrictions: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    setSuccessMessage(null);

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
      setSuccessMessage('Confirmação recebida. Mal podemos esperar para celebrar com vocês.');
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
    return <EventDayPage invite={invite} eventState={eventState} />;
  }

  /* ── Main render (PRE_EVENT) ── */
  return (
    <>
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
            7. RSVP — editorial skin
            lógica intacta, visual refinado
            ═══════════════════════════════════ */}
        <section
          className="editorial-section rsvp-section animate-fade-in"
          id="rsvp"
          aria-labelledby="rsvp-heading"
        >
          <div className="rsvp-inner">
            <span className="editorial-eyebrow">Confirmação de Presença</span>

            <h2
              id="rsvp-heading"
              className="editorial-title"
              style={{ marginBottom: '0.75rem' }}
            >
              Você virá?
            </h2>

            <p
              className="editorial-subtitle"
              style={{ marginBottom: '2.5rem' }}
            >
              Confirme a presença de cada integrante do seu grupo.
            </p>

            {/* Success message */}
            {successMessage && (
              <div className="rsvp-success" role="status" aria-live="polite">
                {successMessage}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="rsvp-error" role="alert" aria-live="polite">
                {error}
              </div>
            )}

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
        </section>

      </div>

      {/* 3. Footer editorial */}
      <PageFooter />
    </>
  );
};
