import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { InviteDTO, EventStateDTO, MediaMineItemDTO } from '../contracts/index.js';
import { classifySchedule, formatScheduleTime } from '../domain/index.js';
import { useEventDayContext } from '../hooks/useEventDayContext.js';
import { Monogram } from '../components/Monogram.js';
import { buildApiUrl, apiFetch } from '../lib/api.js';

interface EventDayPageProps {
  invite: InviteDTO;
  eventState: EventStateDTO;
}

/* ──────────────────────────────────────────────
   Icons
   ────────────────────────────────────────────── */
const PinIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const NavIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

const BellIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CameraIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const UtensilsIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 2v20M6 2v20M2 7h8M2 12h8" />
  </svg>
);

const TableIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="4" width="16" height="12" rx="2" />
    <line x1="4" y1="20" x2="7" y2="16" />
    <line x1="20" y1="20" x2="17" y2="16" />
  </svg>
);

const CalendarListIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="14" x2="8" y2="14" />
    <line x1="12" y1="14" x2="12" y2="14" />
    <line x1="16" y1="14" x2="16" y2="14" />
  </svg>
);

const ChevronDownIcon: React.FC<{ expanded?: boolean }> = ({ expanded = false }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{
      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.25s ease',
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const EventDayPage: React.FC<EventDayPageProps> = ({ invite, eventState }) => {
  const { eventDayContext: ctx, loading, error, refetch } = useEventDayContext(true);

  const [submittingGuestId, setSubmittingGuestId] = useState<string | null>(null);
  const [checkInError, setCheckInError] = useState<{ guestId: string; message: string } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ guestId: string; text: string } | null>(null);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState<boolean>(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('section-now');

  // ─── Estados e Handlers para Mídia Colaborativa ───
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);
  const [mediaUploadSuccess, setMediaUploadSuccess] = useState<string | null>(null);
  const [mineMediaList, setMineMediaList] = useState<MediaMineItemDTO[]>([]);

  // ─── Scroll suave com offset para a barra superior/conteúdo ───
  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const yOffset = -70;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // ─── Detecção da seção ativa durante o scroll ───
  useEffect(() => {
    const sectionIds = ['section-now', 'section-table', 'section-checkin', 'section-schedule', 'section-menu', 'section-media', 'section-routes'];
    const handleScroll = () => {
      const scrollPos = window.scrollY + 160;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchMineMedia = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/event/media/mine', {
        method: 'GET',
      });
      if (res.ok) {
        const data = await res.json();
        setMineMediaList(data.mediaItems || []);
      }
    } catch {
      // Falha silenciosa para não quebrar a home do dia
    }
  }, []);

  useEffect(() => {
    fetchMineMedia();
  }, [fetchMineMedia]);

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaUploadError(null);
    setMediaUploadSuccess(null);

    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(file.name);
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov)$/i.test(file.name);

    if (!isImage && !isVideo) {
      setMediaUploadError('Formato não suportado. Por favor, envie fotos (JPEG, PNG, WebP) ou vídeos (MP4, MOV).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (isImage && file.size > 15 * 1024 * 1024) {
      setMediaUploadError('A foto excede o limite de 15 MB. Por favor, escolha um arquivo menor.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (isVideo && file.size > 100 * 1024 * 1024) {
      setMediaUploadError('O vídeo excede o limite de 100 MB. Por favor, escolha um vídeo mais curto.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);

    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleCancelSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadMedia = async () => {
    if (!selectedFile || isUploadingMedia) return;

    setIsUploadingMedia(true);
    setMediaUploadError(null);
    setMediaUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const search = typeof window !== 'undefined' ? window.location.search : '';
      const res = await apiFetch(`/api/v1/event/media${search}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível enviar a mídia no momento. Tente novamente.');
      }

      setMediaUploadSuccess('Recebemos seu registro ❤️');
      handleCancelSelection();
      await fetchMineMedia();

      setTimeout(() => {
        setMediaUploadSuccess(null);
      }, 7000);
    } catch (err: unknown) {
      setMediaUploadError((err as Error).message || 'Erro ao enviar foto ou vídeo. Tente novamente.');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleCheckIn = async (guestId: string) => {
    if (submittingGuestId) return;
    setSubmittingGuestId(guestId);
    setCheckInError(null);

    try {
      const res = await apiFetch('/api/v1/event/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guestId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Não foi possível confirmar a presença no momento.');
      }

      setFeedbackMessage({ guestId, text: 'Chegada registrada ❤️' });
      setTimeout(() => {
        setFeedbackMessage((prev) => (prev?.guestId === guestId ? null : prev));
      }, 5000);

      await refetch();
    } catch (err: unknown) {
      setCheckInError({
        guestId,
        message: (err as Error).message || 'Não foi possível confirmar a presença. Tente novamente.',
      });
    } finally {
      setSubmittingGuestId(null);
    }
  };

  const formatCheckInTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    return formatScheduleTime(dateStr, ctx?.weddingEvent?.timezone || 'America/Sao_Paulo');
  };

  const ceremonyGmaps = 'https://www.google.com/maps/search/?api=1&query=Santuario+Diocesano+Nossa+Senhora+de+Caravaggio+Nova+Veneza+SC';
  const ceremonyWaze = 'https://waze.com/ul?q=Santuario%20Diocesano%20Nossa%20Senhora%20de%20Caravaggio%20Nova%20Veneza&navigate=yes';
  const receptionGmaps = 'https://www.google.com/maps/search/?api=1&query=Casa+de+Eventos+La Brace+Nova+Veneza+SC';
  const receptionWaze = 'https://waze.com/ul?q=Casa%20de%20Eventos%20La%20Brace%20Nova%20Veneza&navigate=yes';

  // ─── Resolução e Classificação da Programação ───
  const scheduleClassification = classifySchedule(
    ctx?.scheduleItems || [],
    eventState?.now || new Date(),
    ctx?.weddingEvent?.eventEndsAt,
    ctx?.weddingEvent?.timezone || 'America/Sao_Paulo'
  );

  const currentMoment = scheduleClassification.currentItem;
  const nextMoment = scheduleClassification.nextItem;
  const highlightItem = currentMoment || nextMoment;

  // ─── Resolução de Mesas com Privacidade ───
  const tableAssignments = ctx?.guestsTableInfo || [];
  const assignedGuests = tableAssignments.filter((t) => t.table !== null);
  const unassignedGuests = tableAssignments.filter((t) => t.table === null);
  const distinctTableNames = Array.from(new Set(assignedGuests.map((t) => t.table!.name)));

  // Cenários:
  // 1. Todos na mesma mesa
  const isUnifiedTable = distinctTableNames.length === 1 && unassignedGuests.length === 0;
  const singleTable = isUnifiedTable ? assignedGuests[0].table : null;

  // 2. Mesas múltiplas ou parciais
  const hasMultipleOrPartialTables = distinctTableNames.length > 1 || (distinctTableNames.length === 1 && unassignedGuests.length > 0);

  // 3. Nenhuma mesa atribuída
  const hasNoTableAssigned = assignedGuests.length === 0;

  // ─── Resolução de Check-in ───
  const checkIns = ctx?.guestsCheckInInfo || [];
  const allCheckedIn = checkIns.length > 0 && checkIns.every((c) => c.checkedIn);
  const someCheckedIn = checkIns.some((c) => c.checkedIn);

  // ─── Resolução do Cardápio ───
  const menuSections = ctx?.menuSections || [];
  const hasMenu = menuSections.length > 0;
  const guestsWithDietaryRestrictions = (ctx?.guestsDietaryInfo || []).filter(
    (g) => g.dietaryRestrictions && g.dietaryRestrictions.trim().length > 0
  );
  const hasDietaryRestrictions = guestsWithDietaryRestrictions.length > 0;

  if (loading && !ctx) {
    return (
      <div className="event-day-page" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
        <Monogram variant="pill" size="md" />
        <p className="font-serif" style={{ marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
          Hoje é o nosso dia...
        </p>
      </div>
    );
  }

  return (
    <div className="event-day-page animate-fade-in" id="event-day-home">
      {/* Banner de aviso se houver oscilação de rede */}
      {error && !ctx && (
        <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b', textAlign: 'center', fontSize: '0.85rem' }}>
          Não foi possível atualizar todas as informações em tempo real. Exibindo dados locais.
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          1. HERO DO EVENT_DAY — COMPACTO, OPERACIONAL E EDITORIAL
          ══════════════════════════════════════════════════════ */}
      <header className="event-day-header">
        <div className="event-day-header__container">
          <div className="event-day-header__main-info">
            <div className="event-day-header__top-row">
              <Monogram variant="pill" size="sm" />
              <div className="event-day-tag">Hoje é o nosso dia ❤️</div>
            </div>

            <h1 className="event-day-header__names">Patrício &amp; Evandria</h1>

            <div className="event-day-header__meta">
              <span>21 de Novembro de 2026</span>
              <span className="event-day-header__dot">&bull;</span>
              <span>Nova Veneza &bull; SC</span>
            </div>

            {/* Boas-vindas ao grupo/família */}
            <div className="event-day-welcome">
              <span className="event-day-welcome__label">Que alegria celebrar com você,</span>
              <span className="event-day-welcome__name">{invite.familyTitle}</span>
            </div>
          </div>

          {/* Foto oficial do casal em moldura viva compacta */}
          <div className="event-day-header__photo-wrap">
            <picture>
              <source
                type="image/avif"
                srcSet="/images/wedding/hero-11-640w.avif 640w, /images/wedding/hero-11-1080w.avif 1080w"
                sizes="(max-width: 640px) 96px, 130px"
              />
              <source
                type="image/webp"
                srcSet="/images/wedding/hero-11-640w.webp 640w, /images/wedding/hero-11-1080w.webp 1080w"
                sizes="(max-width: 640px) 96px, 130px"
              />
              <img
                src="/images/wedding/hero-11-640w.jpg"
                alt="Patrício & Evandria"
                className="event-day-header__photo"
                width={130}
                height={130}
                loading="eager"
              />
            </picture>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          NAVEGAÇÃO RÁPIDA DESKTOP (STICKY & DISCRETA)
          ══════════════════════════════════════════════════════ */}
      <nav className="event-day-desktop-nav" aria-label="Navegação rápida do evento">
        <div className="event-day-desktop-nav__container">
          <button
            type="button"
            className={`event-day-desktop-nav__btn ${activeSection === 'section-now' ? 'event-day-desktop-nav__btn--active' : ''}`}
            onClick={() => scrollToSection('section-now')}
          >
            <ClockIcon />
            <span>Agora</span>
          </button>
          <button
            type="button"
            className={`event-day-desktop-nav__btn ${activeSection === 'section-table' ? 'event-day-desktop-nav__btn--active' : ''}`}
            onClick={() => scrollToSection('section-table')}
          >
            <TableIcon />
            <span>Sua Mesa</span>
          </button>
          <button
            type="button"
            className={`event-day-desktop-nav__btn ${activeSection === 'section-checkin' ? 'event-day-desktop-nav__btn--active' : ''}`}
            onClick={() => scrollToSection('section-checkin')}
          >
            <CheckIcon />
            <span>Check-in</span>
          </button>
          <button
            type="button"
            className={`event-day-desktop-nav__btn ${activeSection === 'section-schedule' ? 'event-day-desktop-nav__btn--active' : ''}`}
            onClick={() => scrollToSection('section-schedule')}
          >
            <CalendarListIcon />
            <span>Programação</span>
          </button>
          <button
            type="button"
            className={`event-day-desktop-nav__btn ${activeSection === 'section-menu' ? 'event-day-desktop-nav__btn--active' : ''}`}
            onClick={() => scrollToSection('section-menu')}
          >
            <UtensilsIcon />
            <span>Cardápio</span>
          </button>
          <button
            type="button"
            className={`event-day-desktop-nav__btn ${activeSection === 'section-media' ? 'event-day-desktop-nav__btn--active' : ''}`}
            onClick={() => scrollToSection('section-media')}
          >
            <CameraIcon />
            <span>Fotos</span>
          </button>
          <button
            type="button"
            className={`event-day-desktop-nav__btn ${activeSection === 'section-routes' ? 'event-day-desktop-nav__btn--active' : ''}`}
            onClick={() => scrollToSection('section-routes')}
          >
            <PinIcon />
            <span>Como Chegar</span>
          </button>
        </div>
      </nav>

      <main className="event-day-content">
        {/* ══════════════════════════════════════════════════════
            2. AVISOS IMPORTANTES (NOTICE)
            ══════════════════════════════════════════════════════ */}
        {ctx?.notices && ctx.notices.length > 0 && (
          <section className="event-day-notices" aria-label="Avisos do Casamento">
            {ctx.notices.map((notice) => (
              <div key={notice.id} className="event-day-notice-card">
                <div className="event-day-notice-card__icon">
                  <BellIcon />
                </div>
                <div className="event-day-notice-card__body">
                  <h3 className="event-day-notice-card__title">{notice.title}</h3>
                  <p className="event-day-notice-card__text">{notice.body}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            3. BLOCO "AGORA" — MÁXIMA PRIORIDADE VISUAL
            ══════════════════════════════════════════════════════ */}
        <section id="section-now" className="event-day-section" aria-labelledby="heading-now">
          <div className={`event-day-highlight-card ${currentMoment ? 'event-day-highlight-card--active' : ''}`}>
            <div className="event-day-card__header">
              <span className={`event-day-badge ${currentMoment ? 'event-day-badge--now' : 'event-day-badge--highlight'}`}>
                <ClockIcon /> {currentMoment ? 'Acontecendo Agora' : 'Próximo Momento'}
              </span>
              <span className="event-day-card__time">
                {highlightItem
                  ? `${highlightItem.formattedStartTime}${highlightItem.formattedEndTime ? ` — ${highlightItem.formattedEndTime}` : ''}`
                  : '10h30'}
              </span>
            </div>

            <h2 id="heading-now" className="event-day-highlight-card__title">
              {highlightItem?.item?.title || 'Cerimônia Religiosa'}
            </h2>

            <p className="event-day-highlight-card__location">
              <PinIcon />
              <span>
                {highlightItem?.item?.location ||
                  ctx?.weddingEvent.ceremonyVenue ||
                  'Santuário Diocesano Nossa Senhora de Caravaggio'}
              </span>
            </p>

            {highlightItem?.item?.description && (
              <p className="event-day-highlight-card__desc">
                {highlightItem.item.description}
              </p>
            )}

            {/* Sub-bloco: Momento seguinte quando há item acontecendo agora */}
            {currentMoment && nextMoment && (
              <div className="event-day-next-sub-item">
                <span className="event-day-next-sub-item__label">Próximo:</span>
                <div className="event-day-next-sub-item__body">
                  <strong className="event-day-next-sub-item__title">{nextMoment.item.title}</strong>
                  <span className="event-day-next-sub-item__time">
                    {nextMoment.formattedStartTime}
                    {nextMoment.formattedEndTime ? ` — ${nextMoment.formattedEndTime}` : ''}
                    {nextMoment.item.location ? ` • ${nextMoment.item.location}` : ''}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Grid de dois cards no Desktop: Mesa + Check-in */}
        <div className="event-day-cards-grid">
          {/* ══════════════════════════════════════════════════════
              4. SUA MESA (DESTAQUE FORTE OU FALLBACK ELEGANTE)
              ══════════════════════════════════════════════════════ */}
          <section id="section-table" className="event-day-section" aria-labelledby="heading-table">
            <div className="event-day-card">
              <div className="event-day-card__header">
                <h2 id="heading-table" className="event-day-card__title">
                  <TableIcon /> Sua Mesa
                </h2>
                <span className="event-day-card__subtitle">Casa de Eventos La Brace</span>
              </div>

              {/* Cenário 1: Todos da família na mesma mesa */}
              {isUnifiedTable && singleTable && (
                <div className="event-day-table-banner">
                  <span className="event-day-table-banner__tag">Mesa Reservada</span>
                  <div className="event-day-table-banner__number">{singleTable.name}</div>
                  {singleTable.locationHint && (
                    <div className="event-day-table-banner__hint">
                      <PinIcon /> {singleTable.locationHint}
                    </div>
                  )}
                  <div className="event-day-table-members">
                    <span className="event-day-table-members__title">Lugares preparados para:</span>
                    <div className="event-day-table-members__chips">
                      {tableAssignments.map((ta) => (
                        <span key={ta.guestId} className="event-day-table-member-chip">
                          {ta.guestName}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="event-day-table-banner__note">
                    Todos os integrantes do seu convite estão acomodados juntos nesta mesa.
                  </p>
                </div>
              )}

              {/* Cenário 2: Integrantes em mesas diferentes ou com alocação parcial */}
              {hasMultipleOrPartialTables && (
                <div className="event-day-table-multi">
                  <p className="event-day-card__description">
                    Os membros do seu convite possuem as seguintes alocações de mesa:
                  </p>
                  <div className="event-day-guests-list">
                    {tableAssignments.map((ta) => (
                      <div key={ta.guestId} className="event-day-guest-row">
                        <span className="event-day-guest-row__name">{ta.guestName}</span>
                        {ta.table ? (
                          <span className="event-day-status-pill event-day-status-pill--table">
                            <strong>{ta.table.name}</strong>
                            {ta.table.locationHint && <span className="event-day-status-pill__hint"> ({ta.table.locationHint})</span>}
                          </span>
                        ) : (
                          <span className="event-day-status-pill event-day-status-pill--pending">
                            Mesa a confirmar na chegada
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="event-day-table-multi__footer-note">
                    Caso tenha qualquer dúvida na chegada, nossa equipe de recepção estará a postos para orientá-los.
                  </p>
                </div>
              )}

              {/* Cenário 3: Nenhuma mesa atribuída ainda */}
              {hasNoTableAssigned && (
                <div className="event-day-table-empty-card">
                  <div className="event-day-table-empty-card__icon">
                    <TableIcon />
                  </div>
                  <h3 className="event-day-table-empty-card__title">Mesa a confirmar na chegada</h3>
                  <p className="event-day-table-empty-card__text">
                    A sua mesa será confirmada pela nossa recepção na entrada da Casa de Eventos La Brace.
                  </p>
                  <div className="event-day-table-empty-card__tip">
                    Nossa equipe estará a postos para acolher você e sua família com todo o carinho.
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              5. CHECK-IN DE CHEGADA (COMPACTO APÓS CONFIRMAÇÃO)
              ══════════════════════════════════════════════════════ */}
          <section id="section-checkin" className="event-day-section" aria-labelledby="heading-checkin">
            <div className="event-day-card">
              <div className="event-day-card__header">
                <h2 id="heading-checkin" className="event-day-card__title">
                  <CheckIcon /> Check-in de Chegada
                </h2>
                <span className={`event-day-badge ${allCheckedIn ? 'event-day-badge--success' : someCheckedIn ? 'event-day-badge--partial' : 'event-day-badge--neutral'}`}>
                  {allCheckedIn ? 'Presença Confirmada' : someCheckedIn ? 'Parcialmente Presente' : 'Aguardando Chegada'}
                </span>
              </div>

              {/* Estado Compacto quando todos já deram check-in */}
              {allCheckedIn ? (
                <div className="event-day-checkin-compact-state">
                  <div className="event-day-checkin-compact-badge">
                    <CheckIcon />
                    <span>Presença confirmada</span>
                  </div>
                  <div className="event-day-checkin-compact-list">
                    {invite.guests.map((guest) => {
                      const checkInInfo = checkIns.find((c) => c.guestId === guest.id);
                      const formattedTime = formatCheckInTime(checkInInfo?.checkedInAt);
                      return (
                        <div key={guest.id} className="event-day-checkin-compact-row">
                          <span className="event-day-checkin-compact-name">
                            ✓ {guest.name} — chegada confirmada{formattedTime ? ` às ${formattedTime}` : ''}
                          </span>
                          {guest.isChild && <span className="event-day-guest-row__child-tag">Criança</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  <p className="event-day-card__description">
                    Ao chegar ao Santuário ou à recepção, confirme sua presença com 1 toque.
                  </p>

                  <div className="event-day-guests-list">
                    {invite.guests.map((guest) => {
                      const checkInInfo = checkIns.find((c) => c.guestId === guest.id);
                      const isCheckedIn = checkInInfo?.checkedIn;
                      const formattedTime = formatCheckInTime(checkInInfo?.checkedInAt);
                      const isSubmitting = submittingGuestId === guest.id;
                      const guestError = checkInError?.guestId === guest.id ? checkInError.message : null;
                      const guestFeedback = feedbackMessage?.guestId === guest.id ? feedbackMessage.text : null;

                      return (
                        <div key={guest.id} className="event-day-guest-row-wrap">
                          {isCheckedIn ? (
                            <div className="event-day-guest-row-checkedin">
                              <span className="event-day-guest-row-checkedin__text">
                                ✓ <strong>{guest.name}</strong> — chegada confirmada{formattedTime ? ` às ${formattedTime}` : ''}
                              </span>
                              {guest.isChild && <span className="event-day-guest-row__child-tag">Criança</span>}
                            </div>
                          ) : (
                            <div className="event-day-guest-row">
                              <div className="event-day-guest-row__name">
                                <span>{guest.name}</span>
                                {guest.isChild && <span className="event-day-guest-row__child-tag">Criança</span>}
                              </div>
                              <div className="event-day-guest-row__action">
                                <button
                                  type="button"
                                  className="event-day-checkin-btn"
                                  disabled={isSubmitting}
                                  onClick={() => handleCheckIn(guest.id)}
                                  aria-label={`Confirmar chegada de ${guest.name}`}
                                >
                                  {isSubmitting ? (
                                    <>
                                      <span className="event-day-spinner" aria-hidden="true" />
                                      <span>Registrando...</span>
                                    </>
                                  ) : (
                                    'Confirmar chegada'
                                  )}
                                </button>
                              </div>
                            </div>
                          )}

                          {guestFeedback && (
                            <div className="event-day-guest-feedback animate-fade-in" role="status">
                              {guestFeedback}
                            </div>
                          )}

                          {guestError && (
                            <div className="event-day-guest-error animate-fade-in" role="alert">
                              <span>{guestError}</span>
                              <button
                                type="button"
                                className="event-day-guest-retry-btn"
                                onClick={() => handleCheckIn(guest.id)}
                              >
                                Tentar novamente
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* ══════════════════════════════════════════════════════
            6. PROGRAMAÇÃO DE HOJE (TIMELINE EXPANSÍVEL RECOLHIDA)
            ══════════════════════════════════════════════════════ */}
        <section id="section-schedule" className="event-day-section" aria-labelledby="heading-schedule">
          <div className="event-day-card">
            <div className="event-day-card__header">
              <h2 id="heading-schedule" className="event-day-card__title">
                <CalendarListIcon /> Programação de Hoje
              </h2>
              <span className="event-day-card__subtitle">Momentos especiais</span>
            </div>

            {/* Estado Vazio se não houver itens de cronograma */}
            {scheduleClassification.classifiedItems.length === 0 ? (
              <div className="event-day-empty-schedule">
                <p className="event-day-card__description">
                  A programação será atualizada em breve.
                </p>
              </div>
            ) : (
              <div className="event-day-schedule-container">
                {/* Resumo Condensado da Programação */}
                <div className="event-day-schedule-summary">
                  {currentMoment && (
                    <div className="event-day-schedule-summary-row event-day-schedule-summary-row--now">
                      <span className="event-day-badge event-day-badge--now">Acontecendo Agora</span>
                      <strong className="event-day-schedule-summary-title">{currentMoment.item.title}</strong>
                      <span className="event-day-schedule-summary-meta">
                        {currentMoment.formattedStartTime}
                        {currentMoment.formattedEndTime ? ` – ${currentMoment.formattedEndTime}` : ''}
                        {currentMoment.item.location ? ` • ${currentMoment.item.location}` : ''}
                      </span>
                    </div>
                  )}

                  {nextMoment && (
                    <div className="event-day-schedule-summary-row event-day-schedule-summary-row--next">
                      <span className="event-day-badge event-day-badge--neutral">A Seguir</span>
                      <strong className="event-day-schedule-summary-title">{nextMoment.item.title}</strong>
                      <span className="event-day-schedule-summary-meta">
                        {nextMoment.formattedStartTime}
                        {nextMoment.item.location ? ` • ${nextMoment.item.location}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Timeline Completa (Expansível) */}
                {isScheduleExpanded && (
                  <div className="event-day-timeline animate-fade-in" aria-label="Linha do tempo completa do casamento">
                    {scheduleClassification.classifiedItems.map((classified) => {
                      const { item, status, formattedStartTime, formattedEndTime } = classified;
                      const isNow = status === 'HAPPENING_NOW';
                      const isNext = status === 'NEXT';
                      const isPast = status === 'PAST';

                      return (
                        <div
                          key={item.id}
                          className={`event-day-timeline-item ${isNow ? 'event-day-timeline-item--now' : isNext ? 'event-day-timeline-item--next' : isPast ? 'event-day-timeline-item--past' : 'event-day-timeline-item--future'}`}
                        >
                          {/* Coluna de Horário */}
                          <div className="event-day-timeline-time">
                            <span className="event-day-timeline-time__start">{formattedStartTime}</span>
                            {formattedEndTime && (
                              <span className="event-day-timeline-time__end">{formattedEndTime}</span>
                            )}
                          </div>

                          {/* Marcador da Timeline */}
                          <div className="event-day-timeline-marker">
                            <div className="event-day-timeline-dot">
                              {isPast && <CheckIcon />}
                            </div>
                            <div className="event-day-timeline-line" />
                          </div>

                          {/* Conteúdo do Momento */}
                          <div className="event-day-timeline-content">
                            <div className="event-day-timeline-header">
                              <h3 className="event-day-timeline-title">{item.title}</h3>
                              {isNow && (
                                <span className="event-day-badge event-day-badge--now">Acontecendo agora</span>
                              )}
                              {isNext && (
                                <span className="event-day-badge event-day-badge--highlight">Próximo</span>
                              )}
                              {isPast && (
                                <span className="event-day-badge event-day-badge--past">Concluído</span>
                              )}
                            </div>

                            {item.location && (
                              <p className="event-day-timeline-location">
                                <PinIcon /> {item.location}
                              </p>
                            )}

                            {item.description && (
                              <p className="event-day-timeline-desc">{item.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Botão de Expansão / Recolhimento da Timeline */}
                <button
                  type="button"
                  className="event-day-btn event-day-btn--timeline-toggle"
                  onClick={() => setIsScheduleExpanded((prev) => !prev)}
                  aria-expanded={isScheduleExpanded}
                >
                  <span>
                    {isScheduleExpanded
                      ? 'Recolher programação'
                      : `Ver programação completa (${scheduleClassification.classifiedItems.length} momentos)`}
                  </span>
                  <ChevronDownIcon expanded={isScheduleExpanded} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            7. CARDÁPIO DA CELEBRAÇÃO (EXPANSÍVEL)
            ══════════════════════════════════════════════════════ */}
        <section id="section-menu" className="event-day-section" aria-labelledby="heading-menu">
          <div className="event-day-card">
            <div className="event-day-card__header">
              <h2 id="heading-menu" className="event-day-card__title">
                <UtensilsIcon /> Cardápio da Celebração
              </h2>
              <span className="event-day-card__subtitle">
                {hasMenu ? `${menuSections.length} ${menuSections.length === 1 ? 'etapa gastronômica' : 'etapas gastronômicas'}` : 'Gastronomia do Casamento'}
              </span>
            </div>

            {!hasMenu ? (
              <div className="event-day-menu-empty">
                <p className="event-day-card__description">
                  O cardápio será apresentado em breve.
                </p>
              </div>
            ) : (
              <div className="event-day-menu-container">
                <p className="event-day-card__description">
                  Um menu preparado com carinho para celebrar este momento inesquecível.
                </p>

                {/* Resumo das etapas/seções em chips */}
                <div className="event-day-menu-tags" aria-label="Etapas do cardápio">
                  {menuSections.map((section) => (
                    <span key={section.id} className="event-day-menu-tag">
                      {section.title}
                    </span>
                  ))}
                </div>

                {/* Visualização Completa Inline Expandida */}
                {isMenuExpanded && (
                  <div className="event-day-menu-full animate-fade-in" aria-label="Cardápio completo da celebração">
                    {menuSections.map((section, idx) => (
                      <div key={section.id} className="event-day-menu-section">
                        <div className="event-day-menu-section__header">
                          <span className="event-day-menu-section__step">{idx + 1}ª Etapa</span>
                          <h3 className="event-day-menu-section__title">{section.title}</h3>
                          {section.description && (
                            <p className="event-day-menu-section__desc">{section.description}</p>
                          )}
                        </div>

                        {section.items && section.items.length > 0 && (
                          <ul className="event-day-menu-items">
                            {section.items.map((item) => (
                              <li key={item.id} className="event-day-menu-item">
                                <span className="event-day-menu-item__bullet" aria-hidden="true">&bull;</span>
                                <div className="event-day-menu-item__content">
                                  <strong className="event-day-menu-item__name">{item.name}</strong>
                                  {item.description && (
                                    <p className="event-day-menu-item__desc">{item.description}</p>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}

                        {idx < menuSections.length - 1 && (
                          <div className="event-day-menu-section__divider" aria-hidden="true" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Aviso Contextual Discreto de Restrições Alimentares */}
                {hasDietaryRestrictions && (
                  <div className="event-day-menu-dietary-notice animate-fade-in" role="note">
                    <div className="event-day-menu-dietary-notice__icon">ℹ️</div>
                    <div className="event-day-menu-dietary-notice__content">
                      <strong className="event-day-menu-dietary-notice__title">
                        Aviso sobre restrições alimentares
                      </strong>
                      <p className="event-day-menu-dietary-notice__text">
                        Você informou restrições alimentares no RSVP ({guestsWithDietaryRestrictions
                          .map((g) => `${g.guestName}: "${g.dietaryRestrictions}"`)
                          .join('; ')}). Em caso de dúvidas sobre ingredientes, por favor confirme com a equipe do evento.
                      </p>
                    </div>
                  </div>
                )}

                {/* Botão de Expansão / Recolhimento */}
                <button
                  type="button"
                  className="event-day-btn event-day-btn--menu-toggle"
                  onClick={() => setIsMenuExpanded((prev) => !prev)}
                  aria-expanded={isMenuExpanded}
                >
                  <span>
                    {isMenuExpanded
                      ? 'Recolher cardápio'
                      : `Ver cardápio completo (${menuSections.length} ${menuSections.length === 1 ? 'etapa' : 'etapas'})`}
                  </span>
                  <ChevronDownIcon expanded={isMenuExpanded} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            8. FOTOS & VÍDEOS (CENTRAL COLABORATIVA DE MÍDIA)
            ══════════════════════════════════════════════════════ */}
        <section id="section-media" className="event-day-section" aria-labelledby="heading-media">
          <div className="event-day-card event-day-card--media">
            <div className="event-day-media-callout">
              <div className="event-day-media-callout__icon">
                <CameraIcon />
              </div>
              <h2 id="heading-media" className="event-day-media-callout__title">
                Registre Esse Momento
              </h2>
              <p className="event-day-media-callout__text">
                Tire fotos e grave vídeos durante a cerimônia e a festa. Compartilhe seu olhar com os noivos e faça parte do telão da celebração!
              </p>

              {/* Input invisível acionado programaticamente pelo botão de toque */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime"
                style={{ display: 'none' }}
                onChange={handleSelectFile}
                aria-label="Selecionar foto ou vídeo"
              />

              {/* Botão de Ação Principal (CTA) */}
              {!selectedFile && (
                <div className="event-day-media-callout__action">
                  <button
                    type="button"
                    className="event-day-cta-btn event-day-cta-btn--photo"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Compartilhar foto ou vídeo"
                  >
                    <CameraIcon />
                    <span>Compartilhar foto ou vídeo</span>
                  </button>
                  <p className="event-day-media-callout__hint">
                    Fotos até 15 MB • Vídeos até 100 MB
                  </p>
                </div>
              )}

              {/* Mensagem de Erro de Upload */}
              {mediaUploadError && (
                <div className="event-day-media-error animate-fade-in" role="alert">
                  <span>{mediaUploadError}</span>
                  <button
                    type="button"
                    className="event-day-media-error__close"
                    onClick={() => setMediaUploadError(null)}
                    aria-label="Fechar aviso de erro"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Mensagem de Sucesso */}
              {mediaUploadSuccess && (
                <div className="event-day-media-success animate-fade-in" role="status">
                  <div className="event-day-media-success__title">
                    <CheckIcon /> {mediaUploadSuccess}
                  </div>
                  <p className="event-day-media-success__text">
                    Aguardando aprovação para aparecer na celebração.
                  </p>
                </div>
              )}

              {/* Card de Preview do Arquivo Selecionado */}
              {selectedFile && (
                <div className="event-day-media-preview-card animate-fade-in">
                  <div className="event-day-media-preview-header">
                    <span className="event-day-media-preview-header__tag">
                      {selectedFile.type.startsWith('video/') ? '🎬 Vídeo Selecionado' : '📷 Foto Selecionada'}
                    </span>
                    <span className="event-day-media-preview-header__size">
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>

                  {previewUrl ? (
                    <div className="event-day-media-preview-img-wrap">
                      <img
                        src={previewUrl}
                        alt="Pré-visualização da foto selecionada"
                        className="event-day-media-preview-img"
                      />
                    </div>
                  ) : (
                    <div className="event-day-media-preview-video-box">
                      <div className="event-day-media-preview-video-box__icon">🎬</div>
                      <strong className="event-day-media-preview-video-box__name">{selectedFile.name}</strong>
                    </div>
                  )}

                  <div className="event-day-media-preview-actions">
                    <button
                      type="button"
                      className="event-day-btn event-day-btn--upload-submit"
                      disabled={isUploadingMedia}
                      onClick={handleUploadMedia}
                    >
                      {isUploadingMedia ? (
                        <>
                          <span className="event-day-spinner" aria-hidden="true" />
                          <span>Enviando registro...</span>
                        </>
                      ) : (
                        'Enviar para o Casamento ❤️'
                      )}
                    </button>

                    <button
                      type="button"
                      className="event-day-btn event-day-btn--upload-cancel"
                      disabled={isUploadingMedia}
                      onClick={handleCancelSelection}
                    >
                      Trocar arquivo
                    </button>
                  </div>
                </div>
              )}

              {/* Lista das mídias enviadas pelo próprio convite */}
              {mineMediaList.length > 0 && (
                <div className="event-day-mine-media-wrap">
                  <div className="event-day-mine-media-header">
                    <h3 className="event-day-mine-media-title">
                      Seus Registros Enviados ({mineMediaList.length})
                    </h3>
                  </div>

                  <div className="event-day-mine-media-list">
                    {mineMediaList.map((item) => (
                      <div key={item.id} className="event-day-mine-media-item">
                        <div className="event-day-mine-media-item__info">
                          {item.type === 'PHOTO' && item.hasThumb ? (
                            <div className="event-day-mine-media-thumb-wrap">
                              <img
                                src={buildApiUrl(`/api/v1/event/media/${item.id}/file?variant=thumb`)}
                                alt={item.originalFileName}
                                className="event-day-mine-media-thumb"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="event-day-mine-media-thumb-wrap event-day-mine-media-thumb-wrap--placeholder">
                              <span>{item.type === 'VIDEO' ? '🎬' : '📷'}</span>
                            </div>
                          )}
                          <span className="event-day-mine-media-item__name">
                            {item.originalFileName}
                          </span>
                        </div>
                        <span className="event-day-status-pill event-day-status-pill--pending">
                          Aguardando aprovação
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            9. CARD COMO CHEGAR (ROTAS DIRETAS)
            ══════════════════════════════════════════════════════ */}
        <section id="section-routes" className="event-day-section" aria-labelledby="heading-routes">
          <div className="event-day-card">
            <div className="event-day-card__header">
              <h2 id="heading-routes" className="event-day-card__title">
                <PinIcon /> Como Chegar
              </h2>
              <span className="event-day-card__subtitle">Rotas para a celebração</span>
            </div>

            <div className="event-day-routes-list">
              {/* Cerimônia */}
              <div className="event-day-route-item">
                <div className="event-day-route-item__info">
                  <span className="event-day-route-item__tag">1. Cerimônia (10h30)</span>
                  <strong className="event-day-route-item__name">Santuário de Caravaggio</strong>
                  <span className="event-day-route-item__addr">Caravaggio &bull; Nova Veneza / SC</span>
                </div>
                <div className="event-day-route-item__actions">
                  <a
                    href={ceremonyGmaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="event-day-btn event-day-btn--maps"
                    aria-label="Cerimônia no Google Maps"
                  >
                    <PinIcon /> Maps
                  </a>
                  <a
                    href={ceremonyWaze}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="event-day-btn event-day-btn--waze"
                    aria-label="Cerimônia no Waze"
                  >
                    <NavIcon /> Waze
                  </a>
                </div>
              </div>

              <div className="event-day-route-divider" />

              {/* Recepção */}
              <div className="event-day-route-item">
                <div className="event-day-route-item__info">
                  <span className="event-day-route-item__tag">2. Recepção</span>
                  <strong className="event-day-route-item__name">Casa de Eventos La Brace</strong>
                  <span className="event-day-route-item__addr">R. Frederico Marazzi, 200 &bull; Nova Veneza / SC</span>
                </div>
                <div className="event-day-route-item__actions">
                  <a
                    href={receptionGmaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="event-day-btn event-day-btn--maps"
                    aria-label="Recepção no Google Maps"
                  >
                    <PinIcon /> Maps
                  </a>
                  <a
                    href={receptionWaze}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="event-day-btn event-day-btn--waze"
                    aria-label="Recepção no Waze"
                  >
                    <NavIcon /> Waze
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ══════════════════════════════════════════════════════
          10. FOOTER EDITORIAL
          ══════════════════════════════════════════════════════ */}
      <footer className="page-footer" aria-label="Assinatura dos noivos">
        <div className="page-footer__monogram-letters">P &amp; E</div>
        <div className="page-footer__rule" />
        <div className="page-footer__date">21 &bull; 11 &bull; 2026</div>
        <div className="page-footer__location">Nova Veneza &bull; SC</div>
      </footer>

      {/* ══════════════════════════════════════════════════════
          11. BARRA DE NAVEGAÇÃO RÁPIDA MOBILE (FIXA INFERIOR)
          Somente no EVENT_DAY e telas mobile/tablet
          ══════════════════════════════════════════════════════ */}
      <nav className="event-day-bottom-nav" aria-label="Navegação rápida do dia">
        <button
          type="button"
          className={`event-day-bottom-nav__item ${activeSection === 'section-now' ? 'event-day-bottom-nav__item--active' : ''}`}
          onClick={() => scrollToSection('section-now')}
          aria-label="Ir para o momento Agora"
        >
          <span className="event-day-bottom-nav__icon"><ClockIcon /></span>
          <span className="event-day-bottom-nav__label">Agora</span>
        </button>

        <button
          type="button"
          className={`event-day-bottom-nav__item ${activeSection === 'section-table' ? 'event-day-bottom-nav__item--active' : ''}`}
          onClick={() => scrollToSection('section-table')}
          aria-label="Ir para Sua Mesa"
        >
          <span className="event-day-bottom-nav__icon"><TableIcon /></span>
          <span className="event-day-bottom-nav__label">Mesa</span>
        </button>

        <button
          type="button"
          className={`event-day-bottom-nav__item ${activeSection === 'section-schedule' ? 'event-day-bottom-nav__item--active' : ''}`}
          onClick={() => scrollToSection('section-schedule')}
          aria-label="Ir para Programação"
        >
          <span className="event-day-bottom-nav__icon"><CalendarListIcon /></span>
          <span className="event-day-bottom-nav__label">Programação</span>
        </button>

        <button
          type="button"
          className={`event-day-bottom-nav__item ${activeSection === 'section-menu' ? 'event-day-bottom-nav__item--active' : ''}`}
          onClick={() => scrollToSection('section-menu')}
          aria-label="Ir para Cardápio"
        >
          <span className="event-day-bottom-nav__icon"><UtensilsIcon /></span>
          <span className="event-day-bottom-nav__label">Cardápio</span>
        </button>

        <button
          type="button"
          className={`event-day-bottom-nav__item ${activeSection === 'section-media' ? 'event-day-bottom-nav__item--active' : ''}`}
          onClick={() => scrollToSection('section-media')}
          aria-label="Ir para Compartilhar Fotos"
        >
          <span className="event-day-bottom-nav__icon"><CameraIcon /></span>
          <span className="event-day-bottom-nav__label">Fotos</span>
        </button>
      </nav>
    </div>
  );
};
