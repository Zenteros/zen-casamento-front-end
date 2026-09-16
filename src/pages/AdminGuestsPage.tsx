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

interface DraftGuestItem {
  id: string;
  name: string;
  isChild: boolean;
  rsvpStatus: 'PENDING' | 'CONFIRMED' | 'DECLINED';
  isNew?: boolean;
  tableName?: string | null;
  checkIn?: { checkedInAt: string } | null;
  dietaryRestrictions?: string | null;
  original?: {
    name: string;
    isChild: boolean;
    rsvpStatus: 'PENDING' | 'CONFIRMED' | 'DECLINED';
  };
}

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

  // Confirmação de Alterações Não Salvas
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState<(() => void) | null>(null);

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

  // Estado Local de Edição do Convite (Detail / Edit Modal)
  const [editFamilyTitle, setEditFamilyTitle] = useState('');
  const [initialFamilyTitle, setInitialFamilyTitle] = useState('');
  const [draftGuests, setDraftGuests] = useState<DraftGuestItem[]>([]);
  const [addGuestName, setAddGuestName] = useState('');
  const [addGuestIsChild, setAddGuestIsChild] = useState(false);
  const [isSavingDetail, setIsSavingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

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

  // Verificações de Alterações Não Salvas (Dirty state)
  const isCreateDirty = useCallback(() => {
    if (newFamilyTitle.trim().length > 0) return true;
    if (newGuestsList.some((g) => g.name.trim().length > 0)) return true;
    return false;
  }, [newFamilyTitle, newGuestsList]);

  const isDetailDirty = useCallback(() => {
    if (!detailData) return false;
    if (editFamilyTitle.trim() !== initialFamilyTitle.trim()) return true;
    if (addGuestName.trim().length > 0) return true;
    const hasGuestChanges = draftGuests.some((g) => {
      if (g.isNew) return g.name.trim().length > 0;
      if (!g.original) return false;
      return (
        g.name.trim() !== g.original.name.trim() ||
        g.isChild !== g.original.isChild ||
        g.rsvpStatus !== g.original.rsvpStatus
      );
    });
    return hasGuestChanges;
  }, [detailData, editFamilyTitle, initialFamilyTitle, addGuestName, draftGuests]);

  // Fechamento Seguro de Modais com Confirmação
  const handleRequestClose = useCallback(
    (modalType: 'CREATE' | 'DETAIL' | 'IMPORT' | 'REGENERATE') => {
      if (modalType === 'CREATE') {
        if (isCreateDirty()) {
          setPendingCloseAction(() => () => {
            setIsCreateModalOpen(false);
            setNewFamilyTitle('');
            setNewGuestsList([{ name: '', isChild: false }]);
            setCreateError(null);
          });
          setShowUnsavedConfirm(true);
        } else {
          setIsCreateModalOpen(false);
          setNewFamilyTitle('');
          setNewGuestsList([{ name: '', isChild: false }]);
          setCreateError(null);
        }
      } else if (modalType === 'DETAIL') {
        if (isDetailDirty()) {
          setPendingCloseAction(() => () => {
            setDetailInviteId(null);
            setDetailData(null);
            setDraftGuests([]);
            setEditFamilyTitle('');
            setInitialFamilyTitle('');
            setAddGuestName('');
            setAddGuestIsChild(false);
            setDetailError(null);
          });
          setShowUnsavedConfirm(true);
        } else {
          setDetailInviteId(null);
          setDetailData(null);
          setDraftGuests([]);
          setEditFamilyTitle('');
          setInitialFamilyTitle('');
          setAddGuestName('');
          setAddGuestIsChild(false);
          setDetailError(null);
        }
      } else if (modalType === 'IMPORT') {
        if (importStep !== 'UPLOAD' || csvInputText.trim().length > 0) {
          setPendingCloseAction(() => () => {
            handleCloseImportModal();
          });
          setShowUnsavedConfirm(true);
        } else {
          handleCloseImportModal();
        }
      } else if (modalType === 'REGENERATE') {
        setRegenerateInviteTarget(null);
      }
    },
    [isCreateDirty, isDetailDirty, importStep, csvInputText]
  );

  // Fechar modais com tecla Escape respeitando confirmação
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showUnsavedConfirm) {
          setShowUnsavedConfirm(false);
        } else if (regenerateInviteTarget) {
          handleRequestClose('REGENERATE');
        } else if (detailInviteId) {
          handleRequestClose('DETAIL');
        } else if (isCreateModalOpen) {
          handleRequestClose('CREATE');
        } else if (isImportModalOpen) {
          handleRequestClose('IMPORT');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showUnsavedConfirm,
    regenerateInviteTarget,
    detailInviteId,
    isCreateModalOpen,
    isImportModalOpen,
    handleRequestClose,
  ]);

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
    setDetailError(null);
    try {
      const res = await apiFetch(`/api/v1/admin/invites/${inviteId}`, {
        method: 'GET',
      });
      if (res.ok) {
        const data = await res.json();
        const dataWithStatus: AdminInviteDetailDTO = {
          ...data,
          consolidatedStatus: calculateConsolidatedInviteStatus(data.guests || []),
        };
        setDetailData(dataWithStatus);
        setEditFamilyTitle(data.familyTitle);
        setInitialFamilyTitle(data.familyTitle);
        const mappedDraft: DraftGuestItem[] = (data.guests || []).map((g: AdminGuestItemDTO) => ({
          id: g.id,
          name: g.name,
          isChild: g.isChild,
          rsvpStatus: (g.rsvp?.status as 'PENDING' | 'CONFIRMED' | 'DECLINED') || 'PENDING',
          tableName: g.tableName,
          checkIn: g.checkIn,
          dietaryRestrictions: g.rsvp?.dietaryRestrictions || null,
          original: {
            name: g.name,
            isChild: g.isChild,
            rsvpStatus: (g.rsvp?.status as 'PENDING' | 'CONFIRMED' | 'DECLINED') || 'PENDING',
          },
        }));
        setDraftGuests(mappedDraft);
        setAddGuestName('');
        setAddGuestIsChild(false);
      } else {
        showToast('Erro ao carregar detalhes do convite.');
      }
    } catch {
      showToast('Erro de conexão ao carregar convite.');
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
        const errData = await res.json().catch(() => ({}));
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

  // 7. Adicionar Convidado ao Rascunho Local
  const handleAddDraftGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addGuestName.trim()) return;
    const newGuest: DraftGuestItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      name: addGuestName.trim(),
      isChild: addGuestIsChild,
      rsvpStatus: 'PENDING',
      isNew: true,
    };
    setDraftGuests((prev) => [...prev, newGuest]);
    setAddGuestName('');
    setAddGuestIsChild(false);
    setDetailError(null);
  };

  // 8. Remover Convidado Novo do Rascunho Local
  const handleRemoveDraftGuest = (guestId: string) => {
    setDraftGuests((prev) => prev.filter((g) => g.id !== guestId));
  };

  // 9. Salvar Todas as Alterações do Convite (Persistência Consistente)
  const handleSaveDetailChanges = async () => {
    if (!detailData) return;
    if (!editFamilyTitle.trim()) {
      setDetailError('O título da família/convite é obrigatório.');
      return;
    }

    // Validar se todos os convidados têm nome
    for (const g of draftGuests) {
      if (!g.name.trim()) {
        setDetailError('Todos os integrantes na lista precisam ter um nome preenchido.');
        return;
      }
    }

    setIsSavingDetail(true);
    setDetailError(null);

    try {
      const promises: Promise<any>[] = [];

      // 1. Título da Família alterado
      if (editFamilyTitle.trim() !== initialFamilyTitle.trim()) {
        promises.push(
          apiFetch(`/api/v1/admin/invites/${detailData.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ familyTitle: editFamilyTitle.trim() }),
          }).then(async (res) => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || 'Erro ao atualizar o título do convite.');
            }
          })
        );
      }

      // 2. Convidados existentes modificados
      for (const guest of draftGuests) {
        if (!guest.isNew && guest.original) {
          const isNameChanged = guest.name.trim() !== guest.original.name.trim();
          const isChildChanged = guest.isChild !== guest.original.isChild;
          const isRsvpChanged = guest.rsvpStatus !== guest.original.rsvpStatus;

          if (isNameChanged || isChildChanged || isRsvpChanged) {
            promises.push(
              apiFetch(`/api/v1/admin/guests/${guest.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: guest.name.trim(),
                  isChild: guest.isChild,
                  rsvpStatus: guest.rsvpStatus,
                }),
              }).then(async (res) => {
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  throw new Error(err.error || `Erro ao atualizar integrante ${guest.name}.`);
                }
              })
            );
          }
        }
      }

      // 3. Novos convidados adicionados
      for (const newGuest of draftGuests) {
        if (newGuest.isNew && newGuest.name.trim()) {
          promises.push(
            apiFetch(`/api/v1/admin/invites/${detailData.id}/guests`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: newGuest.name.trim(),
                isChild: newGuest.isChild,
              }),
            }).then(async (res) => {
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Erro ao adicionar integrante ${newGuest.name}.`);
              }
              const created = await res.json().catch(() => null);
              if (created && created.id && newGuest.rsvpStatus !== 'PENDING') {
                await apiFetch(`/api/v1/admin/guests/${created.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ rsvpStatus: newGuest.rsvpStatus }),
                });
              }
            })
          );
        }
      }

      // 4. Se o usuário digitou nome no formulário rápido de adicionar e não clicou em "+", salvar também
      if (addGuestName.trim()) {
        promises.push(
          apiFetch(`/api/v1/admin/invites/${detailData.id}/guests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: addGuestName.trim(),
              isChild: addGuestIsChild,
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || `Erro ao adicionar ${addGuestName}.`);
            }
          })
        );
      }

      await Promise.all(promises);

      showToast('Alterações salvas com sucesso! ✨');
      setAddGuestName('');
      setAddGuestIsChild(false);
      await handleOpenDetail(detailData.id);
      fetchInvites(true);
    } catch (err: unknown) {
      setDetailError(err instanceof Error ? err.message : 'Erro ao persistir alterações.');
    } finally {
      setIsSavingDetail(false);
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
                onClick={() => handleRequestClose('CREATE')}
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
                  onClick={() => handleRequestClose('CREATE')}
                  disabled={isSubmittingCreate}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={isSubmittingCreate || !newFamilyTitle.trim() || newGuestsList.every((g) => !g.name.trim())}
                >
                  {isSubmittingCreate ? 'Criando convite...' : 'Criar convite'}
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
        >
          <div className="admin-modal admin-modal--guests">
            <div className="admin-modal-header">
              <div>
                <h2 className="admin-modal-title">Detalhes do Convite</h2>
                <span className="admin-modal-meta">Edição de dados da família, integrantes e link individual</span>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => handleRequestClose('DETAIL')}
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
                  {detailError && (
                    <div className="admin-alert admin-alert--error" role="alert">
                      {detailError}
                    </div>
                  )}

                  {/* Título da Família */}
                  <div className="admin-detail-section">
                    <label htmlFor="detailFamilyTitle" className="admin-label" style={{ display: 'block', marginBottom: '0.35rem' }}>
                      Título da Família / Convite *
                    </label>
                    <input
                      id="detailFamilyTitle"
                      type="text"
                      className="admin-input"
                      value={editFamilyTitle}
                      onChange={(e) => setEditFamilyTitle(e.target.value)}
                      placeholder="Nome da família ou do convidado principal"
                      required
                    />
                    <span className="admin-field-hint">
                      Exibido no cabeçalho do convite digital e na mensagem de WhatsApp.
                    </span>
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
                          onClick={() => handleCopyWhatsApp(editFamilyTitle || detailData.familyTitle, detailData.token, detailData.id)}
                          title="Copiar mensagem personalizada com link para WhatsApp"
                        >
                          <WhatsAppIcon /> {copiedWhatsAppId === detailData.id ? 'Mensagem Copiada!' : 'Copiar Mensagem para WhatsApp'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Integrantes */}
                  <div className="admin-detail-section">
                    <div className="admin-detail-header-row" style={{ marginBottom: '0.5rem' }}>
                      <span className="admin-detail-label">
                        Integrantes da Família ({draftGuests.length})
                      </span>
                      {renderStatusBadge(
                        calculateConsolidatedInviteStatus(
                          draftGuests.map((g) => ({ rsvpStatus: g.rsvpStatus }))
                        )
                      )}
                    </div>

                    <div className="admin-guests-detail-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {draftGuests.map((guest, index) => (
                        <div
                          key={guest.id}
                          className="admin-guest-detail-row"
                          style={{
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            background: guest.isNew ? '#fffdf7' : 'rgba(255, 255, 255, 0.7)',
                            border: guest.isNew ? '1px dashed #d97706' : '1px solid rgba(107, 92, 87, 0.15)',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                            {/* Nome */}
                            <div style={{ flex: '1 1 200px' }}>
                              <label
                                className="admin-label"
                                style={{ fontSize: '0.75rem', marginBottom: '0.2rem', display: 'block', color: 'var(--color-text-muted)' }}
                              >
                                Nome do integrante #{index + 1}
                              </label>
                              <input
                                type="text"
                                className="admin-input"
                                value={guest.name}
                                onChange={(e) => {
                                  const updated = [...draftGuests];
                                  updated[index] = { ...updated[index], name: e.target.value };
                                  setDraftGuests(updated);
                                }}
                                placeholder="Nome do integrante"
                                required
                              />
                            </div>

                            {/* RSVP Status */}
                            <div style={{ flex: '1 1 170px' }}>
                              <label
                                className="admin-label"
                                style={{ fontSize: '0.75rem', marginBottom: '0.2rem', display: 'block', color: 'var(--color-text-muted)' }}
                              >
                                Confirmação de Presença
                              </label>
                              <select
                                className="admin-input admin-select-filter"
                                value={guest.rsvpStatus}
                                onChange={(e) => {
                                  const updated = [...draftGuests];
                                  updated[index] = {
                                    ...updated[index],
                                    rsvpStatus: e.target.value as 'PENDING' | 'CONFIRMED' | 'DECLINED',
                                  };
                                  setDraftGuests(updated);
                                }}
                                style={{ minHeight: '48px', width: '100%' }}
                              >
                                <option value="PENDING">Pendente</option>
                                <option value="CONFIRMED">Confirmado</option>
                                <option value="DECLINED">Não comparecerá</option>
                              </select>
                            </div>

                            {/* Criança & Remoção se for novo */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                              <label className="admin-checkbox-label" title="Marcar se for criança">
                                <input
                                  type="checkbox"
                                  checked={guest.isChild}
                                  onChange={(e) => {
                                    const updated = [...draftGuests];
                                    updated[index] = { ...updated[index], isChild: e.target.checked };
                                    setDraftGuests(updated);
                                  }}
                                />
                                <span>Criança</span>
                              </label>

                              {guest.isNew && (
                                <button
                                  type="button"
                                  className="admin-btn-remove-row"
                                  onClick={() => handleRemoveDraftGuest(guest.id)}
                                  title="Remover novo integrante não salvo"
                                  style={{ marginLeft: '0.25rem' }}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Subtags informativas */}
                          <div className="admin-guest-subtags" style={{ marginTop: '0.2rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {guest.isNew ? (
                              <span className="admin-badge admin-badge--staging" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                                Novo (não salvo)
                              </span>
                            ) : (
                              renderGuestRsvpBadge(guest.rsvpStatus)
                            )}
                            {guest.tableName && <span className="admin-tag-sub">🪑 Mesa: {guest.tableName}</span>}
                            {guest.checkIn && <span className="admin-tag-sub admin-tag-sub--present">✓ Check-in realizado</span>}
                            {guest.dietaryRestrictions && (
                              <span className="admin-tag-sub admin-tag-sub--dietary" title={guest.dietaryRestrictions}>
                                🍽️ {guest.dietaryRestrictions}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Adicionar Novo Membro ao Rascunho */}
                    <form onSubmit={handleAddDraftGuest} className="admin-add-guest-form" style={{ marginTop: '1rem' }}>
                      <h4 className="admin-add-guest-title">+ Adicionar Convidado à Família</h4>
                      <div className="admin-add-guest-inputs">
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="Nome do novo integrante"
                          value={addGuestName}
                          onChange={(e) => setAddGuestName(e.target.value)}
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
                          className="admin-btn admin-btn--sm admin-btn--outline"
                          disabled={!addGuestName.trim()}
                        >
                          + Adicionar à lista
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>

            <div className="admin-modal-footer">
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--outline"
                  onClick={() => handleRequestClose('DETAIL')}
                  disabled={isSavingDetail}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--outline-danger"
                  onClick={() => {
                    if (detailData) setRegenerateInviteTarget(detailData);
                  }}
                  disabled={isSavingDetail}
                  title="Regenerar link exclusivo deste convite"
                >
                  <KeyIcon /> Regenerar Link
                </button>
              </div>

              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={handleSaveDetailChanges}
                disabled={isSavingDetail || !isDetailDirty() || !editFamilyTitle.trim()}
                title={!isDetailDirty() ? 'Nenhuma alteração pendente' : 'Salvar todas as alterações do convite'}
              >
                {isSavingDetail ? 'Salvando alterações...' : 'Salvar alterações'}
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
                onClick={() => handleRequestClose('REGENERATE')}
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
                onClick={() => handleRequestClose('REGENERATE')}
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
                onClick={() => handleRequestClose('IMPORT')}
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
                    onClick={() => handleRequestClose('IMPORT')}
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
                  onClick={() => handleRequestClose('IMPORT')}
                >
                  Concluir e Ver Lista de Convidados
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          9. MODAL: CONFIRMAÇÃO DE ALTERAÇÕES NÃO SALVAS
          ══════════════════════════════════════════════════════ */}
      {showUnsavedConfirm && (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          style={{ zIndex: 1100 }}
        >
          <div className="admin-modal admin-modal--confirm animate-slide-up">
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#d97706' }}><AlertTriangleIcon /></span>
                <h2 className="admin-modal-title">Alterações não salvas</h2>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setShowUnsavedConfirm(false)}
                aria-label="Fechar confirmação"
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <p className="admin-confirm-text">
                Existem alterações não salvas. Deseja sair mesmo assim?
              </p>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                Se você sair agora, todas as edições preenchidas nesta janela serão perdidas.
              </p>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn--outline"
                onClick={() => setShowUnsavedConfirm(false)}
              >
                Continuar editando
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--outline-danger"
                onClick={() => {
                  setShowUnsavedConfirm(false);
                  if (pendingCloseAction) {
                    pendingCloseAction();
                    setPendingCloseAction(null);
                  }
                }}
              >
                Descartar e sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
