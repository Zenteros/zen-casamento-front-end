import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type {
  AdminInviteItemDTO,
  AdminInviteDetailDTO,
  AdminGuestItemDTO,
  AdminInviteCountsDTO,
  AdminPaginationDTO,
  AdminUserDTO,
  ConsolidatedRsvpStatus,
  AdminImportPreviewResponseDTO,
  AdminImportConfirmResponseDTO,
} from '../contracts/index.js';
import { calculateConsolidatedInviteStatus } from '../contracts/index.js';
import { Monogram } from '../components/Monogram.js';
import { apiFetch, buildInviteUrl } from '../lib/api.js';

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

const CopyIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SearchIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const KeyIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 2l-2 2m-1.5 1.5L19 7l-2 2-2-2m-4.5 4.5l-6 6a3 3 0 0 1-4.24-4.24l6-6a3 3 0 0 1 4.24 0z" />
  </svg>
);

const AlertTriangleIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const WhatsAppIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const UploadIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const DownloadIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const AdminGuestsPage: React.FC = () => {
  const navigate = useNavigate();

  const [adminUser, setAdminUser] = useState<AdminUserDTO | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Estados de dados
  const [items, setItems] = useState<AdminInviteItemDTO[]>([]);
  const [counts, setCounts] = useState<AdminInviteCountsDTO>({
    totalInvites: 0,
    totalGuests: 0,
    confirmedGuests: 0,
    declinedGuests: 0,
    pendingGuests: 0,
    checkedInGuests: 0,
    childrenGuests: 0,
    withoutTableGuests: 0,
  });
  const [pagination, setPagination] = useState<AdminPaginationDTO>({
    page: 1,
    limit: 25,
    totalItems: 0,
    totalPages: 1,
  });

  // Filtros e controles
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ConsolidatedRsvpStatus>('ALL');
  const [tableFilter, setTableFilter] = useState<'ALL' | 'WITH_TABLE' | 'WITHOUT_TABLE'>('ALL');
  const [checkInFilter, setCheckInFilter] = useState<'ALL' | 'CHECKED_IN' | 'NOT_CHECKED_IN'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(new Date());

  // Toast / Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [copiedWhatsAppId, setCopiedWhatsAppId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailInviteId, setDetailInviteId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<AdminInviteDetailDTO | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [regenerateInviteTarget, setRegenerateInviteTarget] = useState<AdminInviteItemDTO | AdminInviteDetailDTO | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Modal de Importação CSV
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<'UPLOAD' | 'PREVIEW' | 'SUCCESS'>('UPLOAD');
  const [csvInputText, setCsvInputText] = useState('');
  const [importPreviewData, setImportPreviewData] = useState<AdminImportPreviewResponseDTO | null>(null);
  const [isAnalyzingCsv, setIsAnalyzingCsv] = useState(false);
  const [isConfirmingImport, setIsConfirmingImport] = useState(false);
  const [importResult, setImportResult] = useState<AdminImportConfirmResponseDTO | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Formulário de Criação
  const [newFamilyTitle, setNewFamilyTitle] = useState('');
  const [newGuestsList, setNewGuestsList] = useState<Array<{ name: string; isChild: boolean }>>([
    { name: '', isChild: false },
  ]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Formulário de Adicionar Guest em Convite Existente
  const [addGuestName, setAddGuestName] = useState('');
  const [addGuestIsChild, setAddGuestIsChild] = useState(false);
  const [isAddingGuest, setIsAddingGuest] = useState(false);

  // Edição de Guest Existente
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editGuestName, setEditGuestName] = useState('');
  const [editGuestIsChild, setEditGuestIsChild] = useState(false);
  const [editGuestRsvpStatus, setEditGuestRsvpStatus] = useState<'PENDING' | 'CONFIRMED' | 'DECLINED'>('PENDING');
  const [isSavingGuest, setIsSavingGuest] = useState(false);

  // Edição de Título de Família
  const [isEditingFamilyTitle, setIsEditingFamilyTitle] = useState(false);
  const [editFamilyTitle, setEditFamilyTitle] = useState('');
  const [isSavingFamilyTitle, setIsSavingFamilyTitle] = useState(false);

  const isPollingRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exibir Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. WhatsApp: Copiar Mensagem e Abrir no WhatsApp
  const handleCopyWhatsApp = (familyTitle: string, token: string, inviteId: string) => {
    const link = buildInviteUrl(token);
    const message = `Olá, ${familyTitle}! 💍\n\nEstamos muito felizes em compartilhar este momento tão especial com vocês.\nPreparamos nosso convite digital com todas as informações e detalhes do casamento de Patrício & Evandria.\n\nAcesse pelo link exclusivo abaixo:\n${link}\n\nPor lá vocês também poderão confirmar a presença de cada um de vocês.\n\nEsperamos vocês com muito carinho! ❤️`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(message).catch(() => {});
    }

    setCopiedWhatsAppId(inviteId);
    showToast(`Mensagem para WhatsApp copiada com sucesso! 💬`);
    setTimeout(() => setCopiedWhatsAppId(null), 2500);

    const whatsappUrl = `https://api.whatsapp.com/send/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // 2. Baixar Modelo CSV
  const handleDownloadTemplate = () => {
    const csvContent = 'familia,nome,crianca\nFamília Silva,João Silva,nao\nFamília Silva,Maria Silva,nao\nFamília Silva,Pedro Silva,sim\nFamília Souza,Carlos Souza,nao';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_convidados_zen_casamento.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Modelo de planilha CSV baixado! 📥');
  };

  // 3. Analisar CSV (Etapa 1 -> 2)
  const handleAnalyzeCsv = async (content?: string) => {
    const textToAnalyze = content !== undefined ? content : csvInputText;
    if (!textToAnalyze.trim()) {
      setImportError('Informe ou selecione um arquivo CSV para análise.');
      return;
    }

    setIsAnalyzingCsv(true);
    setImportError(null);

    try {
      const res = await apiFetch('/api/v1/admin/invites/import-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: textToAnalyze }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao analisar arquivo CSV.');
      }

      const data: AdminImportPreviewResponseDTO = await res.json();
      setImportPreviewData(data);
      setImportStep('PREVIEW');
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Erro ao processar CSV.');
    } finally {
      setIsAnalyzingCsv(false);
    }
  };

  // 4. Leitura de arquivo selecionado
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvInputText(content);
      handleAnalyzeCsv(content);
    };
    reader.readAsText(file, 'UTF-8');
  };

  // 5. Confirmar Gravação no Banco (Etapa 2 -> 3)
  const handleConfirmImport = async () => {
    if (!importPreviewData || !importPreviewData.canProceed) return;

    setIsConfirmingImport(true);
    setImportError(null);

    try {
      const payload = {
        families: importPreviewData.families.map((fam) => ({
          familyTitle: fam.familyTitle,
          guests: fam.guests.map((g) => ({
            name: g.name,
            isChild: g.isChild,
          })),
        })),
      };

      const res = await apiFetch('/api/v1/admin/invites/import-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao confirmar importação.');
      }

      const result: AdminImportConfirmResponseDTO = await res.json();
      setImportResult(result);
      setImportStep('SUCCESS');
      fetchInvites(false);
      showToast('Importação oficial concluída com sucesso! 🚀');
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Erro ao gravar convidados.');
    } finally {
      setIsConfirmingImport(false);
    }
  };

  // 6. Reset do Modal de Importação
  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setImportStep('UPLOAD');
    setCsvInputText('');
    setImportPreviewData(null);
    setImportError(null);
    setImportResult(null);
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

  // 2. Buscar Lista de Convites
  const fetchInvites = useCallback(
    async (isBackground = false) => {
      if (isBackground && isPollingRef.current) return;
      if (isBackground) isPollingRef.current = true;
      else setIsRefreshing(true);

      try {
        const params = new URLSearchParams();
        params.set('page', currentPage.toString());
        params.set('limit', '25');
        if (search.trim()) params.set('search', search.trim());
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        if (tableFilter !== 'ALL') params.set('table', tableFilter);
        if (checkInFilter !== 'ALL') params.set('checkIn', checkInFilter);

        const res = await apiFetch(`/api/v1/admin/invites?${params.toString()}`, {
          method: 'GET',
        });

        if (res.status === 401) {
          navigate('/admin/login', { replace: true });
          return;
        }

        if (!res.ok) {
          throw new Error('Falha ao carregar lista de convites.');
        }

        const data = await res.json();
        const itemsWithCalculatedStatus = (data.items || []).map((item: AdminInviteItemDTO) => ({
          ...item,
          consolidatedStatus: calculateConsolidatedInviteStatus(item.guests || []),
        }));
        setItems(itemsWithCalculatedStatus);
        setCounts(data.counts);
        setPagination(data.pagination);
        setErrorMessage(null);
        setLastUpdatedAt(new Date());
      } catch (err: unknown) {
        if (!isBackground) {
          setErrorMessage(err instanceof Error ? err.message : 'Erro de conexão com o servidor.');
        }
      } finally {
        if (isBackground) isPollingRef.current = false;
        else {
          setIsRefreshing(false);
          setLoading(false);
        }
      }
    },
    [currentPage, search, statusFilter, tableFilter, checkInFilter, navigate]
  );

  useEffect(() => {
    if (!checkingAuth) {
      setLoading(true);
      fetchInvites(false);
    }
  }, [fetchInvites, checkingAuth]);

  // Auto-polling
  useEffect(() => {
    if (checkingAuth) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchInvites(true);
      }
    }, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchInvites, checkingAuth]);

  // Fechar modais com tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (regenerateInviteTarget) {
          setRegenerateInviteTarget(null);
        } else if (detailInviteId) {
          setDetailInviteId(null);
          setDetailData(null);
        } else if (isCreateModalOpen) {
          setIsCreateModalOpen(false);
        } else if (isImportModalOpen) {
          handleCloseImportModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [regenerateInviteTarget, detailInviteId, isCreateModalOpen, isImportModalOpen]);

  // 3. Logout
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

  // 4. Copiar Link do Convite
  const handleCopyLink = (token: string, inviteId: string) => {
    const fullUrl = buildInviteUrl(token);
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedTokenId(inviteId);
      showToast('Link do convite copiado com sucesso! 📋');
      setTimeout(() => setCopiedTokenId(null), 2500);
    });
  };

  // 5. Abrir Detalhes do Convite
  const handleOpenDetail = async (inviteId: string) => {
    setDetailInviteId(inviteId);
    setLoadingDetail(true);
    setIsEditingFamilyTitle(false);
    setEditingGuestId(null);
    try {
      const res = await apiFetch(`/api/v1/admin/invites/${inviteId}`, {
        method: 'GET',
      });
      if (res.ok) {
        const data = await res.json();
        setDetailData({
          ...data,
          consolidatedStatus: calculateConsolidatedInviteStatus(data.guests || []),
        });
        setEditFamilyTitle(data.familyTitle);
      }
    } catch {
      showToast('Erro ao carregar detalhes do convite.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // 6. Criar Novo Convite
  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyTitle.trim()) {
      setCreateError('Informe o título da família/convite.');
      return;
    }

    const validGuests = newGuestsList.filter((g) => g.name.trim().length > 0);
    if (validGuests.length === 0) {
      setCreateError('Informe o nome de pelo menos um integrante.');
      return;
    }

    setIsSubmittingCreate(true);
    setCreateError(null);

    try {
      const res = await apiFetch('/api/v1/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyTitle: newFamilyTitle.trim(),
          guests: validGuests.map((g) => ({ name: g.name.trim(), isChild: g.isChild })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao criar convite.');
      }

      showToast(`Convite "${newFamilyTitle.trim()}" criado com sucesso! 🎉`);
      setIsCreateModalOpen(false);
      setNewFamilyTitle('');
      setNewGuestsList([{ name: '', isChild: false }]);
      fetchInvites(false);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Erro ao processar criação.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // 7. Salvar Título da Família
  const handleSaveFamilyTitle = async () => {
    if (!detailData || !editFamilyTitle.trim()) return;
    setIsSavingFamilyTitle(true);
    try {
      const res = await apiFetch(`/api/v1/admin/invites/${detailData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyTitle: editFamilyTitle.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDetailData({
          ...updated,
          consolidatedStatus: calculateConsolidatedInviteStatus(updated.guests || []),
        });
        setIsEditingFamilyTitle(false);
        showToast('Título da família atualizado! ✨');
        fetchInvites(true);
      }
    } catch {
      showToast('Erro ao atualizar título.');
    } finally {
      setIsSavingFamilyTitle(false);
    }
  };

  // 8. Adicionar Guest em Convite Existente
  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailData || !addGuestName.trim()) return;
    setIsAddingGuest(true);
    try {
      const res = await apiFetch(`/api/v1/admin/invites/${detailData.id}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addGuestName.trim(),
          isChild: addGuestIsChild,
        }),
      });
      if (res.ok) {
        setAddGuestName('');
        setAddGuestIsChild(false);
        showToast('Convidado adicionado à família! 👤');
        handleOpenDetail(detailData.id);
        fetchInvites(true);
      }
    } catch {
      showToast('Erro ao adicionar convidado.');
    } finally {
      setIsAddingGuest(false);
    }
  };

  // 9. Salvar Edição de Guest
  const handleSaveGuest = async (guestId: string) => {
    if (!editGuestName.trim()) return;
    setIsSavingGuest(true);
    try {
      const res = await apiFetch(`/api/v1/admin/guests/${guestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editGuestName.trim(),
          isChild: editGuestIsChild,
          rsvpStatus: editGuestRsvpStatus,
        }),
      });
      if (res.ok) {
        setEditingGuestId(null);
        showToast('Dados do convidado atualizados! ✅');
        if (detailInviteId) handleOpenDetail(detailInviteId);
        fetchInvites(true);
      }
    } catch {
      showToast('Erro ao atualizar convidado.');
    } finally {
      setIsSavingGuest(false);
    }
  };

  // 10. Confirmar e Executar Regeneração de Token
  const handleConfirmRegenerate = async () => {
    if (!regenerateInviteTarget) return;
    setIsRegenerating(true);
    try {
      const res = await apiFetch(`/api/v1/admin/invites/${regenerateInviteTarget.id}/regenerate-token`, {
        method: 'POST',
      });
      if (res.ok) {
        const updated = await res.json();
        showToast(`Novo link gerado com sucesso! O anterior foi invalidado. 🔐`);
        setRegenerateInviteTarget(null);
        if (detailData && detailData.id === updated.id) {
          setDetailData({
            ...updated,
            consolidatedStatus: calculateConsolidatedInviteStatus(updated.guests || []),
          });
        }
        fetchInvites(false);
      }
    } catch {
      showToast('Erro ao regenerar link.');
    } finally {
      setIsRegenerating(false);
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

  const renderStatusBadge = (status: ConsolidatedRsvpStatus) => {
    if (status === 'CONFIRMED') {
      return <span className="admin-status-pill admin-status-pill--confirmed">Confirmado</span>;
    }
    if (status === 'DECLINED') {
      return <span className="admin-status-pill admin-status-pill--declined">Recusado</span>;
    }
    if (status === 'PARTIAL') {
      return <span className="admin-status-pill admin-status-pill--partial">Parcial</span>;
    }
    return <span className="admin-status-pill admin-status-pill--pending">Pendente</span>;
  };

  const renderGuestRsvpBadge = (status: string) => {
    if (status === 'CONFIRMED') {
      return <span className="admin-guest-tag admin-guest-tag--confirmed">Confirmado</span>;
    }
    if (status === 'DECLINED') {
      return <span className="admin-guest-tag admin-guest-tag--declined">Recusou</span>;
    }
    return <span className="admin-guest-tag admin-guest-tag--pending">Pendente</span>;
  };

  const renderPresenceBadge = (invite: AdminInviteItemDTO) => {
    if (invite.consolidatedStatus === 'CONFIRMED' || invite.consolidatedStatus === 'PARTIAL') {
      if (invite.checkedInCount > 0) {
        return <span className="admin-checkin-badge admin-checkin-badge--present">Presente</span>;
      }
      return <span className="admin-checkin-badge admin-checkin-badge--waiting">Aguardando chegada</span>;
    }
    if (invite.consolidatedStatus === 'DECLINED') {
      return <span className="admin-checkin-badge admin-checkin-badge--waiting">Não comparecerá</span>;
    }
    return <span className="admin-checkin-badge admin-checkin-badge--waiting">—</span>;
  };

  const displayedItems = statusFilter === 'ALL'
    ? items
    : items.filter((invite) => invite.consolidatedStatus === statusFilter);

  if (checkingAuth) {
    return (
      <div className="admin-loading-screen">
        <Monogram variant="pill" size="md" />
        <p className="admin-loading-text">Carregando gestão de convidados...</p>
      </div>
    );
  }

  return (
    <div className="admin-page animate-fade-in">
      {/* ── Toast de Feedback ── */}
      {toastMessage && (
        <div className="admin-toast animate-fade-in" role="status">
          {toastMessage}
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
                <span className="admin-badge admin-badge--staging">Gestão Operacional</span>
              </div>
              <h1 className="admin-header__title">Convidados &amp; Convites</h1>
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="admin-header__actions">
            {adminUser && (
              <span className="admin-header__user" title={`Logado como ${adminUser.email}`}>
                👤 {adminUser.name}
              </span>
            )}

            <button
              type="button"
              className="admin-btn admin-btn--icon admin-header__refresh"
              onClick={() => fetchInvites(false)}
              disabled={isRefreshing}
              title="Atualizar lista agora"
            >
              <RefreshIcon spinning={isRefreshing} />
            </button>

            <button
              type="button"
              className="admin-btn admin-btn--icon admin-header__logout"
              onClick={handleLogout}
              title="Sair do painel administrativo"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>

        {/* ── Submenu de Navegação Administrativa ── */}
        <div className="admin-subnav">
          <div className="admin-subnav__container">
            <Link to="/admin" className="admin-subnav__tab">
              🏛️ Visão Geral
            </Link>
            <Link to="/admin/guests" className="admin-subnav__tab admin-subnav__tab--active">
              👥 Convidados &amp; Convites
            </Link>
            <Link to="/admin/tables" className="admin-subnav__tab">
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
        <section className="admin-guests-stats-bar">
          <div className="admin-stat-box">
            <span className="admin-stat-box__label">Famílias</span>
            <strong className="admin-stat-box__val">{counts.totalInvites}</strong>
          </div>
          <div className="admin-stat-box">
            <span className="admin-stat-box__label">Total Convidados</span>
            <strong className="admin-stat-box__val">{counts.totalGuests}</strong>
          </div>
          <div className="admin-stat-box admin-stat-box--confirmed">
            <span className="admin-stat-box__label">Confirmados</span>
            <strong className="admin-stat-box__val">{counts.confirmedGuests}</strong>
          </div>
          <div className="admin-stat-box admin-stat-box--declined">
            <span className="admin-stat-box__label">Recusados</span>
            <strong className="admin-stat-box__val">{counts.declinedGuests}</strong>
          </div>
          <div className="admin-stat-box admin-stat-box--pending">
            <span className="admin-stat-box__label">Pendentes</span>
            <strong className="admin-stat-box__val">{counts.pendingGuests}</strong>
          </div>
          <div className="admin-stat-box">
            <span className="admin-stat-box__label">Crianças</span>
            <strong className="admin-stat-box__val">{counts.childrenGuests}</strong>
          </div>
          <div className="admin-stat-box">
            <span className="admin-stat-box__label">Presentes</span>
            <strong className="admin-stat-box__val">{counts.checkedInGuests}</strong>
          </div>
          <div className="admin-stat-box">
            <span className="admin-stat-box__label">Sem Mesa</span>
            <strong className="admin-stat-box__val">{counts.withoutTableGuests}</strong>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            3. BARRA DE FERRAMENTAS: BUSCA, FILTROS E AÇÃO NOVO
            ══════════════════════════════════════════════════════ */}
        <div className="admin-guests-toolbar">
          <div className="admin-search-wrap">
            <span className="admin-search-icon">
              <SearchIcon />
            </span>
            <input
              type="text"
              className="admin-search-input"
              placeholder="Buscar família ou nome do convidado..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
            {search && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => {
                  setSearch('');
                  setCurrentPage(1);
                }}
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>

          <div className="admin-filter-group">
            {/* Filtro de Status */}
            <div className="admin-pill-filters">
              <button
                type="button"
                className={`admin-filter-pill ${statusFilter === 'ALL' ? 'admin-filter-pill--active' : ''}`}
                onClick={() => {
                  setStatusFilter('ALL');
                  setCurrentPage(1);
                }}
              >
                Todos
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${statusFilter === 'PENDING' ? 'admin-filter-pill--active' : ''}`}
                onClick={() => {
                  setStatusFilter('PENDING');
                  setCurrentPage(1);
                }}
              >
                Pendentes
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${statusFilter === 'CONFIRMED' ? 'admin-filter-pill--active' : ''}`}
                onClick={() => {
                  setStatusFilter('CONFIRMED');
                  setCurrentPage(1);
                }}
              >
                Confirmados
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${statusFilter === 'PARTIAL' ? 'admin-filter-pill--active' : ''}`}
                onClick={() => {
                  setStatusFilter('PARTIAL');
                  setCurrentPage(1);
                }}
              >
                Parciais
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${statusFilter === 'DECLINED' ? 'admin-filter-pill--active' : ''}`}
                onClick={() => {
                  setStatusFilter('DECLINED');
                  setCurrentPage(1);
                }}
              >
                Recusados
              </button>
            </div>

            {/* Filtros secundários: Mesa e CheckIn */}
            <select
              className="admin-select-filter"
              value={tableFilter}
              onChange={(e) => {
                setTableFilter(e.target.value as 'ALL' | 'WITH_TABLE' | 'WITHOUT_TABLE');
                setCurrentPage(1);
              }}
            >
              <option value="ALL">Mesas: Todas</option>
              <option value="WITH_TABLE">Com Mesa</option>
              <option value="WITHOUT_TABLE">Sem Mesa / Parcial</option>
            </select>

            <select
              className="admin-select-filter"
              value={checkInFilter}
              onChange={(e) => {
                setCheckInFilter(e.target.value as 'ALL' | 'CHECKED_IN' | 'NOT_CHECKED_IN');
                setCurrentPage(1);
              }}
            >
              <option value="ALL">Presença: Todos</option>
              <option value="CHECKED_IN">Com Check-in</option>
              <option value="NOT_CHECKED_IN">Sem Check-in</option>
            </select>

          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="admin-btn admin-btn--outline admin-guests-import-btn"
              onClick={() => {
                setImportError(null);
                setImportStep('UPLOAD');
                setIsImportModalOpen(true);
              }}
              title="Importar lista de famílias e convidados via arquivo CSV"
            >
              <UploadIcon />
              <span>Importar CSV</span>
            </button>

            <button
              type="button"
              className="admin-btn admin-btn--primary admin-guests-new-btn"
              onClick={() => {
                setCreateError(null);
                setIsCreateModalOpen(true);
              }}
            >
              <PlusIcon />
              <span>Novo Convite</span>
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            4. LISTAGEM DE CONVITES
            ══════════════════════════════════════════════════════ */}
        {loading && displayedItems.length === 0 ? (
          <div className="admin-empty-state">
            <span className="admin-spinner" aria-hidden="true" />
            <p>Carregando convites e convidados...</p>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="admin-empty-state">
            <span className="admin-empty-state__icon">👥</span>
            <h3 className="admin-empty-state__title">Nenhum convite encontrado</h3>
            <p className="admin-empty-state__desc">
              {search || statusFilter !== 'ALL' || tableFilter !== 'ALL' || checkInFilter !== 'ALL'
                ? 'Nenhum convite corresponde aos filtros e termos de busca selecionados.'
                : 'Cadastre o primeiro convite para começar a compor a lista oficial dos noivos.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="admin-table-container admin-desktop-only">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-col-family">Família / Convite</th>
                    <th className="admin-col-guests">Integrantes ({displayedItems.reduce((acc, i) => acc + i.guestsCount, 0)})</th>
                    <th className="admin-col-status">RSVP Consolidado</th>
                    <th className="admin-col-table">Mesa</th>
                    <th className="admin-col-presence">Presença</th>
                    <th className="admin-col-link">Link Privado</th>
                    <th className="admin-col-actions" style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedItems.map((invite) => (
                    <tr key={invite.id} className="admin-table-row">
                      {/* Família */}
                      <td className="admin-col-family">
                        <div className="admin-family-cell">
                          <strong className="admin-family-cell__title">{invite.familyTitle}</strong>
                          {invite.isDev && (
                            <span className="admin-badge admin-badge--staging" title="Convite de Teste/Homologação">
                              DEV
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Integrantes */}
                      <td className="admin-col-guests">
                        <div className="admin-guests-chips">
                          {invite.guests.map((guest) => (
                            <span
                              key={guest.id}
                              className={`admin-guest-chip admin-guest-chip--${guest.rsvpStatus.toLowerCase()}`}
                              title={`Status: ${guest.rsvpStatus}${guest.isChild ? ' (Criança)' : ''}${guest.tableName ? ` | Mesa: ${guest.tableName}` : ''}`}
                            >
                              {guest.isChild && <span className="admin-child-icon" title="Criança">👶</span>}
                              {guest.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* RSVP Consolidado */}
                      <td className="admin-col-status">{renderStatusBadge(invite.consolidatedStatus)}</td>

                      {/* Mesa */}
                      <td className="admin-col-table">
                        <span className={`admin-table-badge ${invite.hasTable ? 'admin-table-badge--has' : 'admin-table-badge--none'}`}>
                          {invite.tableSummary}
                        </span>
                      </td>

                      {/* Presença */}
                      <td className="admin-col-presence">{renderPresenceBadge(invite)}</td>

                      {/* Link Privado & WhatsApp */}
                      <td className="admin-col-link">
                        <div className="admin-link-cell">
                          <button
                            type="button"
                            className={`admin-btn-copy ${copiedTokenId === invite.id ? 'admin-btn-copy--success' : ''}`}
                            onClick={() => handleCopyLink(invite.token, invite.id)}
                            title="Copiar link privado de acesso (/c/:token)"
                          >
                            {copiedTokenId === invite.id ? <CheckIcon /> : <CopyIcon />}
                            <span>{copiedTokenId === invite.id ? 'Copiado!' : 'Copiar Link'}</span>
                          </button>

                          <button
                            type="button"
                            className={`admin-btn-whatsapp ${copiedWhatsAppId === invite.id ? 'admin-btn-whatsapp--copied' : ''}`}
                            onClick={() => handleCopyWhatsApp(invite.familyTitle, invite.token, invite.id)}
                            title="Copiar mensagem personalizada com link para WhatsApp"
                          >
                            <WhatsAppIcon />
                            <span>{copiedWhatsAppId === invite.id ? 'Copiado!' : 'WhatsApp'}</span>
                          </button>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="admin-col-actions" style={{ textAlign: 'right' }}>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-btn admin-btn--sm admin-btn--outline"
                            onClick={() => handleOpenDetail(invite.id)}
                            title="Ver detalhes e editar família"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--sm admin-btn--outline-danger"
                            onClick={() => setRegenerateInviteTarget(invite)}
                            title="Regenerar link (invalida link anterior)"
                          >
                            <KeyIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="admin-cards-container admin-mobile-only">
              {displayedItems.map((invite) => (
                <div key={invite.id} className="admin-guest-card">
                  <div className="admin-guest-card__header">
                    <div>
                      <h3 className="admin-guest-card__title">{invite.familyTitle}</h3>
                      {invite.isDev && <span className="admin-badge admin-badge--staging">DEV</span>}
                    </div>
                    {renderStatusBadge(invite.consolidatedStatus)}
                  </div>

                  <div className="admin-guest-card__meta-row">
                    <span>
                      👥 {invite.guestsCount} integrante{invite.guestsCount > 1 ? 's' : ''} ({invite.confirmedCount} conf., {invite.pendingCount} pend.)
                    </span>
                    <span>🪑 {invite.tableSummary}</span>
                  </div>

                  <div className="admin-guests-chips admin-guests-chips--mobile">
                    {invite.guests.map((g) => (
                      <span key={g.id} className={`admin-guest-chip admin-guest-chip--${g.rsvpStatus.toLowerCase()}`}>
                        {g.isChild && '👶 '}
                        {g.name}
                      </span>
                    ))}
                  </div>

                  <div className="admin-guest-card__actions">
                    <button
                      type="button"
                      className={`admin-btn admin-btn--sm admin-btn--primary ${copiedTokenId === invite.id ? 'admin-btn-copy--success' : ''}`}
                      onClick={() => handleCopyLink(invite.token, invite.id)}
                    >
                      {copiedTokenId === invite.id ? <CheckIcon /> : <CopyIcon />}
                      <span>{copiedTokenId === invite.id ? 'Link Copiado' : 'Copiar Link'}</span>
                    </button>
                    <button
                      type="button"
                      className={`admin-btn admin-btn--sm admin-btn-whatsapp ${copiedWhatsAppId === invite.id ? 'admin-btn-whatsapp--copied' : ''}`}
                      onClick={() => handleCopyWhatsApp(invite.familyTitle, invite.token, invite.id)}
                      title="Copiar mensagem para WhatsApp"
                    >
                      <WhatsAppIcon />
                      <span>{copiedWhatsAppId === invite.id ? 'Msg Copiada!' : 'WhatsApp'}</span>
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--sm admin-btn--outline"
                      onClick={() => handleOpenDetail(invite.id)}
                    >
                      Detalhes
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--sm admin-btn--outline-danger"
                      onClick={() => setRegenerateInviteTarget(invite)}
                      title="Regenerar Link"
                    >
                      <KeyIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  type="button"
                  className="admin-btn admin-btn--pagination"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  &larr; Anterior
                </button>
                <span className="admin-pagination__info">
                  Página <strong>{pagination.page}</strong> de <strong>{pagination.totalPages}</strong> ({pagination.totalItems} convites)
                </span>
                <button
                  type="button"
                  className="admin-btn admin-btn--pagination"
                  disabled={currentPage >= pagination.totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  Próxima &rarr;
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════
          5. MODAL: NOVO CONVITE (CRIAÇÃO DE FAMÍLIA)
          ══════════════════════════════════════════════════════ */}
      {isCreateModalOpen && (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateModalOpen(false);
          }}
        >
          <div className="admin-modal admin-modal--guests">
            <div className="admin-modal-header">
              <div>
                <h2 className="admin-modal-title">Novo Convite</h2>
                <span className="admin-modal-meta">Cadastrar família e lista inicial de integrantes</span>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvite} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: '#ffffff' }}>
              <div className="admin-modal-body">
                {createError && (
                  <div className="admin-alert admin-alert--error" role="alert">
                    {createError}
                  </div>
                )}

                <div className="admin-form-group">
                  <label htmlFor="familyTitle" className="admin-label">
                    Título da Família / Convite *
                  </label>
                  <input
                    id="familyTitle"
                    type="text"
                    className="admin-input"
                    placeholder="Ex: Família Souza Silva, Padrinho Lucas &amp; Convidada..."
                    value={newFamilyTitle}
                    onChange={(e) => setNewFamilyTitle(e.target.value)}
                    required
                  />
                  <span className="admin-field-hint">Este título é exibido no topo do convite digital.</span>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Integrantes da Família *</label>
                  <div className="admin-dynamic-guests-list">
                    {newGuestsList.map((guest, index) => (
                      <div key={index} className="admin-guest-row-input">
                        <input
                          type="text"
                          className="admin-input admin-input--guest-name"
                          placeholder={`Nome do integrante #${index + 1}`}
                          value={guest.name}
                          onChange={(e) => {
                            const updated = [...newGuestsList];
                            updated[index].name = e.target.value;
                            setNewGuestsList(updated);
                          }}
                          required
                        />
                        <label className="admin-checkbox-label" title="Marcar se for criança">
                          <input
                            type="checkbox"
                            checked={guest.isChild}
                            onChange={(e) => {
                              const updated = [...newGuestsList];
                              updated[index].isChild = e.target.checked;
                              setNewGuestsList(updated);
                            }}
                          />
                          <span>Criança</span>
                        </label>
                        {newGuestsList.length > 1 && (
                          <button
                            type="button"
                            className="admin-btn-remove-row"
                            onClick={() => {
                              setNewGuestsList(newGuestsList.filter((_, idx) => idx !== index));
                            }}
                            title="Remover integrante"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="admin-btn admin-btn--outline admin-btn--sm"
                    style={{ marginTop: '0.65rem' }}
                    onClick={() => setNewGuestsList([...newGuestsList, { name: '', isChild: false }])}
                  >
                    <PlusIcon /> Adicionar outro integrante
                  </button>
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
                <button type="submit" className="admin-btn admin-btn--primary" disabled={isSubmittingCreate}>
                  {isSubmittingCreate ? 'Criando convite...' : 'Salvar e Gerar Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          6. MODAL: DETALHES E EDIÇÃO DO CONVITE
          ══════════════════════════════════════════════════════ */}
      {detailInviteId && (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDetailInviteId(null);
              setDetailData(null);
            }
          }}
        >
          <div className="admin-modal admin-modal--guests">
            <div className="admin-modal-header">
              <div>
                <h2 className="admin-modal-title">Detalhes do Convite</h2>
                <span className="admin-modal-meta">Gestão dos integrantes e link individual</span>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => {
                  setDetailInviteId(null);
                  setDetailData(null);
                }}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              {loadingDetail || !detailData ? (
                <div className="admin-empty-state">
                  <span className="admin-spinner" />
                  <p>Carregando dados do convite...</p>
                </div>
              ) : (
                <>
                  {/* Título da Família */}
                  <div className="admin-detail-section">
                    <div className="admin-detail-header-row">
                      <span className="admin-detail-label">Título da Família</span>
                      {!isEditingFamilyTitle && (
                        <button
                          type="button"
                          className="admin-btn-link"
                          onClick={() => {
                            setEditFamilyTitle(detailData.familyTitle);
                            setIsEditingFamilyTitle(true);
                          }}
                        >
                          Editar Título
                        </button>
                      )}
                    </div>

                    {isEditingFamilyTitle ? (
                      <div className="admin-inline-edit-row">
                        <input
                          type="text"
                          className="admin-input"
                          value={editFamilyTitle}
                          onChange={(e) => setEditFamilyTitle(e.target.value)}
                        />
                        <button
                          type="button"
                          className="admin-btn admin-btn--sm admin-btn--primary"
                          onClick={handleSaveFamilyTitle}
                          disabled={isSavingFamilyTitle}
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--sm admin-btn--outline"
                          onClick={() => setIsEditingFamilyTitle(false)}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <h3 className="admin-detail-family-title">{detailData.familyTitle}</h3>
                    )}
                  </div>

                  {/* Link Privado de Acesso & WhatsApp */}
                  <div className="admin-detail-section admin-detail-section--highlight">
                    <span className="admin-detail-label">Link Privado de Acesso &amp; WhatsApp</span>
                    <div className="admin-link-box" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'stretch' }}>
                      <code className="admin-link-code">{buildInviteUrl(detailData.token)}</code>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn--sm admin-btn--primary"
                          onClick={() => handleCopyLink(detailData.token, detailData.id)}
                        >
                          <CopyIcon /> Copiar Link
                        </button>
                        <button
                          type="button"
                          className={`admin-btn admin-btn--sm admin-btn-whatsapp ${copiedWhatsAppId === detailData.id ? 'admin-btn-whatsapp--copied' : ''}`}
                          onClick={() => handleCopyWhatsApp(detailData.familyTitle, detailData.token, detailData.id)}
                          title="Copiar mensagem personalizada com link para WhatsApp"
                        >
                          <WhatsAppIcon /> {copiedWhatsAppId === detailData.id ? 'Mensagem Copiada!' : 'Copiar Mensagem para WhatsApp'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Integrantes */}
                  <div className="admin-detail-section">
                    <div className="admin-detail-header-row">
                      <span className="admin-detail-label">Integrantes Cadastrados ({detailData.guests.length})</span>
                      {renderStatusBadge(detailData.consolidatedStatus)}
                    </div>

                    <div className="admin-guests-detail-list">
                      {detailData.guests.map((guest: AdminGuestItemDTO) => (
                        <div key={guest.id} className="admin-guest-detail-row">
                          {editingGuestId === guest.id ? (
                            <div className="admin-inline-edit-guest" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.7)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(107, 92, 87, 0.15)' }}>
                              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap', width: '100%' }}>
                                <div style={{ flex: '1 1 200px' }}>
                                  <label className="admin-label" style={{ fontSize: '0.8rem', marginBottom: '0.35rem', display: 'block' }}>
                                    Nome do convidado
                                  </label>
                                  <input
                                    type="text"
                                    className="admin-input"
                                    value={editGuestName}
                                    onChange={(e) => setEditGuestName(e.target.value)}
                                    placeholder="Nome do integrante"
                                  />
                                </div>

                                <div style={{ flex: '1 1 200px' }}>
                                  <label className="admin-label" style={{ fontSize: '0.8rem', marginBottom: '0.35rem', display: 'block' }}>
                                    Confirmação de presença
                                  </label>
                                  <select
                                    className="admin-input admin-select-filter"
                                    value={editGuestRsvpStatus}
                                    onChange={(e) => setEditGuestRsvpStatus(e.target.value as 'PENDING' | 'CONFIRMED' | 'DECLINED')}
                                    style={{ minHeight: '48px', width: '100%' }}
                                  >
                                    <option value="PENDING">Pendente</option>
                                    <option value="CONFIRMED">Confirmado</option>
                                    <option value="DECLINED">Não poderá comparecer</option>
                                  </select>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.75rem' }}>
                                  <label className="admin-checkbox-label">
                                    <input
                                      type="checkbox"
                                      checked={editGuestIsChild}
                                      onChange={(e) => setEditGuestIsChild(e.target.checked)}
                                    />
                                    <span>Criança</span>
                                  </label>
                                </div>
                              </div>

                              <div className="admin-inline-edit-actions" style={{ justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  className="admin-btn admin-btn--sm admin-btn--primary"
                                  onClick={() => handleSaveGuest(guest.id)}
                                  disabled={isSavingGuest}
                                >
                                  {isSavingGuest ? 'Salvando...' : 'Salvar'}
                                </button>
                                <button
                                  type="button"
                                  className="admin-btn admin-btn--sm admin-btn--outline"
                                  onClick={() => setEditingGuestId(null)}
                                  disabled={isSavingGuest}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="admin-guest-info">
                                <strong className="admin-guest-name">
                                  {guest.isChild && '👶 '}
                                  {guest.name}
                                </strong>
                                <div className="admin-guest-subtags">
                                  {renderGuestRsvpBadge(guest.rsvp?.status || 'PENDING')}
                                  {guest.tableName && (
                                    <span className="admin-tag-sub">🪑 {guest.tableName}</span>
                                  )}
                                  {guest.checkIn && (
                                    <span className="admin-tag-sub admin-tag-sub--present">✓ Check-in realizado</span>
                                  )}
                                  {guest.rsvp?.dietaryRestrictions && (
                                    <span className="admin-tag-sub admin-tag-sub--dietary" title={guest.rsvp.dietaryRestrictions}>
                                      🍽️ {guest.rsvp.dietaryRestrictions}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="admin-btn admin-btn--sm admin-btn--outline"
                                onClick={() => {
                                  setEditingGuestId(guest.id);
                                  setEditGuestName(guest.name);
                                  setEditGuestIsChild(guest.isChild);
                                  setEditGuestRsvpStatus(guest.rsvp?.status || 'PENDING');
                                }}
                              >
                                Editar
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Adicionar Novo Membro ao Convite */}
                    <form onSubmit={handleAddGuest} className="admin-add-guest-form">
                      <h4 className="admin-add-guest-title">+ Adicionar Convidado à Família</h4>
                      <div className="admin-add-guest-inputs">
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="Nome do novo integrante"
                          value={addGuestName}
                          onChange={(e) => setAddGuestName(e.target.value)}
                          required
                        />
                        <label className="admin-checkbox-label">
                          <input
                            type="checkbox"
                            checked={addGuestIsChild}
                            onChange={(e) => setAddGuestIsChild(e.target.checked)}
                          />
                          <span>Criança</span>
                        </label>
                        <button
                          type="submit"
                          className="admin-btn admin-btn--sm admin-btn--primary"
                          disabled={isAddingGuest || !addGuestName.trim()}
                        >
                          {isAddingGuest ? 'Adicionando...' : 'Adicionar'}
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn--outline-danger"
                onClick={() => {
                  if (detailData) setRegenerateInviteTarget(detailData);
                }}
              >
                <KeyIcon /> Regenerar Link de Acesso
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--outline"
                onClick={() => {
                  setDetailInviteId(null);
                  setDetailData(null);
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          7. MODAL: CONFIRMAÇÃO DE REGENERAÇÃO DE LINK
          ══════════════════════════════════════════════════════ */}
      {regenerateInviteTarget && (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRegenerateInviteTarget(null);
          }}
        >
          <div className="admin-modal admin-modal--confirm">
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#d97706' }}><AlertTriangleIcon /></span>
                <h2 className="admin-modal-title">Regenerar Link de Acesso?</h2>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setRegenerateInviteTarget(null)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <p className="admin-confirm-text">
                Você está prestes a gerar um novo link para <strong>"{regenerateInviteTarget.familyTitle}"</strong>.
              </p>
              <div className="admin-alert admin-alert--warning" style={{ marginTop: '0.75rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  <strong>Atenção:</strong> O link anterior deixará de funcionar imediatamente e qualquer sessão aberta deste convite será desconectada.
                </p>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem', color: '#78350f' }}>
                  ✓ Todos os convidados, respostas de RSVP, mesas e fotos enviadas permanecerão 100% intactos.
                </p>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn--outline"
                onClick={() => setRegenerateInviteTarget(null)}
                disabled={isRegenerating}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={handleConfirmRegenerate}
                disabled={isRegenerating}
              >
                {isRegenerating ? 'Gerando novo link...' : 'Confirmar e Regenerar Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          8. MODAL: IMPORTAÇÃO DE CONVIDADOS (CSV)
          ══════════════════════════════════════════════════════ */}
      {isImportModalOpen && (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseImportModal();
          }}
        >
          <div className="admin-modal admin-modal--import">
            <div className="admin-modal-header">
              <div>
                <h2 className="admin-modal-title">Importar Lista de Convidados (CSV)</h2>
                <span className="admin-modal-meta">
                  {importStep === 'UPLOAD' && 'Etapa 1 de 2: Seleção e envio do arquivo'}
                  {importStep === 'PREVIEW' && 'Etapa 2 de 2: Pré-visualização e conferência'}
                  {importStep === 'SUCCESS' && 'Importação concluída com sucesso'}
                </span>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={handleCloseImportModal}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              {importError && (
                <div className="admin-alert admin-alert--error" style={{ marginBottom: '1rem' }} role="alert">
                  {importError}
                </div>
              )}

              {/* ETAPA 1: UPLOAD / SELEÇÃO DE ARQUIVO */}
              {importStep === 'UPLOAD' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-main)' }}>
                      Selecione um arquivo <code>.csv</code> com as colunas <strong>familia, nome, crianca</strong>.
                    </p>
                    <button
                      type="button"
                      className="admin-btn admin-btn--sm admin-btn--outline"
                      onClick={handleDownloadTemplate}
                      title="Baixar planilha de exemplo no formato aceito"
                    >
                      <DownloadIcon /> Baixar Modelo CSV
                    </button>
                  </div>

                  {/* Dropzone */}
                  <div
                    className="admin-import-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="admin-import-dropzone__icon">📄</span>
                    <p className="admin-import-dropzone__text">
                      Clique para selecionar o arquivo CSV ou arraste-o aqui
                    </p>
                    <span className="admin-import-dropzone__sub">
                      Aceita codificação UTF-8, delimitador por vírgula (,) ou ponto-e-vírgula (;)
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Alternativa: Colar texto diretamente */}
                  <div>
                    <label className="admin-label" style={{ display: 'block', marginBottom: '0.35rem' }}>
                      Ou cole o conteúdo CSV diretamente abaixo:
                    </label>
                    <textarea
                      className="admin-import-textarea"
                      placeholder="familia,nome,crianca&#10;Família Silva,João Silva,nao&#10;Família Silva,Maria Silva,nao&#10;Família Silva,Pedro Silva,sim&#10;Família Souza,Carlos Souza,nao"
                      value={csvInputText}
                      onChange={(e) => setCsvInputText(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* ETAPA 2: PRÉ-VISUALIZAÇÃO */}
              {importStep === 'PREVIEW' && importPreviewData && (
                <div>
                  {/* Métricas do Preview */}
                  <div className="admin-import-metrics-grid">
                    <div className="admin-import-metric-card">
                      <span className="admin-import-metric-card__val">{importPreviewData.familiesCount}</span>
                      <span className="admin-import-metric-card__label">Famílias</span>
                    </div>
                    <div className="admin-import-metric-card">
                      <span className="admin-import-metric-card__val">{importPreviewData.guestsCount}</span>
                      <span className="admin-import-metric-card__label">Convidados</span>
                    </div>
                    <div className="admin-import-metric-card">
                      <span className="admin-import-metric-card__val">{importPreviewData.childrenCount}</span>
                      <span className="admin-import-metric-card__label">Crianças</span>
                    </div>
                    <div className="admin-import-metric-card admin-import-metric-card--success">
                      <span className="admin-import-metric-card__val">{importPreviewData.validRows}</span>
                      <span className="admin-import-metric-card__label">Linhas Válidas</span>
                    </div>
                    {importPreviewData.invalidRows > 0 && (
                      <div className="admin-import-metric-card admin-import-metric-card--danger">
                        <span className="admin-import-metric-card__val">{importPreviewData.invalidRows}</span>
                        <span className="admin-import-metric-card__label">Inválidas</span>
                      </div>
                    )}
                  </div>

                  {/* Erros Críticos */}
                  {importPreviewData.errors.length > 0 && (
                    <div className="admin-import-error-banner">
                      <strong>Erros encontrados ({importPreviewData.errors.length}):</strong>
                      <ul>
                        {importPreviewData.errors.map((err, idx) => (
                          <li key={idx}>
                            Linha {err.rowNumber}: {err.reason} {err.line ? `("${err.line}")` : ''}
                          </li>
                        ))}
                      </ul>
                      <p style={{ margin: '0.4rem 0 0', fontWeight: 600 }}>
                        Corrija o arquivo para prosseguir com a gravação segura.
                      </p>
                    </div>
                  )}

                  {/* Avisos e Conflitos */}
                  {importPreviewData.warnings.length > 0 && (
                    <div className="admin-import-warning-banner">
                      <strong>Pontos de Atenção / Conflitos ({importPreviewData.warnings.length}):</strong>
                      <ul>
                        {importPreviewData.warnings.map((warn, idx) => (
                          <li key={idx}>
                            Linha {warn.rowNumber}: {warn.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Lista de Famílias */}
                  <label className="admin-label" style={{ display: 'block', marginBottom: '0.35rem' }}>
                    Estrutura de Famílias Reconhecidas ({importPreviewData.families.length}):
                  </label>
                  <div className="admin-import-preview-list">
                    {importPreviewData.families.map((fam, idx) => (
                      <div key={idx} className="admin-import-preview-item">
                        <div className="admin-import-preview-item__header">
                          <strong className="admin-import-preview-item__title">{fam.familyTitle}</strong>
                          {fam.status === 'EXISTING_FAMILY_CONFLICT' ? (
                            <span className="admin-badge admin-badge--staging" style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
                              Família Já Existente
                            </span>
                          ) : (
                            <span className="admin-badge admin-badge--staging" style={{ backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}>
                              Nova Família
                            </span>
                          )}
                        </div>
                        <div className="admin-import-preview-item__members">
                          {fam.guests.map((g, gIdx) => (
                            <span
                              key={gIdx}
                              className="admin-guest-chip admin-guest-chip--pending"
                              title={g.isChild ? 'Criança' : 'Adulto'}
                            >
                              {g.isChild && '👶 '}
                              {g.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ETAPA 3: SUCESSO */}
              {importStep === 'SUCCESS' && importResult && (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: '0 0 0.5rem', color: 'var(--color-text-main)' }}>
                    Importação Concluída com Sucesso!
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: '0 0 1.25rem' }}>
                    {importResult.message}
                  </p>
                  <div style={{ display: 'inline-flex', gap: '1rem', background: '#f8fafc', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                    <div><strong>{importResult.importedFamilies}</strong> famílias criadas</div>
                    <div>•</div>
                    <div><strong>{importResult.importedGuests}</strong> convidados registrados</div>
                    <div>•</div>
                    <div><strong>{importResult.importedChildren}</strong> crianças</div>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              {importStep === 'UPLOAD' && (
                <>
                  <button
                    type="button"
                    className="admin-btn admin-btn--outline"
                    onClick={handleCloseImportModal}
                    disabled={isAnalyzingCsv}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    onClick={() => handleAnalyzeCsv()}
                    disabled={isAnalyzingCsv || !csvInputText.trim()}
                  >
                    {isAnalyzingCsv ? 'Analisando...' : 'Analisar e Pré-visualizar'}
                  </button>
                </>
              )}

              {importStep === 'PREVIEW' && (
                <>
                  <button
                    type="button"
                    className="admin-btn admin-btn--outline"
                    onClick={() => setImportStep('UPLOAD')}
                    disabled={isConfirmingImport}
                  >
                    &larr; Voltar e Corrigir
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    onClick={handleConfirmImport}
                    disabled={isConfirmingImport || !importPreviewData?.canProceed}
                    title={!importPreviewData?.canProceed ? 'Corrija os erros do arquivo para confirmar' : 'Gravar convites no banco'}
                  >
                    {isConfirmingImport ? 'Gravando no banco...' : 'Confirmar e Gravar Convites'}
                  </button>
                </>
              )}

              {importStep === 'SUCCESS' && (
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  onClick={handleCloseImportModal}
                >
                  Concluir e Ver Lista de Convidados
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
