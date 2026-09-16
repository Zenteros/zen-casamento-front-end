import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type {
  AdminTableItemDTO,
  AdminTableCountsDTO,
  AdminTableGuestSummaryDTO,
  AdminTableListResponseDTO,
  AdminUserDTO,
} from '../contracts/index.js';
import { Monogram } from '../components/Monogram.js';
import { apiFetch } from '../lib/api.js';
import { AdminModal } from '../components/admin/AdminModal.js';
import { GuestSearchCombobox } from '../components/admin/GuestSearchCombobox.js';

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
    style={{ animation: spinning ? 'admin-spin 0.8s linear infinite' : 'none' }}
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

const PlusIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SearchIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const EditIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const MoveIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </svg>
);

const RemoveIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const UsersIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const AdminTablesPage: React.FC = () => {
  const navigate = useNavigate();

  const [adminUser, setAdminUser] = useState<AdminUserDTO | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Estados de dados
  const [tables, setTables] = useState<AdminTableItemDTO[]>([]);
  const [counts, setCounts] = useState<AdminTableCountsDTO>({
    totalTables: 0,
    totalSeats: 0,
    occupiedSeats: 0,
    availableSeats: 0,
    fullTables: 0,
    tablesWithAvailableSeats: 0,
    emptyTables: 0,
    withoutTableGuests: 0,
  });
  const [unassignedGuests, setUnassignedGuests] = useState<AdminTableGuestSummaryDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(new Date());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtros e Busca
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tableFilter, setTableFilter] = useState<'ALL' | 'AVAILABLE' | 'FULL' | 'EMPTY'>('ALL');
  const [unassignedFilter, setUnassignedFilter] = useState<'ALL' | 'CONFIRMED' | 'CHILDREN' | 'PENDING'>('ALL');

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createCapacity, setCreateCapacity] = useState('8');
  const [createLocationHint, setCreateLocationHint] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingTable, setEditingTable] = useState<AdminTableItemDTO | null>(null);
  const [editName, setEditName] = useState('');
  const [editCapacity, setEditCapacity] = useState('8');
  const [editLocationHint, setEditLocationHint] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Modal de Alocação de Convidado / Família
  const [allocatingGuest, setAllocatingGuest] = useState<AdminTableGuestSummaryDTO | null>(null);
  const [selectedTargetTableId, setSelectedTargetTableId] = useState<string>('');
  const [isAllocatingFamily, setIsAllocatingFamily] = useState<boolean>(false);
  const [isSubmittingAllocation, setIsSubmittingAllocation] = useState<boolean>(false);
  const [allocationError, setAllocationError] = useState<string | null>(null);

  // Modal para adicionar convidado específico a uma mesa diretamente
  const [tableToAddGuest, setTableToAddGuest] = useState<AdminTableItemDTO | null>(null);
  const [selectedUnassignedGuestId, setSelectedUnassignedGuestId] = useState<string>('');

  const isPollingRef = useRef<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

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

  // 2. Buscar Lista de Mesas e Convidados Sem Mesa
  const fetchTables = useCallback(async (isSilent = false) => {
    if (isPollingRef.current && isSilent) return;
    if (isSilent) isPollingRef.current = true;
    else setIsRefreshing(true);

    try {
      const res = await apiFetch('/api/v1/admin/tables', {
        method: 'GET',
      });

      if (res.status === 401) {
        navigate('/admin/login', { replace: true });
        return;
      }

      if (res.ok) {
        const data: AdminTableListResponseDTO = await res.json();
        setTables(data.tables);
        setCounts(data.counts);
        setUnassignedGuests(data.unassignedGuests);
        setLastUpdatedAt(new Date());
        setErrorMessage(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(errData.error || 'Falha ao carregar mesas.');
      }
    } catch {
      if (!isSilent) {
        setErrorMessage('Erro de conexão ao carregar gestão de mesas.');
      }
    } finally {
      if (isSilent) isPollingRef.current = false;
      else {
        setIsRefreshing(false);
        setLoading(false);
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (!checkingAuth) {
      setLoading(true);
      fetchTables(false);
    }
  }, [fetchTables, checkingAuth]);

  // 3. Auto-polling suave
  useEffect(() => {
    if (checkingAuth) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchTables(true);
      }
    }, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchTables, checkingAuth]);

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

  // 5. Cadastrar Nova Mesa
  const handleOpenCreateModal = () => {
    setCreateName(`Mesa ${(tables.length + 1).toString().padStart(2, '0')}`);
    setCreateCapacity('8');
    setCreateLocationHint('');
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const capacityNum = parseInt(createCapacity, 10);
    if (!createName.trim()) {
      setCreateError('O nome da mesa é obrigatório.');
      return;
    }
    if (isNaN(capacityNum) || capacityNum <= 0 || capacityNum > 50) {
      setCreateError('A capacidade deve ser um número entre 1 e 50 lugares.');
      return;
    }

    setIsSubmittingCreate(true);
    setCreateError(null);

    try {
      const res = await apiFetch('/api/v1/admin/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          capacity: capacityNum,
          locationHint: createLocationHint.trim() || null,
          sortOrder: tables.length + 1,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao cadastrar mesa.');
      }

      showToast(`Mesa "${createName.trim()}" cadastrada com sucesso! 🎉`);
      setIsCreateModalOpen(false);
      fetchTables(false);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Erro ao processar cadastro.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // 6. Editar Mesa
  const handleOpenEditModal = (table: AdminTableItemDTO) => {
    setEditingTable(table);
    setEditName(table.name);
    setEditCapacity(table.capacity.toString());
    setEditLocationHint(table.locationHint || '');
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;

    const capacityNum = parseInt(editCapacity, 10);
    if (!editName.trim()) {
      setEditError('O nome da mesa é obrigatório.');
      return;
    }
    if (isNaN(capacityNum) || capacityNum <= 0 || capacityNum > 50) {
      setEditError('A capacidade deve ser um número entre 1 e 50 lugares.');
      return;
    }
    if (capacityNum < editingTable.occupied) {
      setEditError(`A capacidade não pode ser menor que a ocupação atual (${editingTable.occupied} convidados). Desaloque convidados antes de reduzir.`);
      return;
    }

    setIsSubmittingEdit(true);
    setEditError(null);

    try {
      const res = await apiFetch(`/api/v1/admin/tables/${editingTable.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          capacity: capacityNum,
          locationHint: editLocationHint.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao atualizar mesa.');
      }

      showToast(`Mesa "${editName.trim()}" atualizada! ✨`);
      setEditingTable(null);
      fetchTables(false);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Erro ao processar edição.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // 7. Alocar / Mover Convidado Individualmente
  const handleOpenAllocateModal = (guest: AdminTableGuestSummaryDTO, defaultTableId = '') => {
    setAllocatingGuest(guest);
    setSelectedTargetTableId(defaultTableId);
    setIsAllocatingFamily(false);
    setAllocationError(null);
  };

  const handleOpenAllocateFamilyModal = (guest: AdminTableGuestSummaryDTO) => {
    setAllocatingGuest(guest);
    setSelectedTargetTableId('');
    setIsAllocatingFamily(true);
    setAllocationError(null);
  };

  const handleConfirmAllocation = async () => {
    if (!allocatingGuest || !selectedTargetTableId) {
      setAllocationError('Selecione uma mesa de destino.');
      return;
    }

    setIsSubmittingAllocation(true);
    setAllocationError(null);

    try {
      if (isAllocatingFamily) {
        // Alocação da família inteira
        const res = await apiFetch(`/api/v1/admin/invites/${allocatingGuest.inviteId}/assign-table`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableId: selectedTargetTableId }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Erro ao alocar família.');
        }

        const data = await res.json();
        showToast(`Família "${allocatingGuest.familyTitle}" alocada na mesa "${data.tableName}"! 🥂`);
      } else {
        // Alocação individual
        const res = await apiFetch(`/api/v1/admin/guests/${allocatingGuest.id}/table`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableId: selectedTargetTableId }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Erro ao alocar convidado.');
        }

        const data = await res.json();
        showToast(`Convidado "${allocatingGuest.name}" alocado na mesa "${data.tableName}"! ✨`);
      }

      setAllocatingGuest(null);
      fetchTables(false);
    } catch (err: unknown) {
      setAllocationError(err instanceof Error ? err.message : 'Erro ao processar alocação.');
    } finally {
      setIsSubmittingAllocation(false);
    }
  };

  // 8. Remover Convidado de Mesa (tableId: null)
  const handleRemoveGuestFromTable = async (guest: AdminTableGuestSummaryDTO, tableName: string) => {
    try {
      const res = await apiFetch(`/api/v1/admin/guests/${guest.id}/table`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: null }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao remover convidado da mesa.');
      }

      showToast(`"${guest.name}" removido da mesa "${tableName}".`);
      fetchTables(false);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao remover da mesa.');
    }
  };

  // 9. Adicionar Convidado Sem Mesa diretamente a partir do card da mesa
  const handleOpenAddGuestToTableModal = (table: AdminTableItemDTO) => {
    setTableToAddGuest(table);
    setSelectedUnassignedGuestId('');
  };

  const handleConfirmAddGuestToTable = async () => {
    if (!tableToAddGuest || !selectedUnassignedGuestId) return;

    try {
      const res = await apiFetch(`/api/v1/admin/guests/${selectedUnassignedGuestId}/table`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: tableToAddGuest.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao alocar na mesa.');
      }

      showToast(`Convidado adicionado à mesa "${tableToAddGuest.name}"!`);
      setTableToAddGuest(null);
      fetchTables(false);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao alocar.');
    }
  };

  // Convidados elegíveis sem mesa (exclui quem recusou presença)
  const eligibleUnassignedGuests = useMemo(() => {
    return unassignedGuests.filter((g) => g.rsvpStatus !== 'DECLINED');
  }, [unassignedGuests]);

  // Filtros computados de mesas
  const filteredTables = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return tables.filter((t) => {
      // 1. Filtro por status
      if (tableFilter === 'AVAILABLE' && t.available === 0) return false;
      if (tableFilter === 'FULL' && !t.isFull) return false;
      if (tableFilter === 'EMPTY' && t.occupied > 0) return false;

      // 2. Busca por texto
      if (!q) return true;
      const matchName = t.name.toLowerCase().includes(q);
      const matchLocation = t.locationHint?.toLowerCase().includes(q) || false;
      const matchGuest = t.guests.some(
        (g) => g.name.toLowerCase().includes(q) || g.familyTitle.toLowerCase().includes(q)
      );
      return matchName || matchLocation || matchGuest;
    });
  }, [tables, tableFilter, searchTerm]);

  // Filtros computados de convidados sem mesa (apenas elegíveis)
  const filteredUnassignedGuests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return eligibleUnassignedGuests.filter((g) => {
      if (unassignedFilter === 'CONFIRMED' && g.rsvpStatus !== 'CONFIRMED') return false;
      if (unassignedFilter === 'CHILDREN' && !g.isChild) return false;
      if (unassignedFilter === 'PENDING' && g.rsvpStatus !== 'PENDING') return false;

      if (!q) return true;
      return g.name.toLowerCase().includes(q) || g.familyTitle.toLowerCase().includes(q);
    });
  }, [eligibleUnassignedGuests, unassignedFilter, searchTerm]);

  const formatTimeOnly = (date: Date) => {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return '';
    }
  };

  const renderRsvpBadge = (status: string) => {
    if (status === 'CONFIRMED') {
      return <span className="admin-guest-tag admin-guest-tag--confirmed">Confirmado</span>;
    }
    if (status === 'DECLINED') {
      return <span className="admin-guest-tag admin-guest-tag--declined" title="Este convidado recusou presença">Recusou</span>;
    }
    return <span className="admin-guest-tag admin-guest-tag--pending">Pendente</span>;
  };

  if (checkingAuth) {
    return (
      <div className="admin-loading-screen">
        <Monogram variant="pill" size="md" />
        <p className="admin-loading-text">Carregando gestão de mesas...</p>
      </div>
    );
  }

  return (
    <div className="admin-page animate-fade-in">
      {/* ── Toast de Feedback ── */}
      {toastMessage && (
        <div className="admin-toast animate-fade-in" role="status">
          <span>{toastMessage}</span>
        </div>
      )}

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
                <span className="admin-badge admin-badge--staging">Recepção La Brace</span>
              </div>
              <h1 className="admin-header__title">Gestão &amp; Alocação de Mesas</h1>
            </div>
          </div>

          <div className="admin-header__actions">
            <span className="admin-header__last-update" title="Última sincronização de dados">
              Atualizado às {formatTimeOnly(lastUpdatedAt)}
            </span>

            <button
              type="button"
              className="admin-btn admin-btn--icon-only"
              onClick={() => fetchTables(false)}
              disabled={isRefreshing}
              title="Atualizar lista agora"
              aria-label="Atualizar lista"
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
            <Link to="/admin/tables" className="admin-subnav__tab admin-subnav__tab--active">
              🍽️ Mesas &amp; Alocação
            </Link>
            <Link to="/admin/media" className="admin-subnav__tab">
              📷 Moderação de Fotos &amp; Vídeos
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

        {/* ══════════════════════════════════════════════════════
            2. BARRA DE ESTATÍSTICAS RÁPIDAS
            ══════════════════════════════════════════════════════ */}
        <section className="admin-stats-bar" aria-label="Resumo de capacidade e ocupação">
          <div className="admin-stat-box">
            <span className="admin-stat-box__label">Total de Mesas</span>
            <strong className="admin-stat-box__val">{counts.totalTables}</strong>
          </div>
          <div className="admin-stat-box">
            <span className="admin-stat-box__label">Lugares Totais</span>
            <strong className="admin-stat-box__val">{counts.totalSeats}</strong>
          </div>
          <div className="admin-stat-box admin-stat-box--terracotta">
            <span className="admin-stat-box__label">Ocupados</span>
            <strong className="admin-stat-box__val">{counts.occupiedSeats}</strong>
          </div>
          <div className="admin-stat-box admin-stat-box--confirmed">
            <span className="admin-stat-box__label">Lugares Livres</span>
            <strong className="admin-stat-box__val">{counts.availableSeats}</strong>
          </div>
          <div className="admin-stat-box">
            <span className="admin-stat-box__label">Mesas Lotadas</span>
            <strong className="admin-stat-box__val">{counts.fullTables}</strong>
          </div>
          <div className="admin-stat-box">
            <span className="admin-stat-box__label">Mesas c/ Vagas</span>
            <strong className="admin-stat-box__val">{counts.tablesWithAvailableSeats}</strong>
          </div>
          <div className="admin-stat-box admin-stat-box--pending">
            <span className="admin-stat-box__label">Sem Mesa</span>
            <strong className="admin-stat-box__val">{counts.withoutTableGuests}</strong>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            3. BARRA DE CONTROLE & BUSCA
            ══════════════════════════════════════════════════════ */}
        <div className="admin-guests-toolbar">
          <div className="admin-search-wrap">
            <span className="admin-search-icon">
              <SearchIcon />
            </span>
            <input
              type="text"
              className="admin-search-input"
              placeholder="Buscar mesa, convidado ou família..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar mesas ou convidados"
            />
            {searchTerm && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => setSearchTerm('')}
                title="Limpar busca"
                aria-label="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>

          <div className="admin-filter-group" role="group" aria-label="Filtro de mesas">
            <div className="admin-pill-filters">
              <button
                type="button"
                className={`admin-filter-pill ${tableFilter === 'ALL' ? 'admin-filter-pill--active' : ''}`}
                onClick={() => setTableFilter('ALL')}
              >
                Todas ({tables.length})
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${tableFilter === 'AVAILABLE' ? 'admin-filter-pill--active' : ''}`}
                onClick={() => setTableFilter('AVAILABLE')}
              >
                Com Vagas ({counts.tablesWithAvailableSeats})
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${tableFilter === 'FULL' ? 'admin-filter-pill--active' : ''}`}
                onClick={() => setTableFilter('FULL')}
              >
                Lotadas ({counts.fullTables})
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${tableFilter === 'EMPTY' ? 'admin-filter-pill--active' : ''}`}
                onClick={() => setTableFilter('EMPTY')}
              >
                Vazias ({counts.emptyTables})
              </button>
            </div>
          </div>

          <div>
            <button
              type="button"
              className="admin-btn admin-btn--primary admin-guests-new-btn"
              onClick={handleOpenCreateModal}
            >
              <PlusIcon />
              <span>Cadastrar Nova Mesa</span>
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            4. LAYOUT DUAL: CONVIDADOS SEM MESA & GRADE DE MESAS
            ══════════════════════════════════════════════════════ */}
        <div className="admin-tables-dual-layout">
          {/* ── COLUNA ESQUERDA: CONVIDADOS SEM MESA ── */}
          <aside className="admin-unassigned-panel" aria-label="Convidados sem mesa">
            <div className="admin-unassigned-header">
              <div className="admin-unassigned-title-wrap">
                <span className="admin-unassigned-icon">⚠️</span>
                <h2 className="admin-unassigned-title">Sem Mesa</h2>
                <span className="admin-unassigned-badge">{unassignedGuests.length}</span>
              </div>
              <span className="admin-unassigned-subtitle">
                Convidados aguardando alocação
              </span>
            </div>

            {/* Filtros rápidos dos desvinculados */}
            <div className="admin-unassigned-filters">
              <button
                type="button"
                className={`admin-unassigned-filter-btn ${unassignedFilter === 'ALL' ? 'admin-unassigned-filter-btn--active' : ''}`}
                onClick={() => setUnassignedFilter('ALL')}
              >
                Todos ({unassignedGuests.length})
              </button>
              <button
                type="button"
                className={`admin-unassigned-filter-btn ${unassignedFilter === 'CONFIRMED' ? 'admin-unassigned-filter-btn--active' : ''}`}
                onClick={() => setUnassignedFilter('CONFIRMED')}
              >
                Confirmados
              </button>
              <button
                type="button"
                className={`admin-unassigned-filter-btn ${unassignedFilter === 'CHILDREN' ? 'admin-unassigned-filter-btn--active' : ''}`}
                onClick={() => setUnassignedFilter('CHILDREN')}
              >
                Crianças
              </button>
            </div>

            {/* Lista de convidados sem mesa */}
            <div className="admin-unassigned-list">
              {filteredUnassignedGuests.length === 0 ? (
                <div className="admin-unassigned-empty">
                  {unassignedGuests.length === 0 ? (
                    <p>🎉 Todos os convidados cadastrados já possuem mesa atribuída!</p>
                  ) : (
                    <p>Nenhum convidado sem mesa para o filtro selecionado.</p>
                  )}
                </div>
              ) : (
                filteredUnassignedGuests.map((guest) => (
                  <div key={guest.id} className="admin-unassigned-card">
                    <div className="admin-unassigned-card__info">
                      <div className="admin-unassigned-card__name-row">
                        <strong className="admin-unassigned-card__name">{guest.name}</strong>
                        {guest.isChild && (
                          <span className="admin-badge admin-badge--child">Criança</span>
                        )}
                      </div>
                      <span className="admin-unassigned-card__family">{guest.familyTitle}</span>
                      <div className="admin-unassigned-card__tags">
                        {renderRsvpBadge(guest.rsvpStatus)}
                        {guest.isCheckedIn ? (
                          <span className="admin-tag-sub admin-tag-sub--present">Presente</span>
                        ) : (
                          <span className="admin-tag-sub">Aguardando</span>
                        )}
                        {guest.dietaryRestrictions && (
                          <span className="admin-tag-sub admin-tag-sub--dietary" title={guest.dietaryRestrictions}>
                            {guest.dietaryRestrictions}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="admin-unassigned-card__actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn--sm admin-btn--primary"
                        onClick={() => handleOpenAllocateModal(guest)}
                        title="Alocar este convidado em uma mesa"
                      >
                        Alocar
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--sm admin-btn--outline"
                        onClick={() => handleOpenAllocateFamilyModal(guest)}
                        title="Alocar todos os membros da família nesta mesa"
                      >
                        <UsersIcon /> Família
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* ── COLUNA DIREITA: GRADE DE MESAS ── */}
          <section className="admin-tables-main" aria-label="Mesas da recepção">
            {loading && tables.length === 0 ? (
              <div className="admin-empty-state">
                <span className="admin-spinner" aria-hidden="true" />
                <p>Carregando mesas da recepção...</p>
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="admin-empty-state">
                <p>Nenhuma mesa encontrada para o filtro ou busca informada.</p>
              </div>
            ) : (
              <div className="admin-tables-grid">
                {filteredTables.map((table) => {
                  const percent = Math.min(100, Math.round((table.occupied / table.capacity) * 100));

                  return (
                    <div
                      key={table.id}
                      className={`admin-table-card ${table.isFull ? 'admin-table-card--full' : ''}`}
                    >
                      {/* Cabeçalho do Card */}
                      <div className="admin-table-card__header">
                        <div className="admin-table-card__title-group">
                          <h3 className="admin-table-card__title">{table.name}</h3>
                          {table.locationHint && (
                            <span className="admin-table-card__location">
                              📍 {table.locationHint}
                            </span>
                          )}
                        </div>

                        <div className="admin-table-card__header-actions">
                          <button
                            type="button"
                            className="admin-btn admin-btn--icon-sm"
                            onClick={() => handleOpenEditModal(table)}
                            title="Editar nome e capacidade da mesa"
                            aria-label="Editar mesa"
                          >
                            <EditIcon />
                          </button>
                        </div>
                      </div>

                      {/* Indicador e Barra de Capacidade */}
                      <div className="admin-table-capacity-wrap">
                        <div className="admin-table-capacity-labels">
                          <span className="admin-table-capacity-status">
                            {table.isFull ? (
                              <strong className="admin-text-terracotta">Lotada • {table.occupied}/{table.capacity}</strong>
                            ) : table.occupied === 0 ? (
                              <span>Vazia • 0/{table.capacity} lugares</span>
                            ) : (
                              <span>
                                <strong>{table.occupied}</strong> de {table.capacity} lugares &bull;{' '}
                                <strong className="admin-split-stat__value--green">{table.available} vagas</strong>
                              </span>
                            )}
                          </span>
                          <span className="admin-table-capacity-percent">{percent}%</span>
                        </div>

                        <div className="admin-table-progress-bar">
                          <div
                            className={`admin-table-progress-fill ${table.isFull ? 'admin-table-progress-fill--full' : ''}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Lista de Convidados da Mesa */}
                      <div className="admin-table-guests-section">
                        <span className="admin-table-guests-title">
                          Convidados ({table.guests.length}):
                        </span>

                        {table.guests.length === 0 ? (
                          <div className="admin-table-guests-empty">
                            <span>Mesa vazia. Adicione convidados abaixo.</span>
                          </div>
                        ) : (
                          <ul className="admin-table-guests-list">
                            {table.guests.map((guest) => (
                              <li key={guest.id} className="admin-table-guest-item">
                                <div className="admin-table-guest-info">
                                  <div className="admin-table-guest-name-row">
                                    <strong className="admin-table-guest-name">{guest.name}</strong>
                                    {guest.isChild && (
                                      <span className="admin-badge admin-badge--child">Criança</span>
                                    )}
                                  </div>
                                  <span className="admin-table-guest-family">{guest.familyTitle}</span>
                                  <div className="admin-table-guest-tags">
                                    {renderRsvpBadge(guest.rsvpStatus)}
                                    {guest.isCheckedIn ? (
                                      <span className="admin-tag-sub admin-tag-sub--present">Presente</span>
                                    ) : (
                                      <span className="admin-tag-sub">Aguardando</span>
                                    )}
                                    {guest.dietaryRestrictions && (
                                      <span className="admin-tag-sub admin-tag-sub--dietary" title={guest.dietaryRestrictions}>
                                        {guest.dietaryRestrictions}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="admin-table-guest-actions">
                                  <button
                                    type="button"
                                    className="admin-btn admin-btn--icon-sm"
                                    onClick={() => handleOpenAllocateModal(guest, table.id)}
                                    title="Mover para outra mesa"
                                    aria-label="Mover de mesa"
                                  >
                                    <MoveIcon />
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-btn admin-btn--icon-sm admin-btn--danger-sm"
                                    onClick={() => handleRemoveGuestFromTable(guest, table.name)}
                                    title="Remover convidado desta mesa"
                                    aria-label="Remover da mesa"
                                  >
                                    <RemoveIcon />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Ações Rápidas no Rodapé da Mesa */}
                      <div className="admin-table-card__footer">
                        <button
                          type="button"
                          className="admin-btn admin-btn--sm admin-btn--outline admin-btn--full-width"
                          onClick={() => handleOpenAddGuestToTableModal(table)}
                          disabled={table.isFull || eligibleUnassignedGuests.length === 0}
                          title={
                            table.isFull
                              ? 'Mesa lotada'
                              : eligibleUnassignedGuests.length === 0
                              ? 'Nenhum convidado sem mesa elegível'
                              : 'Adicionar convidado sem mesa nesta mesa'
                          }
                        >
                          <PlusIcon /> Adicionar Convidado
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ══════════════════════════════════════════════════════
            MODAL 1: CADASTRAR NOVA MESA
            ══════════════════════════════════════════════════════ */}
        <AdminModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Cadastrar Nova Mesa"
          meta="Adicionar mesa à Casa de Eventos La Brace"
          size="md"
        >
          <form onSubmit={handleCreateSubmit} className="admin-modal-scrollable-content">
            <div className="admin-modal-body">
              {createError && (
                <div className="admin-alert admin-alert--error" role="alert">
                  <span>{createError}</span>
                </div>
              )}

              <div className="admin-form-group">
                <label htmlFor="create-table-name" className="admin-label">
                  Nome / Número da Mesa *
                </label>
                <input
                  id="create-table-name"
                  type="text"
                  className="admin-input"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Ex: Mesa 08 - Família Silva"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="create-table-capacity" className="admin-label">
                  Capacidade Total (Lugares) *
                </label>
                <input
                  id="create-table-capacity"
                  type="number"
                  min="1"
                  max="50"
                  className="admin-input"
                  value={createCapacity}
                  onChange={(e) => setCreateCapacity(e.target.value)}
                  required
                />
                <span className="admin-input-hint">Padrão de 8 a 10 lugares por mesa na La Brace.</span>
              </div>

              <div className="admin-form-group">
                <label htmlFor="create-table-location" className="admin-label">
                  Dica de Localização no Salão (Opcional)
                </label>
                <input
                  id="create-table-location"
                  type="text"
                  className="admin-input"
                  value={createLocationHint}
                  onChange={(e) => setCreateLocationHint(e.target.value)}
                  placeholder="Ex: Lateral direita, próximo ao jardim"
                />
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn--outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmittingCreate}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn--primary"
                disabled={isSubmittingCreate}
              >
                {isSubmittingCreate ? 'Salvando...' : 'Criar Mesa'}
              </button>
            </div>
          </form>
        </AdminModal>

        {/* ══════════════════════════════════════════════════════
            MODAL 2: EDITAR MESA
            ══════════════════════════════════════════════════════ */}
        <AdminModal
          isOpen={!!editingTable}
          onClose={() => setEditingTable(null)}
          title="Editar Mesa"
          meta="Alterar nome, capacidade ou localização"
          size="md"
        >
          {editingTable && (
            <form onSubmit={handleEditSubmit} className="admin-modal-scrollable-content">
              <div className="admin-modal-body">
                {editError && (
                  <div className="admin-alert admin-alert--error" role="alert">
                    <span>{editError}</span>
                  </div>
                )}

                <div className="admin-form-group">
                  <label htmlFor="edit-table-name" className="admin-label">
                    Nome / Número da Mesa *
                  </label>
                  <input
                    id="edit-table-name"
                    type="text"
                    className="admin-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="edit-table-capacity" className="admin-label">
                    Capacidade Total (Lugares) *
                  </label>
                  <input
                    id="edit-table-capacity"
                    type="number"
                    min="1"
                    max="50"
                    className="admin-input"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    required
                  />
                  <span className="admin-input-hint">
                    Ocupação atual: <strong>{editingTable.occupied} convidados</strong>. A capacidade não pode ser menor que a ocupação.
                  </span>
                </div>

                <div className="admin-form-group">
                  <label htmlFor="edit-table-location" className="admin-label">
                    Dica de Localização no Salão (Opcional)
                  </label>
                  <input
                    id="edit-table-location"
                    type="text"
                    className="admin-input"
                    value={editLocationHint}
                    onChange={(e) => setEditLocationHint(e.target.value)}
                    placeholder="Ex: Lateral direita, próximo ao jardim"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn--outline"
                  onClick={() => setEditingTable(null)}
                  disabled={isSubmittingEdit}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={isSubmittingEdit}
                >
                  {isSubmittingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          )}
        </AdminModal>

        {/* ══════════════════════════════════════════════════════
            MODAL 3: ALOCAR / MOVER CONVIDADO OU FAMÍLIA
            ══════════════════════════════════════════════════════ */}
        <AdminModal
          isOpen={!!allocatingGuest}
          onClose={() => setAllocatingGuest(null)}
          title={isAllocatingFamily ? 'Alocar Família em Mesa' : 'Alocar Convidado em Mesa'}
          meta={
            isAllocatingFamily
              ? 'Definir mesa para todos os integrantes elegíveis do convite'
              : 'Definir ou alterar a mesa do convidado'
          }
          size="md"
        >
          {allocatingGuest && (
            <div className="admin-modal-scrollable-content">
              <div className="admin-modal-body">
                {allocationError && (
                  <div className="admin-alert admin-alert--error" role="alert">
                    <span>{allocationError}</span>
                  </div>
                )}

                <div className="admin-allocation-target-info">
                  {isAllocatingFamily ? (
                    <div>
                      <span className="admin-label">Família / Convite:</span>
                      <strong className="admin-target-name">{allocatingGuest.familyTitle}</strong>
                      <p className="admin-allocation-note">
                        Esta ação alocará os membros elegíveis deste convite na mesa selecionada.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="admin-label">Convidado:</span>
                      <strong className="admin-target-name">{allocatingGuest.name}</strong>
                      <span className="admin-target-sub">{allocatingGuest.familyTitle}</span>
                    </div>
                  )}
                </div>

                <div className="admin-form-group">
                  <label htmlFor="target-table-select" className="admin-label">
                    Selecione a Mesa de Destino *
                  </label>
                  <select
                    id="target-table-select"
                    className="admin-select"
                    value={selectedTargetTableId}
                    onChange={(e) => setSelectedTargetTableId(e.target.value)}
                  >
                    <option value="">-- Escolha uma mesa --</option>
                    {tables.map((t) => (
                      <option
                        key={t.id}
                        value={t.id}
                        disabled={t.available === 0}
                      >
                        {t.name} ({t.occupied}/{t.capacity} lugares &bull; {t.available} {t.available === 1 ? 'vaga livre' : 'vagas livres'})
                        {t.locationHint ? ` - ${t.locationHint}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn--outline"
                  onClick={() => setAllocatingGuest(null)}
                  disabled={isSubmittingAllocation}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  onClick={handleConfirmAllocation}
                  disabled={!selectedTargetTableId || isSubmittingAllocation}
                >
                  {isSubmittingAllocation ? 'Alocando...' : 'Confirmar Alocação'}
                </button>
              </div>
            </div>
          )}
        </AdminModal>

        {/* ══════════════════════════════════════════════════════
            MODAL 4: ADICIONAR CONVIDADO DIRETAMENTE À MESA
            ══════════════════════════════════════════════════════ */}
        <AdminModal
          isOpen={!!tableToAddGuest}
          onClose={() => setTableToAddGuest(null)}
          title={tableToAddGuest ? `Adicionar à ${tableToAddGuest.name}` : 'Adicionar Convidado'}
          meta={
            tableToAddGuest
              ? `Capacidade: ${tableToAddGuest.occupied}/${tableToAddGuest.capacity} lugares • ${tableToAddGuest.available} ${tableToAddGuest.available === 1 ? 'vaga livre' : 'vagas livres'}`
              : undefined
          }
          size="md"
        >
          {tableToAddGuest && (
            <div className="admin-modal-scrollable-content">
              <div className="admin-modal-body">
                {eligibleUnassignedGuests.length === 0 ? (
                  <div className="admin-alert admin-alert--info" role="status">
                    <span>Não há convidados elegíveis aguardando mesa.</span>
                  </div>
                ) : (
                  <div className="admin-form-group">
                    <label className="admin-label">
                      Buscar ou selecionar convidado sem mesa:
                    </label>
                    <GuestSearchCombobox
                      guests={eligibleUnassignedGuests}
                      selectedGuestId={selectedUnassignedGuestId}
                      onSelect={(guestId) => setSelectedUnassignedGuestId(guestId)}
                      placeholder="Buscar convidado ou família..."
                    />
                    <span className="admin-input-hint">
                      Apenas convidados confirmados ou pendentes sem mesa são elegíveis para seleção.
                    </span>
                  </div>
                )}
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn--outline"
                  onClick={() => setTableToAddGuest(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  onClick={handleConfirmAddGuestToTable}
                  disabled={!selectedUnassignedGuestId || eligibleUnassignedGuests.length === 0}
                >
                  Adicionar à Mesa
                </button>
              </div>
            </div>
          )}
        </AdminModal>
      </main>
    </div>
  );
};
