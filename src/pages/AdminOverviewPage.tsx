import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type {
  AdminOverviewDTO,
  AdminOverviewAlertDTO,
  AdminUserDTO,
} from '../contracts/index.js';
import { Monogram } from '../components/Monogram.js';
import { apiFetch } from '../lib/api.js';

const POLLING_INTERVAL_MS = 25000; // 25 segundos

/* ──────────────────────────────────────────────
   Icons
   ────────────────────────────────────────────── */
const RefreshIcon: React.FC<{ spinning?: boolean }> = ({ spinning = false }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{
      animation: spinning ? 'admin-spin 0.8s linear infinite' : 'none',
    }}
  >
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const LogoutIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const AlertTriangleIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CheckCircleIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ExternalLinkIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export const AdminOverviewPage: React.FC = () => {
  const navigate = useNavigate();

  const [adminUser, setAdminUser] = useState<AdminUserDTO | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Estados de dados
  const [overview, setOverview] = useState<AdminOverviewDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(new Date());

  const isPollingRef = useRef<boolean>(false);

  // 1. Verificar Autenticação
  useEffect(() => {
    let isMounted = true;
    const verifyAuth = async () => {
      try {
        const res = await apiFetch('/api/v1/admin/auth/me', {
          method: 'GET',
        });
        if (!res.ok) {
          navigate('/admin/login', { replace: true });
          return;
        }
        const data = await res.json();
        if (isMounted) {
          setAdminUser(data.user);
          setCheckingAuth(false);
        }
      } catch {
        if (isMounted) {
          navigate('/admin/login', { replace: true });
        }
      }
    };
    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // 2. Buscar Dados do Overview
  const fetchOverview = useCallback(async (isSilent = false) => {
    if (isPollingRef.current && isSilent) return;
    if (isSilent) isPollingRef.current = true;
    else setIsRefreshing(true);

    try {
      const res = await apiFetch('/api/v1/admin/overview', {
        method: 'GET',
      });

      if (res.status === 401) {
        navigate('/admin/login', { replace: true });
        return;
      }

      if (res.ok) {
        const data: AdminOverviewDTO = await res.json();
        setOverview(data);
        setLastUpdatedAt(new Date());
        setErrorMessage(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(errData.error || 'Falha ao carregar visão geral.');
      }
    } catch {
      if (!isSilent) {
        setErrorMessage('Erro de conexão ao carregar o painel administrativo.');
      }
    } finally {
      if (isSilent) isPollingRef.current = false;
      else {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [navigate]);

  // Carga inicial após auth
  useEffect(() => {
    if (!checkingAuth) {
      setLoading(true);
      fetchOverview(false);
    }
  }, [fetchOverview, checkingAuth]);

  // 3. Auto-polling suave a cada 25s
  useEffect(() => {
    if (checkingAuth) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchOverview(true);
      }
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchOverview, checkingAuth]);

  // 4. Logout
  const handleLogout = async () => {
    try {
      await apiFetch('/api/v1/admin/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Ignora erro
    } finally {
      navigate('/admin/login', { replace: true });
    }
  };

  const formatTimeOnly = (date: Date) => {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return '';
    }
  };

  if (checkingAuth) {
    return (
      <div className="admin-loading-screen">
        <Monogram variant="pill" size="md" />
        <p className="admin-loading-text">Carregando painel dos noivos...</p>
      </div>
    );
  }

  return (
    <div className="admin-page animate-fade-in">
      {/* ══════════════════════════════════════════════════════
          1. HEADER ADMINISTRATIVO UNIFICADO
          ══════════════════════════════════════════════════════ */}
      <header className="admin-header">
        <div className="admin-header__container">
          <div className="admin-header__brand">
            <Monogram variant="pill" size="sm" />
            <div className="admin-header__titles">
              <div className="admin-header__tags-row">
                <span className="admin-header__tag">Painel dos Noivos</span>
                {overview && overview.environment !== 'production' && (
                  <span className="admin-badge admin-badge--staging" title="Ambiente de testes/homologação">
                    Homologação
                  </span>
                )}
              </div>
              <h1 className="admin-header__title">Visão Geral Operacional</h1>
            </div>
          </div>

          <div className="admin-header__actions">
            <span className="admin-header__last-update" title="Última sincronização de dados">
              Atualizado às {formatTimeOnly(lastUpdatedAt)}
            </span>

            <button
              type="button"
              className="admin-btn admin-btn--icon-only"
              onClick={() => fetchOverview(false)}
              disabled={isRefreshing}
              title="Atualizar dados agora"
              aria-label="Atualizar dados"
            >
              <RefreshIcon spinning={isRefreshing} />
            </button>

            {adminUser && (
              <div className="admin-user-pill">
                <span className="admin-user-pill__name">{adminUser.name}</span>
              </div>
            )}

            <button
              type="button"
              className="admin-btn admin-btn--logout"
              onClick={handleLogout}
              title="Sair do painel"
              aria-label="Encerrar sessão"
            >
              <LogoutIcon />
              <span className="admin-btn__label-desktop">Sair</span>
            </button>
          </div>
        </div>

        {/* ── Sub-navegação em Abas ── */}
        <div className="admin-subnav">
          <div className="admin-subnav__container">
            <Link to="/admin" className="admin-subnav__tab admin-subnav__tab--active">
              🏛️ Visão Geral
            </Link>
            <Link to="/admin/guests" className="admin-subnav__tab">
              👥 Convidados &amp; Convites
            </Link>
            <Link to="/admin/tables" className="admin-subnav__tab">
              🍽️ Mesas &amp; Alocação
            </Link>
            <Link to="/admin/media" className="admin-subnav__tab">
              📷 Moderação de Fotos &amp; Vídeos
              {overview && overview.media.pending > 0 && (
                <span className="admin-subnav__badge">{overview.media.pending}</span>
              )}
            </Link>
            <Link to="/admin/content" className="admin-subnav__tab">
              📋 Conteúdo do Evento
            </Link>
          </div>
        </div>

      </header>

      <main className="admin-main">
        {errorMessage && (
          <div className="admin-alert admin-alert--error animate-fade-in" role="alert">
            <span>{errorMessage}</span>
          </div>
        )}

        {loading && !overview ? (
          <div className="admin-empty-state">
            <span className="admin-spinner" aria-hidden="true" />
            <p>Carregando indicadores do evento...</p>
          </div>
        ) : overview ? (
          <>
            {/* ══════════════════════════════════════════════════════
                2. BANNER DE CONTEXTO DO CASAMENTO
                ══════════════════════════════════════════════════════ */}
            <section className="admin-event-banner">
              <div className="admin-event-banner__content">
                <div className="admin-event-banner__phase-row">
                  <span className="admin-phase-badge">
                    {overview.event.phaseLabel}
                  </span>
                  <span className="admin-event-banner__date">
                    {overview.event.coupleDisplayName} &bull; 21 de Novembro de 2026
                  </span>
                </div>

                <div className="admin-event-banner__locations">
                  <div className="admin-location-item">
                    <span className="admin-location-item__label">⛪ Cerimônia</span>
                    <strong className="admin-location-item__value">10h30 &bull; Santuário de Caravaggio</strong>
                  </div>
                  <div className="admin-location-item">
                    <span className="admin-location-item__label">🥂 Recepção</span>
                    <strong className="admin-location-item__value">
                      {overview.event.receptionAt ? 'La Brace' : 'Horário La Brace a confirmar'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Destaque de Programação / Momento Atual */}
              <div className="admin-event-banner__schedule">
                <span className="admin-schedule-highlight__eyebrow">
                  {overview.schedule.current ? '✨ Acontecendo Agora' : '⏳ Próximo Momento'}
                </span>
                {overview.schedule.current ? (
                  <div className="admin-schedule-highlight__body">
                    <strong className="admin-schedule-highlight__title">
                      {overview.schedule.current.title}
                    </strong>
                    <span className="admin-schedule-highlight__meta">
                      {overview.schedule.current.formattedStartTime}
                      {overview.schedule.current.location ? ` • ${overview.schedule.current.location}` : ''}
                    </span>
                  </div>
                ) : overview.schedule.next ? (
                  <div className="admin-schedule-highlight__body">
                    <strong className="admin-schedule-highlight__title">
                      {overview.schedule.next.title}
                    </strong>
                    <span className="admin-schedule-highlight__meta">
                      {overview.schedule.next.formattedStartTime}
                      {overview.schedule.next.location ? ` • ${overview.schedule.next.location}` : ''}
                    </span>
                  </div>
                ) : (
                  <p className="admin-schedule-highlight__empty">
                    {overview.schedule.totalItems > 0
                      ? 'Nenhuma atração ativa neste momento.'
                      : 'Cronograma da celebração em elaboração.'}
                  </p>
                )}
              </div>
            </section>

            {/* ══════════════════════════════════════════════════════
                3. GRID DE INDICADORES OPERACIONAIS (CARDS PRINCIPAIS)
                ══════════════════════════════════════════════════════ */}
            <section className="admin-overview-grid" aria-label="Indicadores operacionais">
              {/* CARD 1: CONVIDADOS & RSVP */}
              <div className="admin-card admin-card--overview">
                <div className="admin-card__header">
                  <div className="admin-card__title-wrap">
                    <span className="admin-card__icon">👥</span>
                    <h2 className="admin-card__title">Convidados &amp; RSVP</h2>
                  </div>
                  <span className="admin-card__badge-sub">
                    {overview.invites.total} convites / famílias
                  </span>
                </div>

                <div className="admin-card__main-stat">
                  <div className="admin-stat-big">
                    <span className="admin-stat-big__value">{overview.guests.total}</span>
                    <span className="admin-stat-big__label">pessoas convidadas</span>
                  </div>
                  <div className="admin-stat-sub">
                    <span>{overview.guests.adultsCount} adultos</span>
                    <span>&bull;</span>
                    <span>{overview.guests.childrenCount} crianças</span>
                  </div>
                </div>

                {/* Barra Proporcional de RSVP */}
                <div className="admin-progress-bar" title="Distribuição do RSVP">
                  <div
                    className="admin-progress-bar__fill admin-progress-bar__fill--confirmed"
                    style={{
                      width: `${overview.guests.total > 0 ? (overview.guests.confirmed / overview.guests.total) * 100 : 0}%`,
                    }}
                  />
                  <div
                    className="admin-progress-bar__fill admin-progress-bar__fill--declined"
                    style={{
                      width: `${overview.guests.total > 0 ? (overview.guests.declined / overview.guests.total) * 100 : 0}%`,
                    }}
                  />
                  <div
                    className="admin-progress-bar__fill admin-progress-bar__fill--pending"
                    style={{
                      width: `${overview.guests.total > 0 ? (overview.guests.pending / overview.guests.total) * 100 : 0}%`,
                    }}
                  />
                </div>

                {/* Métricas Detalhadas de RSVP */}
                <div className="admin-stat-pills">
                  <div className="admin-stat-pill admin-stat-pill--confirmed">
                    <span className="admin-stat-pill__dot" />
                    <span className="admin-stat-pill__label">Confirmados</span>
                    <strong className="admin-stat-pill__value">{overview.guests.confirmed}</strong>
                  </div>
                  <div className="admin-stat-pill admin-stat-pill--declined">
                    <span className="admin-stat-pill__dot" />
                    <span className="admin-stat-pill__label">Recusados</span>
                    <strong className="admin-stat-pill__value">{overview.guests.declined}</strong>
                  </div>
                  <div className="admin-stat-pill admin-stat-pill--pending">
                    <span className="admin-stat-pill__dot" />
                    <span className="admin-stat-pill__label">Pendentes</span>
                    <strong className="admin-stat-pill__value">{overview.guests.pending}</strong>
                  </div>
                </div>

                <div className="admin-card__footer-info">
                  <span>
                    Famílias 100% respondidas: <strong>{overview.invites.fullyResponded}</strong> de {overview.invites.total}
                  </span>
                </div>
              </div>

              {/* CARD 2: PRESENÇA & MESAS */}
              <div className="admin-card admin-card--overview">
                <div className="admin-card__header">
                  <div className="admin-card__title-wrap">
                    <span className="admin-card__icon">📍</span>
                    <h2 className="admin-card__title">Presença &amp; Mesas</h2>
                  </div>
                  <span className="admin-card__badge-sub">Recepção La Brace</span>
                </div>

                <div className="admin-card__split-stats">
                  <div className="admin-split-stat">
                    <span className="admin-split-stat__label">Check-ins de Chegada</span>
                    <strong className="admin-split-stat__value admin-split-stat__value--green">
                      {overview.guests.checkedIn}
                    </strong>
                    <span className="admin-split-stat__sub">
                      {overview.guests.notCheckedIn} aguardados
                    </span>
                  </div>

                  <div className="admin-split-stat">
                    <span className="admin-split-stat__label">Alocação em Mesas</span>
                    <strong className="admin-split-stat__value">
                      {overview.guests.withTable}
                    </strong>
                    <span className="admin-split-stat__sub">
                      {overview.guests.withoutTable > 0 ? (
                        <span className="admin-text-warning">
                          {overview.guests.withoutTable} sem mesa
                        </span>
                      ) : (
                        'Todos alocados'
                      )}
                    </span>
                  </div>
                </div>

                <div className="admin-card__footer-info">
                  <p className="admin-card__hint">
                    {overview.guests.withoutTable > 0
                      ? `⚠️ Atenção: ${overview.guests.withoutTable} convidados ainda não possuem mesa definida.`
                      : '✓ Todos os convidados cadastrados possuem mesa vinculada.'}
                  </p>
                  {overview.guests.withoutTable > 0 && (
                    <Link to="/admin/tables" className="admin-btn admin-btn--sm admin-btn--outline" style={{ marginTop: '0.5rem' }}>
                      Alocar mesas &rarr;
                    </Link>
                  )}
                </div>
              </div>

              {/* CARD 3: MÍDIA COLABORATIVA & TELÃO */}
              <div className="admin-card admin-card--overview">
                <div className="admin-card__header">
                  <div className="admin-card__title-wrap">
                    <span className="admin-card__icon">📸</span>
                    <h2 className="admin-card__title">Mídia &amp; Telão</h2>
                  </div>
                  <span className="admin-card__badge-sub">
                    {overview.media.photos} fotos &bull; {overview.media.videos} vídeos
                  </span>
                </div>

                <div className="admin-card__main-stat">
                  <div className="admin-stat-big">
                    <span className={`admin-stat-big__value ${overview.media.pending > 0 ? 'admin-text-terracotta' : ''}`}>
                      {overview.media.pending}
                    </span>
                    <span className="admin-stat-big__label">aguardando moderação</span>
                  </div>
                  {overview.media.pending > 0 && (
                    <Link
                      to="/admin/media?status=PENDING"
                      className="admin-btn admin-btn--primary admin-btn--sm"
                    >
                      Moderar agora &rarr;
                    </Link>
                  )}
                </div>

                <div className="admin-stat-pills">
                  <div className="admin-stat-pill admin-stat-pill--confirmed">
                    <span className="admin-stat-pill__dot" />
                    <span className="admin-stat-pill__label">No Telão</span>
                    <strong className="admin-stat-pill__value">{overview.media.approved}</strong>
                  </div>
                  <div className="admin-stat-pill admin-stat-pill--declined">
                    <span className="admin-stat-pill__dot" />
                    <span className="admin-stat-pill__label">Rejeitadas</span>
                    <strong className="admin-stat-pill__value">{overview.media.rejected}</strong>
                  </div>
                  <div className="admin-stat-pill">
                    <span className="admin-stat-pill__label">Total Geral</span>
                    <strong className="admin-stat-pill__value">{overview.media.total}</strong>
                  </div>
                </div>

                <div className="admin-card__footer-info">
                  <span>
                    Transmissão ativa para o Live Wedding Screen (/screen).
                  </span>
                </div>
              </div>

              {/* CARD 4: CARDÁPIO & COMUNICADOS */}
              <div className="admin-card admin-card--overview">
                <div className="admin-card__header">
                  <div className="admin-card__title-wrap">
                    <span className="admin-card__icon">🍷</span>
                    <h2 className="admin-card__title">Cardápio &amp; Avisos</h2>
                  </div>
                  <span className="admin-card__badge-sub">Operação</span>
                </div>

                <div className="admin-card__split-stats">
                  <div className="admin-split-stat">
                    <span className="admin-split-stat__label">Menu da Celebração</span>
                    <strong className="admin-split-stat__value">
                      {overview.menu.hasMenu ? `${overview.menu.sectionsCount} seções` : 'Vazio'}
                    </strong>
                    <span className="admin-split-stat__sub">
                      {overview.menu.hasMenu ? `${overview.menu.itemsCount} itens cadastrados` : 'Ainda não cadastrado'}
                    </span>
                  </div>

                  <div className="admin-split-stat">
                    <span className="admin-split-stat__label">Avisos Vigentes</span>
                    <strong className="admin-split-stat__value">
                      {overview.notices.activeCount}
                    </strong>
                    <span className="admin-split-stat__sub">
                      {overview.notices.activeCount > 0 ? 'Comunicados ativos' : 'Nenhum comunicado'}
                    </span>
                  </div>
                </div>

                <div className="admin-card__footer-info">
                  <p className="admin-card__hint">
                    {overview.notices.recent.length > 0
                      ? `Último aviso: "${overview.notices.recent[0].title}"`
                      : 'Sem avisos extraordinários publicados aos convidados.'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <Link to="/admin/content?tab=menu" className="admin-btn admin-btn--sm admin-btn--outline">
                      Gerenciar Cardápio &rarr;
                    </Link>
                    <Link to="/admin/content?tab=notices" className="admin-btn admin-btn--sm admin-btn--outline">
                      Gerenciar Avisos &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════════════════
                4. SEÇÃO PONTOS DE ATENÇÃO (ALERTAS OPERACIONAIS)
                ══════════════════════════════════════════════════════ */}
            <section className="admin-section-alerts" aria-label="Pontos de atenção operacionais">
              <div className="admin-section-header">
                <div className="admin-section-header__title-wrap">
                  <span className="admin-section-icon">⚠️</span>
                  <h2 className="admin-section-title">Pontos de Atenção Operacionais</h2>
                </div>
                <span className="admin-section-subtitle">
                  Diagnóstico determinístico em tempo real
                </span>
              </div>

              {overview.alerts.length === 0 ? (
                <div className="admin-all-good-box">
                  <CheckCircleIcon />
                  <div>
                    <strong>Tudo em ordem na operação do evento!</strong>
                    <p>Nenhuma pendência crítica ou ponto de atenção detectado neste momento.</p>
                  </div>
                </div>
              ) : (
                <div className="admin-alerts-list">
                  {overview.alerts.map((alert: AdminOverviewAlertDTO) => (
                    <div
                      key={alert.id}
                      className={`admin-alert-item admin-alert-item--${alert.type}`}
                    >
                      <div className="admin-alert-item__icon">
                        <AlertTriangleIcon />
                      </div>
                      <div className="admin-alert-item__content">
                        <strong className="admin-alert-item__title">{alert.title}</strong>
                        <p className="admin-alert-item__message">{alert.message}</p>
                      </div>
                      {alert.actionUrl && (
                        <div className="admin-alert-item__action">
                          <Link to={alert.actionUrl} className="admin-btn admin-btn--sm admin-btn--outline">
                            {alert.actionLabel || 'Ver'}
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ══════════════════════════════════════════════════════
                5. AÇÕES RÁPIDAS & ATALHOS
                ══════════════════════════════════════════════════════ */}
            <section className="admin-quick-actions" aria-label="Ações rápidas">
              <div className="admin-section-header">
                <div className="admin-section-header__title-wrap">
                  <span className="admin-section-icon">⚡</span>
                  <h2 className="admin-section-title">Ações Rápidas &amp; Módulos</h2>
                </div>
              </div>

              <div className="admin-actions-grid">
                {/* Ação 1: Gestão de Programação */}
                <Link to="/admin/content?tab=schedule" className="admin-action-card">
                  <div className="admin-action-card__header">
                    <span className="admin-action-card__icon">⏱️</span>
                    <span className="admin-action-card__tag">Disponível</span>
                  </div>
                  <strong className="admin-action-card__title">Programação da Celebração</strong>
                  <p className="admin-action-card__desc">
                    Linha do tempo de momentos, cerimônia, brinde e atrações sincronizadas com o EVENT_DAY.
                  </p>
                </Link>

                {/* Ação 2: Cardápio & Avisos */}
                <Link to="/admin/content?tab=menu" className="admin-action-card">
                  <div className="admin-action-card__header">
                    <span className="admin-action-card__icon">🍷</span>
                    <span className="admin-action-card__tag">Disponível</span>
                  </div>
                  <strong className="admin-action-card__title">Cardápio &amp; Avisos</strong>
                  <p className="admin-action-card__desc">
                    Gerenciamento das etapas gastronômicas da La Brace e comunicados aos convidados.
                  </p>
                </Link>

                {/* Ação 3: Moderação */}
                <Link to="/admin/media" className="admin-action-card">
                  <div className="admin-action-card__header">
                    <span className="admin-action-card__icon">📷</span>
                    <span className="admin-action-card__tag">Disponível</span>
                  </div>
                  <strong className="admin-action-card__title">Moderação de Fotos &amp; Vídeos</strong>
                  <p className="admin-action-card__desc">
                    Aprovar ou rejeitar mídias enviadas pelos convidados para exibição no telão.
                  </p>
                </Link>

                {/* Ação 4: Telão */}
                <a
                  href="/screen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-action-card"
                >
                  <div className="admin-action-card__header">
                    <span className="admin-action-card__icon">📺</span>
                    <span className="admin-action-card__tag">
                      Abrir <ExternalLinkIcon />
                    </span>
                  </div>
                  <strong className="admin-action-card__title">Telão do Evento (/screen)</strong>
                  <p className="admin-action-card__desc">
                    Abertura da superfície contínua de exibição projetada para o computador do telão.
                  </p>
                </a>

                {/* Ação 5: Gestão de Convidados */}
                <Link to="/admin/guests" className="admin-action-card">
                  <div className="admin-action-card__header">
                    <span className="admin-action-card__icon">👥</span>
                    <span className="admin-action-card__tag">Disponível</span>
                  </div>
                  <strong className="admin-action-card__title">Gestão de Convidados</strong>
                  <p className="admin-action-card__desc">
                    Cadastro de convites, gerenciamento de links personalizados e acompanhamento de RSVP.
                  </p>
                </Link>

                {/* Ação 6: Alocação de Mesas */}
                <Link to="/admin/tables" className="admin-action-card">
                  <div className="admin-action-card__header">
                    <span className="admin-action-card__icon">🍽️</span>
                    <span className="admin-action-card__tag">Disponível</span>
                  </div>
                  <strong className="admin-action-card__title">Alocação de Mesas</strong>
                  <p className="admin-action-card__desc">
                    Distribuição dos núcleos familiares e organização dos lugares na La Brace.
                  </p>
                </Link>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
};
