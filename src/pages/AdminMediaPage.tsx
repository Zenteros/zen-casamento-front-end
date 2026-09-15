import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type {
  AdminMediaItemDTO,
  AdminMediaCountsDTO,
  AdminPaginationDTO,
  AdminUserDTO,
} from '../contracts/index.js';
import { Monogram } from '../components/Monogram.js';
import { apiFetch, buildApiUrl } from '../lib/api.js';

const POLLING_INTERVAL_MS = 12000; // 12 segundos

/* ──────────────────────────────────────────────
   Icons
   ────────────────────────────────────────────── */
const CheckIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CrossIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const LogoutIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

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

export const AdminMediaPage: React.FC = () => {
  const navigate = useNavigate();

  const [adminUser, setAdminUser] = useState<AdminUserDTO | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Estados de dados
  const [items, setItems] = useState<AdminMediaItemDTO[]>([]);
  const [counts, setCounts] = useState<AdminMediaCountsDTO>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [pagination, setPagination] = useState<AdminPaginationDTO>({ page: 1, limit: 20, totalItems: 0, totalPages: 1 });

  // Estados de controle e UI
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PHOTO' | 'VIDEO'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Feedback e Modal
  const [feedback, setFeedback] = useState<{ id: string; message: string; previousStatus: string; item: AdminMediaItemDTO } | null>(null);
  const [activeModalItem, setActiveModalItem] = useState<AdminMediaItemDTO | null>(null);

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

  // 2. Buscar Mídias
  const fetchMedia = useCallback(async (isSilent = false) => {
    if (isPollingRef.current && isSilent) return;
    if (isSilent) isPollingRef.current = true;
    else setIsRefreshing(true);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      params.set('page', String(currentPage));
      params.set('limit', '20');

      const res = await apiFetch(`/api/v1/admin/media?${params.toString()}`, {
        method: 'GET',
      });

      if (res.status === 401) {
        navigate('/admin/login', { replace: true });
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setCounts(data.counts || { pending: 0, approved: 0, rejected: 0, total: 0 });
        setPagination(data.pagination || { page: 1, limit: 20, totalItems: 0, totalPages: 1 });
      }
    } catch {
      // Silencia erros transitórios de rede no polling
    } finally {
      if (isSilent) isPollingRef.current = false;
      else {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [statusFilter, typeFilter, currentPage, navigate]);

  // Efeito de busca ao alterar filtros
  useEffect(() => {
    if (!checkingAuth) {
      setLoading(true);
      fetchMedia(false);
    }
  }, [fetchMedia, checkingAuth]);

  // 3. Auto-polling inteligente (pausado quando a aba estiver oculta)
  useEffect(() => {
    if (checkingAuth) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchMedia(true);
      }
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchMedia, checkingAuth]);

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

  // 5. Moderação Editorial (Approve / Reject) com Optimistic UI
  const handleUpdateStatus = async (item: AdminMediaItemDTO, newStatus: 'APPROVED' | 'REJECTED') => {
    if (actionInProgressId === item.id) return;

    const previousStatus = item.status;
    setActionInProgressId(item.id);

    // Optimistic UI: atualizar lista local imediatamente
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, status: newStatus, reviewedAt: new Date().toISOString() } : i
      )
    );

    // Atualizar contadores otimisticamente
    setCounts((prev) => {
      const next = { ...prev };
      if (previousStatus === 'PENDING') next.pending = Math.max(0, next.pending - 1);
      if (previousStatus === 'APPROVED') next.approved = Math.max(0, next.approved - 1);
      if (previousStatus === 'REJECTED') next.rejected = Math.max(0, next.rejected - 1);

      if (newStatus === 'APPROVED') next.approved += 1;
      if (newStatus === 'REJECTED') next.rejected += 1;
      return next;
    });

    if (activeModalItem?.id === item.id) {
      setActiveModalItem({ ...activeModalItem, status: newStatus });
    }

    try {
      const res = await apiFetch(`/api/v1/admin/media/${item.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Falha ao atualizar status editorial.');
      }

      const message = newStatus === 'APPROVED' ? 'Aprovada para a celebração ❤️' : 'Registro ocultado da celebração';
      setFeedback({
        id: item.id,
        message,
        previousStatus,
        item: { ...item, status: newStatus },
      });

      // Fechar modal se aberto
      if (activeModalItem?.id === item.id) {
        setActiveModalItem(null);
      }

      setTimeout(() => {
        setFeedback((prev) => (prev?.id === item.id ? null : prev));
      }, 6000);
    } catch {
      // Reverter estado em caso de falha
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: previousStatus } : i))
      );
      await fetchMedia(true);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Reverter última ação através do feedback toast
  const handleUndo = async () => {
    if (!feedback) return;
    const { item, previousStatus } = feedback;
    setFeedback(null);
    if (previousStatus === 'APPROVED' || previousStatus === 'REJECTED') {
      await handleUpdateStatus(item, previousStatus);
    } else {
      // Se era PENDING, re-sincroniza com o servidor
      await fetchMedia(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (checkingAuth) {
    return (
      <div className="admin-loading-screen">
        <Monogram variant="pill" size="md" />
        <p className="admin-loading-text">Carregando painel de moderação...</p>
      </div>
    );
  }

  return (
    <div className="admin-page animate-fade-in">
      {/* ══════════════════════════════════════════════════════
          1. HEADER ADMINISTRATIVO
          ══════════════════════════════════════════════════════ */}
      <header className="admin-header">
        <div className="admin-header__container">
          <div className="admin-header__brand">
            <Monogram variant="pill" size="sm" />
            <div className="admin-header__titles">
              <span className="admin-header__tag">Painel dos Noivos</span>
              <h1 className="admin-header__title">Moderação de Fotos &amp; Vídeos</h1>
            </div>
          </div>

          <div className="admin-header__actions">
            <button
              type="button"
              className="admin-btn admin-btn--icon-only"
              onClick={() => fetchMedia(false)}
              disabled={isRefreshing}
              title="Atualizar fila"
              aria-label="Atualizar fila"
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
            <Link to="/admin" className="admin-subnav__tab">
              🏛️ Visão Geral
            </Link>
            <Link to="/admin/guests" className="admin-subnav__tab">
              👥 Convidados &amp; Convites
            </Link>
            <Link to="/admin/tables" className="admin-subnav__tab">
              🍽️ Mesas &amp; Alocação
            </Link>
            <Link to="/admin/media" className="admin-subnav__tab admin-subnav__tab--active">
              📷 Moderação de Fotos &amp; Vídeos
              {counts.pending > 0 && (
                <span className="admin-subnav__badge">{counts.pending}</span>
              )}
            </Link>
            <Link to="/admin/content" className="admin-subnav__tab">
              📋 Conteúdo do Evento
            </Link>
          </div>
        </div>

      </header>

      <main className="admin-main">
        {/* ══════════════════════════════════════════════════════
            2. BARRA DE CONTADORES EM TEMPO REAL
            ══════════════════════════════════════════════════════ */}
        <section className="admin-counters" aria-label="Contadores de moderação">
          <div
            className={`admin-counter-card ${statusFilter === 'PENDING' ? 'admin-counter-card--active' : ''}`}
            onClick={() => { setStatusFilter('PENDING'); setCurrentPage(1); }}
            role="button"
            tabIndex={0}
          >
            <span className="admin-counter-card__label">Pendentes</span>
            <strong className="admin-counter-card__value admin-counter-card__value--pending">
              {counts.pending}
            </strong>
          </div>

          <div
            className={`admin-counter-card ${statusFilter === 'APPROVED' ? 'admin-counter-card--active' : ''}`}
            onClick={() => { setStatusFilter('APPROVED'); setCurrentPage(1); }}
            role="button"
            tabIndex={0}
          >
            <span className="admin-counter-card__label">Aprovadas</span>
            <strong className="admin-counter-card__value admin-counter-card__value--approved">
              {counts.approved}
            </strong>
          </div>

          <div
            className={`admin-counter-card ${statusFilter === 'REJECTED' ? 'admin-counter-card--active' : ''}`}
            onClick={() => { setStatusFilter('REJECTED'); setCurrentPage(1); }}
            role="button"
            tabIndex={0}
          >
            <span className="admin-counter-card__label">Rejeitadas</span>
            <strong className="admin-counter-card__value admin-counter-card__value--rejected">
              {counts.rejected}
            </strong>
          </div>

          <div
            className={`admin-counter-card ${statusFilter === 'ALL' ? 'admin-counter-card--active' : ''}`}
            onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
            role="button"
            tabIndex={0}
          >
            <span className="admin-counter-card__label">Total Geral</span>
            <strong className="admin-counter-card__value">
              {counts.total}
            </strong>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            3. FILTROS E ABAS ÁGEIS
            ══════════════════════════════════════════════════════ */}
        <section className="admin-filters-bar">
          <div className="admin-tabs" role="tablist" aria-label="Filtro por status editorial">
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'PENDING'}
              className={`admin-tab ${statusFilter === 'PENDING' ? 'admin-tab--active' : ''}`}
              onClick={() => { setStatusFilter('PENDING'); setCurrentPage(1); }}
            >
              Pendentes ({counts.pending})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'APPROVED'}
              className={`admin-tab ${statusFilter === 'APPROVED' ? 'admin-tab--active' : ''}`}
              onClick={() => { setStatusFilter('APPROVED'); setCurrentPage(1); }}
            >
              Aprovadas ({counts.approved})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'REJECTED'}
              className={`admin-tab ${statusFilter === 'REJECTED' ? 'admin-tab--active' : ''}`}
              onClick={() => { setStatusFilter('REJECTED'); setCurrentPage(1); }}
            >
              Rejeitadas ({counts.rejected})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'ALL'}
              className={`admin-tab ${statusFilter === 'ALL' ? 'admin-tab--active' : ''}`}
              onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
            >
              Todas ({counts.total})
            </button>
          </div>

          <div className="admin-type-filters">
            <button
              type="button"
              className={`admin-type-btn ${typeFilter === 'ALL' ? 'admin-type-btn--active' : ''}`}
              onClick={() => { setTypeFilter('ALL'); setCurrentPage(1); }}
            >
              Todos
            </button>
            <button
              type="button"
              className={`admin-type-btn ${typeFilter === 'PHOTO' ? 'admin-type-btn--active' : ''}`}
              onClick={() => { setTypeFilter('PHOTO'); setCurrentPage(1); }}
            >
              📷 Fotos
            </button>
            <button
              type="button"
              className={`admin-type-btn ${typeFilter === 'VIDEO' ? 'admin-type-btn--active' : ''}`}
              onClick={() => { setTypeFilter('VIDEO'); setCurrentPage(1); }}
            >
              🎬 Vídeos
            </button>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            4. FEEDBACK TOAST FLUTUANTE COM UNDO
            ══════════════════════════════════════════════════════ */}
        {feedback && (
          <div className="admin-feedback-toast animate-slide-up" role="status">
            <span className="admin-feedback-toast__text">{feedback.message}</span>
            <button
              type="button"
              className="admin-feedback-toast__undo"
              onClick={handleUndo}
            >
              Desfazer
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            5. GRADE DE CARDS DE MÍDIA
            ══════════════════════════════════════════════════════ */}
        {loading && items.length === 0 ? (
          <div className="admin-empty-state">
            <span className="admin-spinner" aria-hidden="true" />
            <p>Carregando registros de mídia...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="admin-empty-state animate-fade-in">
            <div className="admin-empty-state__icon">✨</div>
            <h2 className="admin-empty-state__title">
              {statusFilter === 'PENDING'
                ? 'Nenhuma foto ou vídeo aguardando moderação!'
                : statusFilter === 'APPROVED'
                ? 'Nenhuma mídia aprovada ainda.'
                : statusFilter === 'REJECTED'
                ? 'Nenhuma mídia rejeitada.'
                : 'Nenhuma mídia encontrada.'}
            </h2>
            <p className="admin-empty-state__desc">
              {statusFilter === 'PENDING'
                ? 'Todos os envios dos convidados foram revisados. A fila está em dia.'
                : 'Utilize os filtros acima para navegar pelas outras categorias.'}
            </p>
          </div>
        ) : (
          <div className="admin-media-grid">
            {items.map((item) => {
              const isApproved = item.status === 'APPROVED';
              const isRejected = item.status === 'REJECTED';
              const isProcessingFailed = item.processingStatus === 'FAILED';
              const isProcessingUnsupported = item.processingStatus === 'UNSUPPORTED';
              const isActionRunning = actionInProgressId === item.id;


              return (
                <div
                  key={item.id}
                  className={`admin-media-card ${isApproved ? 'admin-media-card--approved' : isRejected ? 'admin-media-card--rejected' : ''}`}
                >
                  {/* Visualização de Mídia (Thumb WebP para Fotos / Card Informativo para Vídeos) */}
                  <div
                    className="admin-media-card__media-wrap"
                    onClick={() => item.type === 'PHOTO' && setActiveModalItem(item)}
                    role={item.type === 'PHOTO' ? 'button' : undefined}
                    tabIndex={item.type === 'PHOTO' ? 0 : undefined}
                    title={item.type === 'PHOTO' ? 'Clique para ampliar foto' : undefined}
                  >
                    {item.type === 'PHOTO' ? (
                      item.hasThumb ? (
                        <img
                          src={buildApiUrl(`/api/v1/admin/media/${item.id}/file?variant=thumb`)}
                          alt={item.originalFileName}
                          className="admin-media-card__thumb"
                          loading="lazy"
                        />
                      ) : (
                        <div className="admin-media-card__placeholder">
                          <span>📷 Foto</span>
                          <small>Sem miniatura</small>
                        </div>
                      )
                    ) : (
                      <div className="admin-media-card__video-placeholder">
                        <div className="admin-media-card__video-icon">🎬</div>
                        <span className="admin-media-card__video-tag">Vídeo Enviado</span>
                        <span className="admin-media-card__video-size">{formatFileSize(item.sizeBytes)}</span>
                      </div>
                    )}

                    {/* Badge de Tipo */}
                    <span className="admin-media-card__type-badge">
                      {item.type === 'PHOTO' ? '📷 Foto' : '🎬 Vídeo'}
                    </span>

                    {/* Badge de Status Técnico se houver atenção */}
                    {isProcessingFailed && (
                      <span className="admin-media-card__tech-badge admin-media-card__tech-badge--failed" title="Falha no processamento de derivados">
                        Processamento Falhou
                      </span>
                    )}
                    {isProcessingUnsupported && item.type === 'PHOTO' && (
                      <span className="admin-media-card__tech-badge admin-media-card__tech-badge--unsupported" title="Formato sem derivado automático">
                        Original Preservado
                      </span>
                    )}
                  </div>

                  {/* Metadados do Registro */}
                  <div className="admin-media-card__content">
                    <div className="admin-media-card__sender">
                      <strong className="admin-media-card__family">{item.familyTitle}</strong>
                      <span className="admin-media-card__time">
                        <ClockIcon /> {formatDateTime(item.uploadedAt)}
                      </span>
                    </div>

                    <div className="admin-media-card__meta">
                      <span className="admin-media-card__filename" title={item.originalFileName}>
                        {item.originalFileName}
                      </span>
                      <span className="admin-media-card__filesize">
                        {formatFileSize(item.sizeBytes)}
                        {item.width && item.height ? ` • ${item.width}x${item.height}` : ''}
                      </span>
                    </div>

                    {/* Status Editorial Badge */}
                    <div className="admin-media-card__status-row">
                      <span className={`admin-status-pill ${isApproved ? 'admin-status-pill--approved' : isRejected ? 'admin-status-pill--rejected' : 'admin-status-pill--pending'}`}>
                        {isApproved ? 'Aprovada' : isRejected ? 'Rejeitada' : 'Aguardando Aprovação'}
                      </span>
                    </div>

                    {/* Ações Rápidas em 1 Toque (Touch targets >= 48px) */}
                    <div className="admin-media-card__actions">
                      <button
                        type="button"
                        className={`admin-action-btn admin-action-btn--approve ${isApproved ? 'admin-action-btn--approve-active' : ''}`}
                        disabled={isActionRunning}
                        onClick={() => handleUpdateStatus(item, 'APPROVED')}
                        aria-label={`Aprovar mídia de ${item.familyTitle}`}
                      >
                        <CheckIcon />
                        <span>{isApproved ? 'Aprovada' : 'Aprovar'}</span>
                      </button>

                      <button
                        type="button"
                        className={`admin-action-btn admin-action-btn--reject ${isRejected ? 'admin-action-btn--reject-active' : ''}`}
                        disabled={isActionRunning}
                        onClick={() => handleUpdateStatus(item, 'REJECTED')}
                        aria-label={`Rejeitar mídia de ${item.familyTitle}`}
                      >
                        <CrossIcon />
                        <span>{isRejected ? 'Rejeitada' : 'Rejeitar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            6. PAGINAÇÃO SIMPLES
            ══════════════════════════════════════════════════════ */}
        {pagination.totalPages > 1 && (
          <div className="admin-pagination">
            <button
              type="button"
              className="admin-btn admin-btn--pagination"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              &larr; Anterior
            </button>

            <span className="admin-pagination__info">
              Página {pagination.page} de {pagination.totalPages} ({pagination.totalItems} mídias)
            </span>

            <button
              type="button"
              className="admin-btn admin-btn--pagination"
              disabled={currentPage >= pagination.totalPages || loading}
              onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
            >
              Próxima &rarr;
            </button>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════
          7. MODAL DE VISUALIZAÇÃO AMPLIADA (DISPLAY WEBP SANITIZADO)
          ══════════════════════════════════════════════════════ */}
      {activeModalItem && (
        <div
          className="admin-modal-backdrop animate-fade-in"
          onClick={() => setActiveModalItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div className="admin-modal-header__info">
                <h3 className="admin-modal-title">{activeModalItem.familyTitle}</h3>
                <span className="admin-modal-meta">
                  {formatDateTime(activeModalItem.uploadedAt)} &bull; {activeModalItem.originalFileName}
                </span>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setActiveModalItem(null)}
                aria-label="Fechar visualização"
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-image-wrap">
              <img
                src={buildApiUrl(`/api/v1/admin/media/${activeModalItem.id}/file?variant=display`)}
                alt={activeModalItem.originalFileName}
                className="admin-modal-img"
              />
            </div>

            <div className="admin-modal-footer">
              <div className="admin-modal-footer__status">
                <span className={`admin-status-pill ${activeModalItem.status === 'APPROVED' ? 'admin-status-pill--approved' : activeModalItem.status === 'REJECTED' ? 'admin-status-pill--rejected' : 'admin-status-pill--pending'}`}>
                  Status: {activeModalItem.status === 'APPROVED' ? 'Aprovada' : activeModalItem.status === 'REJECTED' ? 'Rejeitada' : 'Pendente'}
                </span>
              </div>

              <div className="admin-modal-footer__actions">
                <button
                  type="button"
                  className="admin-action-btn admin-action-btn--approve"
                  onClick={() => handleUpdateStatus(activeModalItem, 'APPROVED')}
                >
                  <CheckIcon />
                  <span>Aprovar para o Telão</span>
                </button>

                <button
                  type="button"
                  className="admin-action-btn admin-action-btn--reject"
                  onClick={() => handleUpdateStatus(activeModalItem, 'REJECTED')}
                >
                  <CrossIcon />
                  <span>Rejeitar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
