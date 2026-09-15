import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import type {
  AdminUserDTO,
  AdminScheduleItemDetailDTO,
  AdminScheduleListResponseDTO,
  AdminMenuSectionDetailDTO,
  AdminMenuItemDetailDTO,
  AdminMenuListResponseDTO,
  AdminNoticeItemDetailDTO,
  AdminNoticeListResponseDTO,
} from '../contracts/index.js';
import { Monogram } from '../components/Monogram.js';
import { apiFetch } from '../lib/api.js';

const POLLING_INTERVAL_MS = 25000;

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

const EditIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const EyeIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ArrowUpIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const ArrowDownIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

const CheckCircleIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

type ActiveTab = 'schedule' | 'menu' | 'notices';

function formatIsoToLocalInput(isoString?: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function parseLocalInputToIso(inputStr: string): string | null {
  if (!inputStr || !inputStr.trim()) return null;
  const parsed = new Date(inputStr);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export const AdminContentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: ActiveTab = (searchParams.get('tab') as ActiveTab) || 'schedule';

  const [adminUser, setAdminUser] = useState<AdminUserDTO | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Estados de dados
  const [scheduleData, setScheduleData] = useState<AdminScheduleListResponseDTO | null>(null);
  const [menuData, setMenuData] = useState<AdminMenuListResponseDTO | null>(null);
  const [noticesData, setNoticesData] = useState<AdminNoticeListResponseDTO | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(new Date());

  const isPollingRef = useRef<boolean>(false);

  // Estados dos Modais
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingScheduleItem, setEditingScheduleItem] = useState<AdminScheduleItemDetailDTO | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    description: '',
    startsAt: '',
    endsAt: '',
    visibleFrom: '',
    visibleUntil: '',
    location: '',
    sortOrder: 0,
    highlight: false,
    active: true,
  });

  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<AdminMenuSectionDetailDTO | null>(null);
  const [sectionForm, setSectionForm] = useState({
    title: '',
    description: '',
    sortOrder: 0,
    active: true,
  });

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<AdminMenuItemDetailDTO | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    sortOrder: 0,
    active: true,
  });

  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<AdminNoticeItemDetailDTO | null>(null);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    body: '',
    priority: 0,
    active: true,
    visibleFrom: '',
    visibleUntil: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Toast feedback helper
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // 1. Auth check
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
        if (isMounted) navigate('/admin/login', { replace: true });
      }
    };
    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // 2. Fetch data
  const fetchData = useCallback(
    async (isSilent = false) => {
      if (isPollingRef.current && isSilent) return;
      if (isSilent) isPollingRef.current = true;
      else setIsRefreshing(true);

      try {
        const [schedRes, menuRes, notRes] = await Promise.all([
          apiFetch('/api/v1/admin/schedule', { method: 'GET' }),
          apiFetch('/api/v1/admin/menu', { method: 'GET' }),
          apiFetch('/api/v1/admin/notices', { method: 'GET' }),
        ]);

        if (schedRes.status === 401 || menuRes.status === 401 || notRes.status === 401) {
          navigate('/admin/login', { replace: true });
          return;
        }

        if (schedRes.ok && menuRes.ok && notRes.ok) {
          const sData: AdminScheduleListResponseDTO = await schedRes.json();
          const mData: AdminMenuListResponseDTO = await menuRes.json();
          const nData: AdminNoticeListResponseDTO = await notRes.json();

          setScheduleData(sData);
          setMenuData(mData);
          setNoticesData(nData);
          setLastUpdatedAt(new Date());
          setErrorMessage(null);
        } else {
          setErrorMessage('Erro ao sincronizar conteúdos do evento.');
        }
      } catch {
        if (!isSilent) setErrorMessage('Erro de conexão com o servidor.');
      } finally {
        if (isSilent) isPollingRef.current = false;
        else {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!checkingAuth) {
      setLoading(true);
      fetchData(false);
    }
  }, [checkingAuth, fetchData]);

  // Polling
  useEffect(() => {
    if (checkingAuth) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData(true);
      }
    }, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkingAuth, fetchData]);

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

  const handleTabChange = (tab: ActiveTab) => {
    setSearchParams({ tab });
  };

  /* ──────────────────────────────────────────────
     Handlers: Programação
     ────────────────────────────────────────────── */
  const openCreateScheduleModal = () => {
    setEditingScheduleItem(null);
    setScheduleForm({
      title: '',
      description: '',
      startsAt: '2026-11-21T10:30',
      endsAt: '',
      visibleFrom: '',
      visibleUntil: '',
      location: '',
      sortOrder: (scheduleData?.items.length ?? 0) + 1,
      highlight: false,
      active: true,
    });
    setFormError(null);
    setScheduleModalOpen(true);
  };

  const openEditScheduleModal = (item: AdminScheduleItemDetailDTO) => {
    setEditingScheduleItem(item);
    setScheduleForm({
      title: item.title,
      description: item.description || '',
      startsAt: formatIsoToLocalInput(item.startsAt),
      endsAt: formatIsoToLocalInput(item.endsAt),
      visibleFrom: formatIsoToLocalInput(item.visibleFrom),
      visibleUntil: formatIsoToLocalInput(item.visibleUntil),
      location: item.location || '',
      sortOrder: item.sortOrder,
      highlight: item.highlight,
      active: item.active,
    });
    setFormError(null);
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const startsAtIso = parseLocalInputToIso(scheduleForm.startsAt);
    if (!startsAtIso) {
      setFormError('O horário de início é obrigatório.');
      return;
    }

    const endsAtIso = parseLocalInputToIso(scheduleForm.endsAt);
    if (endsAtIso && new Date(endsAtIso).getTime() <= new Date(startsAtIso).getTime()) {
      setFormError('O horário de término deve ser posterior ao horário de início.');
      return;
    }

    const visibleFromIso = parseLocalInputToIso(scheduleForm.visibleFrom);
    const visibleUntilIso = parseLocalInputToIso(scheduleForm.visibleUntil);
    if (visibleFromIso && visibleUntilIso && new Date(visibleUntilIso).getTime() < new Date(visibleFromIso).getTime()) {
      setFormError('A data final de exibição não pode ser anterior à data inicial.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        title: scheduleForm.title.trim(),
        description: scheduleForm.description.trim() || null,
        startsAt: startsAtIso,
        endsAt: endsAtIso,
        visibleFrom: visibleFromIso,
        visibleUntil: visibleUntilIso,
        location: scheduleForm.location.trim() || null,
        sortOrder: Number(scheduleForm.sortOrder) || 0,
        highlight: scheduleForm.highlight,
        active: scheduleForm.active,
      };

      const url = editingScheduleItem
        ? `/api/v1/admin/schedule/${editingScheduleItem.id}`
        : '/api/v1/admin/schedule';
      const method = editingScheduleItem ? 'PATCH' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setScheduleModalOpen(false);
        showToast(editingScheduleItem ? 'Momento atualizado com sucesso!' : 'Momento cadastrado com sucesso!');
        fetchData(false);
      } else {
        const err = await res.json().catch(() => ({}));
        setFormError(err.error || 'Erro ao salvar momento da programação.');
      }
    } catch {
      setFormError('Erro de conexão ao salvar programação.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleScheduleActive = async (item: AdminScheduleItemDetailDTO) => {
    try {
      const res = await apiFetch(`/api/v1/admin/schedule/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !item.active }),
      });
      if (res.ok) {
        showToast(item.active ? 'Momento ocultado da experiência pública.' : 'Momento reativado com sucesso!');
        fetchData(false);
      }
    } catch {
      // ignore
    }
  };

  const handleMoveScheduleOrder = async (item: AdminScheduleItemDetailDTO, delta: number) => {
    const newOrder = Math.max(0, item.sortOrder + delta);
    try {
      const res = await apiFetch(`/api/v1/admin/schedule/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: newOrder }),
      });
      if (res.ok) {
        fetchData(false);
      }
    } catch {
      // ignore
    }
  };

  /* ──────────────────────────────────────────────
     Handlers: Cardápio (Menu)
     ────────────────────────────────────────────── */
  const openCreateSectionModal = () => {
    setEditingSection(null);
    setSectionForm({
      title: '',
      description: '',
      sortOrder: (menuData?.sections.length ?? 0) + 1,
      active: true,
    });
    setFormError(null);
    setSectionModalOpen(true);
  };

  const openEditSectionModal = (sec: AdminMenuSectionDetailDTO) => {
    setEditingSection(sec);
    setSectionForm({
      title: sec.title,
      description: sec.description || '',
      sortOrder: sec.sortOrder,
      active: sec.active,
    });
    setFormError(null);
    setSectionModalOpen(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionForm.title.trim()) {
      setFormError('O título da seção é obrigatório.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        title: sectionForm.title.trim(),
        description: sectionForm.description.trim() || null,
        sortOrder: Number(sectionForm.sortOrder) || 0,
        active: sectionForm.active,
      };

      const url = editingSection
        ? `/api/v1/admin/menu/sections/${editingSection.id}`
        : '/api/v1/admin/menu/sections';
      const method = editingSection ? 'PATCH' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSectionModalOpen(false);
        showToast(editingSection ? 'Seção atualizada!' : 'Seção cadastrada com sucesso!');
        fetchData(false);
      } else {
        const err = await res.json().catch(() => ({}));
        setFormError(err.error || 'Erro ao salvar seção do cardápio.');
      }
    } catch {
      setFormError('Erro de conexão ao salvar seção.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleSectionActive = async (sec: AdminMenuSectionDetailDTO) => {
    try {
      const res = await apiFetch(`/api/v1/admin/menu/sections/${sec.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !sec.active }),
      });
      if (res.ok) {
        showToast(sec.active ? 'Seção desativada.' : 'Seção reativada com sucesso!');
        fetchData(false);
      }
    } catch {
      // ignore
    }
  };

  const handleMoveSectionOrder = async (sec: AdminMenuSectionDetailDTO, delta: number) => {
    const newOrder = Math.max(0, sec.sortOrder + delta);
    try {
      const res = await apiFetch(`/api/v1/admin/menu/sections/${sec.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: newOrder }),
      });
      if (res.ok) {
        fetchData(false);
      }
    } catch {
      // ignore
    }
  };

  // Itens de Cardápio
  const openCreateItemModal = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setEditingItem(null);
    const sec = menuData?.sections.find((s) => s.id === sectionId);
    setItemForm({
      name: '',
      description: '',
      sortOrder: (sec?.items.length ?? 0) + 1,
      active: true,
    });
    setFormError(null);
    setItemModalOpen(true);
  };

  const openEditItemModal = (item: AdminMenuItemDetailDTO) => {
    setSelectedSectionId(item.menuSectionId);
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      sortOrder: item.sortOrder,
      active: item.active,
    });
    setFormError(null);
    setItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      setFormError('O nome do item é obrigatório.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        name: itemForm.name.trim(),
        description: itemForm.description.trim() || null,
        sortOrder: Number(itemForm.sortOrder) || 0,
        active: itemForm.active,
      };

      const url = editingItem
        ? `/api/v1/admin/menu/items/${editingItem.id}`
        : `/api/v1/admin/menu/sections/${selectedSectionId}/items`;
      const method = editingItem ? 'PATCH' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setItemModalOpen(false);
        showToast(editingItem ? 'Item atualizado!' : 'Item cadastrado no cardápio!');
        fetchData(false);
      } else {
        const err = await res.json().catch(() => ({}));
        setFormError(err.error || 'Erro ao salvar item.');
      }
    } catch {
      setFormError('Erro de conexão ao salvar item.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleItemActive = async (item: AdminMenuItemDetailDTO) => {
    try {
      const res = await apiFetch(`/api/v1/admin/menu/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !item.active }),
      });
      if (res.ok) {
        showToast(item.active ? 'Item desativado do cardápio.' : 'Item reativado!');
        fetchData(false);
      }
    } catch {
      // ignore
    }
  };

  const handleMoveItemOrder = async (item: AdminMenuItemDetailDTO, delta: number) => {
    const newOrder = Math.max(0, item.sortOrder + delta);
    try {
      const res = await apiFetch(`/api/v1/admin/menu/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: newOrder }),
      });
      if (res.ok) {
        fetchData(false);
      }
    } catch {
      // ignore
    }
  };

  /* ──────────────────────────────────────────────
     Handlers: Avisos (Notices)
     ────────────────────────────────────────────── */
  const openCreateNoticeModal = () => {
    setEditingNotice(null);
    setNoticeForm({
      title: '',
      body: '',
      priority: 0,
      active: true,
      visibleFrom: '',
      visibleUntil: '',
    });
    setFormError(null);
    setNoticeModalOpen(true);
  };

  const openEditNoticeModal = (notice: AdminNoticeItemDetailDTO) => {
    setEditingNotice(notice);
    setNoticeForm({
      title: notice.title,
      body: notice.body,
      priority: notice.priority,
      active: notice.active,
      visibleFrom: formatIsoToLocalInput(notice.visibleFrom),
      visibleUntil: formatIsoToLocalInput(notice.visibleUntil),
    });
    setFormError(null);
    setNoticeModalOpen(true);
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title.trim()) {
      setFormError('O título do aviso é obrigatório.');
      return;
    }
    if (!noticeForm.body.trim()) {
      setFormError('O texto do aviso é obrigatório.');
      return;
    }

    const visibleFromIso = parseLocalInputToIso(noticeForm.visibleFrom);
    const visibleUntilIso = parseLocalInputToIso(noticeForm.visibleUntil);
    if (visibleFromIso && visibleUntilIso && new Date(visibleUntilIso).getTime() < new Date(visibleFromIso).getTime()) {
      setFormError('A data final de exibição não pode ser anterior à data inicial.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        title: noticeForm.title.trim(),
        body: noticeForm.body.trim(),
        priority: Number(noticeForm.priority) || 0,
        active: noticeForm.active,
        visibleFrom: visibleFromIso,
        visibleUntil: visibleUntilIso,
      };

      const url = editingNotice
        ? `/api/v1/admin/notices/${editingNotice.id}`
        : '/api/v1/admin/notices';
      const method = editingNotice ? 'PATCH' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setNoticeModalOpen(false);
        showToast(editingNotice ? 'Aviso atualizado!' : 'Aviso publicado com sucesso!');
        fetchData(false);
      } else {
        const err = await res.json().catch(() => ({}));
        setFormError(err.error || 'Erro ao salvar aviso.');
      }
    } catch {
      setFormError('Erro de conexão ao salvar aviso.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleNoticeActive = async (notice: AdminNoticeItemDetailDTO) => {
    try {
      const res = await apiFetch(`/api/v1/admin/notices/${notice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !notice.active }),
      });
      if (res.ok) {
        showToast(notice.active ? 'Aviso desativado.' : 'Aviso reativado!');
        fetchData(false);
      }
    } catch {
      // ignore
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
      {/* ── Toast de Sucesso ── */}
      {successToast && (
        <div className="admin-toast animate-slide-up" role="status">
          <CheckCircleIcon />
          <span>{successToast}</span>
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
              </div>
              <h1 className="admin-header__title">Gestão de Conteúdo Operacional</h1>
            </div>
          </div>

          <div className="admin-header__actions">
            <span className="admin-header__last-update">
              Atualizado às {formatTimeOnly(lastUpdatedAt)}
            </span>

            <button
              type="button"
              className="admin-btn admin-btn--icon-only"
              onClick={() => fetchData(false)}
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

        {/* ── Sub-navegação em Abas Principais ── */}
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
            <Link to="/admin/media" className="admin-subnav__tab">
              📷 Moderação de Fotos &amp; Vídeos
            </Link>
            <Link to="/admin/content" className="admin-subnav__tab admin-subnav__tab--active">
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

        {/* ── Abas de Conteúdo ── */}
        <div className="admin-content-tabs-nav" role="tablist" aria-label="Abas de Conteúdo">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'schedule'}
            className={`admin-content-tab-btn ${activeTab === 'schedule' ? 'admin-content-tab-btn--active' : ''}`}
            onClick={() => handleTabChange('schedule')}
          >
            ⏱️ Programação da Celebração
            {scheduleData && (
              <span className="admin-content-tab-badge">{scheduleData.counts.active}</span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'menu'}
            className={`admin-content-tab-btn ${activeTab === 'menu' ? 'admin-content-tab-btn--active' : ''}`}
            onClick={() => handleTabChange('menu')}
          >
            🍷 Cardápio &amp; Etapas
            {menuData && (
              <span className="admin-content-tab-badge">{menuData.counts.activeSections}</span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'notices'}
            className={`admin-content-tab-btn ${activeTab === 'notices' ? 'admin-content-tab-btn--active' : ''}`}
            onClick={() => handleTabChange('notices')}
          >
            📢 Avisos &amp; Comunicados
            {noticesData && (
              <span className="admin-content-tab-badge">{noticesData.counts.active}</span>
            )}
          </button>
        </div>

        {loading && !scheduleData && !menuData && !noticesData ? (
          <div className="admin-empty-state">
            <span className="admin-spinner" aria-hidden="true" />
            <p>Carregando conteúdos da celebração...</p>
          </div>
        ) : (
          <>
            {/* ══════════════════════════════════════════════════════
                ABA 1: PROGRAMAÇÃO
                ══════════════════════════════════════════════════════ */}
            {activeTab === 'schedule' && scheduleData && (
              <section className="admin-content-section" aria-label="Programação da celebração">
                <div className="admin-section-header">
                  <div className="admin-section-header__title-wrap">
                    <span className="admin-section-icon">⏱️</span>
                    <div>
                      <h2 className="admin-section-title">Linha do Tempo Oficial</h2>
                      <p className="admin-section-subtitle">
                        Horários, atrações e momentos refletidos em tempo real no EVENT_DAY
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    onClick={openCreateScheduleModal}
                  >
                    <PlusIcon />
                    <span>Novo Momento</span>
                  </button>
                </div>

                {/* Estatísticas de Programação */}
                <div className="admin-stats-strip">
                  <div className="admin-stat-item">
                    <span className="admin-stat-item__label">Momentos Cadastrados</span>
                    <strong className="admin-stat-item__value">{scheduleData.counts.total}</strong>
                  </div>
                  <div className="admin-stat-item">
                    <span className="admin-stat-item__label">Ativos no Evento</span>
                    <strong className="admin-stat-item__value admin-text-green">{scheduleData.counts.active}</strong>
                  </div>
                  <div className="admin-stat-item">
                    <span className="admin-stat-item__label">Ocultos / Histórico</span>
                    <strong className="admin-stat-item__value">{scheduleData.counts.inactive}</strong>
                  </div>
                  <div className="admin-stat-item">
                    <span className="admin-stat-item__label">Destaques</span>
                    <strong className="admin-stat-item__value">{scheduleData.counts.highlighted}</strong>
                  </div>
                </div>

                {scheduleData.items.length === 0 ? (
                  <div className="admin-empty-state admin-empty-state--bordered">
                    <p className="admin-empty-state__title">Nenhum momento oficial cadastrado.</p>
                    <p className="admin-empty-state__desc">
                      Cadastre a cerimônia, recepção, brinde e demais atrações para que os convidados acompanhem em tempo real.
                    </p>
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      onClick={openCreateScheduleModal}
                    >
                      <PlusIcon /> Cadastrar primeiro momento
                    </button>
                  </div>
                ) : (
                  <div className="admin-schedule-list">
                    {scheduleData.items.map((item) => (
                      <div
                        key={item.id}
                        className={`admin-schedule-card ${!item.active ? 'admin-schedule-card--inactive' : ''} ${item.highlight ? 'admin-schedule-card--highlight' : ''}`}
                      >
                        <div className="admin-schedule-card__time-col">
                          <span className="admin-schedule-card__time">
                            {item.formattedStartTime}
                          </span>
                          {item.formattedEndTime && (
                            <span className="admin-schedule-card__end-time">
                              até {item.formattedEndTime}
                            </span>
                          )}
                          <span className="admin-schedule-card__order">
                            Ordem #{item.sortOrder}
                          </span>
                        </div>

                        <div className="admin-schedule-card__content-col">
                          <div className="admin-schedule-card__title-row">
                            <h3 className="admin-schedule-card__title">{item.title}</h3>
                            <div className="admin-schedule-card__badges">
                              <span
                                className={`admin-badge admin-badge--status-${item.status.toLowerCase()}`}
                                title={`Status temporal: ${item.statusLabel}`}
                              >
                                {item.statusLabel}
                              </span>
                              {!item.active && (
                                <span className="admin-badge admin-badge--staging" title="Oculto na visão do convidado">
                                  Oculto
                                </span>
                              )}
                              {item.highlight && (
                                <span className="admin-badge admin-badge--highlight" title="Momento em destaque">
                                  ✨ Destaque
                                </span>
                              )}
                            </div>
                          </div>

                          {item.location && (
                            <p className="admin-schedule-card__location">
                              📍 {item.location}
                            </p>
                          )}

                          {item.description && (
                            <p className="admin-schedule-card__desc">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="admin-schedule-card__actions-col">
                          <div className="admin-reorder-buttons">
                            <button
                              type="button"
                              className="admin-btn--icon-sm"
                              onClick={() => handleMoveScheduleOrder(item, -1)}
                              title="Mover para cima"
                              aria-label="Mover para cima"
                            >
                              <ArrowUpIcon />
                            </button>
                            <button
                              type="button"
                              className="admin-btn--icon-sm"
                              onClick={() => handleMoveScheduleOrder(item, 1)}
                              title="Mover para baixo"
                              aria-label="Mover para baixo"
                            >
                              <ArrowDownIcon />
                            </button>
                          </div>

                          <button
                            type="button"
                            className="admin-btn--icon-sm"
                            onClick={() => openEditScheduleModal(item)}
                            title="Editar momento"
                            aria-label="Editar"
                          >
                            <EditIcon />
                          </button>

                          <button
                            type="button"
                            className={`admin-btn--icon-sm ${!item.active ? 'admin-btn--active-toggle' : ''}`}
                            onClick={() => handleToggleScheduleActive(item)}
                            title={item.active ? 'Ocultar momento' : 'Ativar momento'}
                            aria-label={item.active ? 'Ocultar' : 'Ativar'}
                          >
                            {item.active ? <EyeIcon /> : <EyeOffIcon />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ══════════════════════════════════════════════════════
                ABA 2: CARDÁPIO
                ══════════════════════════════════════════════════════ */}
            {activeTab === 'menu' && menuData && (
              <section className="admin-content-section" aria-label="Cardápio da celebração">
                <div className="admin-section-header">
                  <div className="admin-section-header__title-wrap">
                    <span className="admin-section-icon">🍷</span>
                    <div>
                      <h2 className="admin-section-title">Menu da Celebração</h2>
                      <p className="admin-section-subtitle">
                        Etapas gastronômicas e itens que compõem a experiência culinária na La Brace
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    onClick={openCreateSectionModal}
                  >
                    <PlusIcon />
                    <span>Nova Seção Gastronômica</span>
                  </button>
                </div>

                {/* Estatísticas de Cardápio */}
                <div className="admin-stats-strip">
                  <div className="admin-stat-item">
                    <span className="admin-stat-item__label">Seções Cadastradas</span>
                    <strong className="admin-stat-item__value">{menuData.counts.totalSections}</strong>
                  </div>
                  <div className="admin-stat-item">
                    <span className="admin-stat-item__label">Seções Ativas</span>
                    <strong className="admin-stat-item__value admin-text-green">{menuData.counts.activeSections}</strong>
                  </div>
                  <div className="admin-stat-item">
                    <span className="admin-stat-item__label">Total de Itens</span>
                    <strong className="admin-stat-item__value">{menuData.counts.totalItems}</strong>
                  </div>
                  <div className="admin-stat-item">
                    <span className="admin-stat-item__label">Itens Ativos</span>
                    <strong className="admin-stat-item__value admin-text-green">{menuData.counts.activeItems}</strong>
                  </div>
                </div>

                {menuData.sections.length === 0 ? (
                  <div className="admin-empty-state admin-empty-state--bordered">
                    <p className="admin-empty-state__title">Cardápio ainda não informado.</p>
                    <p className="admin-empty-state__desc">
                      Organize as seções gastronômicas (ex: Boas-vindas, Entradas, Pratos Principais, Sobremesas, Bebidas) e seus itens.
                    </p>
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      onClick={openCreateSectionModal}
                    >
                      <PlusIcon /> Criar primeira seção
                    </button>
                  </div>
                ) : (
                  <div className="admin-menu-sections-list">
                    {menuData.sections.map((section) => (
                      <div
                        key={section.id}
                        className={`admin-menu-section-card ${!section.active ? 'admin-menu-section-card--inactive' : ''}`}
                      >
                        <div className="admin-menu-section-header">
                          <div className="admin-menu-section-title-wrap">
                            <h3 className="admin-menu-section-title">{section.title}</h3>
                            <span className="admin-menu-section-order">Ordem #{section.sortOrder}</span>
                            {!section.active && (
                              <span className="admin-badge admin-badge--staging">Seção Inativa</span>
                            )}
                          </div>

                          <div className="admin-menu-section-actions">
                            <div className="admin-reorder-buttons">
                              <button
                                type="button"
                                className="admin-btn--icon-sm"
                                onClick={() => handleMoveSectionOrder(section, -1)}
                                title="Mover seção para cima"
                                aria-label="Mover para cima"
                              >
                                <ArrowUpIcon />
                              </button>
                              <button
                                type="button"
                                className="admin-btn--icon-sm"
                                onClick={() => handleMoveSectionOrder(section, 1)}
                                title="Mover seção para baixo"
                                aria-label="Mover para baixo"
                              >
                                <ArrowDownIcon />
                              </button>
                            </div>

                            <button
                              type="button"
                              className="admin-btn--icon-sm"
                              onClick={() => openEditSectionModal(section)}
                              title="Editar seção"
                              aria-label="Editar"
                            >
                              <EditIcon />
                            </button>

                            <button
                              type="button"
                              className={`admin-btn--icon-sm ${!section.active ? 'admin-btn--active-toggle' : ''}`}
                              onClick={() => handleToggleSectionActive(section)}
                              title={section.active ? 'Desativar seção' : 'Ativar seção'}
                              aria-label={section.active ? 'Desativar' : 'Ativar'}
                            >
                              {section.active ? <EyeIcon /> : <EyeOffIcon />}
                            </button>

                            <button
                              type="button"
                              className="admin-btn admin-btn--sm admin-btn--outline"
                              onClick={() => openCreateItemModal(section.id)}
                            >
                              <PlusIcon /> Item
                            </button>
                          </div>
                        </div>

                        {section.description && (
                          <p className="admin-menu-section-desc">{section.description}</p>
                        )}

                        {/* Itens da Seção */}
                        <div className="admin-menu-items-list">
                          {section.items.length === 0 ? (
                            <p className="admin-menu-items-empty">
                              Nenhum item cadastrado nesta seção ainda.
                            </p>
                          ) : (
                            section.items.map((item) => (
                              <div
                                key={item.id}
                                className={`admin-menu-item-row ${!item.active ? 'admin-menu-item-row--inactive' : ''}`}
                              >
                                <div className="admin-menu-item-info">
                                  <div className="admin-menu-item-name-wrap">
                                    <strong className="admin-menu-item-name">{item.name}</strong>
                                    {!item.active && (
                                      <span className="admin-badge admin-badge--staging">Inativo</span>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="admin-menu-item-desc">{item.description}</p>
                                  )}
                                </div>

                                <div className="admin-menu-item-actions">
                                  <div className="admin-reorder-buttons">
                                    <button
                                      type="button"
                                      className="admin-btn--icon-sm"
                                      onClick={() => handleMoveItemOrder(item, -1)}
                                      title="Mover para cima"
                                      aria-label="Mover para cima"
                                    >
                                      <ArrowUpIcon />
                                    </button>
                                    <button
                                      type="button"
                                      className="admin-btn--icon-sm"
                                      onClick={() => handleMoveItemOrder(item, 1)}
                                      title="Mover para baixo"
                                      aria-label="Mover para baixo"
                                    >
                                      <ArrowDownIcon />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    className="admin-btn--icon-sm"
                                    onClick={() => openEditItemModal(item)}
                                    title="Editar item"
                                    aria-label="Editar"
                                  >
                                    <EditIcon />
                                  </button>

                                  <button
                                    type="button"
                                    className={`admin-btn--icon-sm ${!item.active ? 'admin-btn--active-toggle' : ''}`}
                                    onClick={() => handleToggleItemActive(item)}
                                    title={item.active ? 'Desativar item' : 'Ativar item'}
                                    aria-label={item.active ? 'Desativar' : 'Ativar'}
                                  >
                                    {item.active ? <EyeIcon /> : <EyeOffIcon />}
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ══════════════════════════════════════════════════════
                ABA 3: AVISOS & COMUNICADOS
                ══════════════════════════════════════════════════════ */}
            {activeTab === 'notices' && noticesData && (
              <section className="admin-content-section" aria-label="Avisos e comunicados">
                <div className="admin-section-header">
                  <div className="admin-section-header__title-wrap">
                    <span className="admin-section-icon">📢</span>
                    <div>
                      <h2 className="admin-section-title">Avisos aos Convidados</h2>
                      <p className="admin-section-subtitle">
                        Comunicados e orientações pontuais que aparecem com destaque no EVENT_DAY
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    onClick={openCreateNoticeModal}
                  >
                    <PlusIcon />
                    <span>Novo Aviso</span>
                  </button>
                </div>

                {/* Estatísticas de Avisos */}
                <div className="admin-stats-strip">
                  <div className="admin-stat-item">
                    <span className="admin-stat-item__label">Total de Avisos</span>
                    <strong className="admin-stat-item__value">{noticesData.counts.total}</strong>
                  </div>
                  <div className="admin-stat-item">
                    <span className="admin-stat-item__label">Avisos Ativos</span>
                    <strong className="admin-stat-item__value admin-text-green">{noticesData.counts.active}</strong>
                  </div>
                  <div className="admin-stat-item">
                    <span className="admin-stat-item__label">Visíveis Agora</span>
                    <strong className="admin-stat-item__value admin-text-terracotta">{noticesData.counts.currentlyVisible}</strong>
                  </div>
                  <div className="admin-stat-item">
                    <span className="admin-stat-item__label">Inativos / Expirados</span>
                    <strong className="admin-stat-item__value">{noticesData.counts.inactive}</strong>
                  </div>
                </div>

                {noticesData.notices.length === 0 ? (
                  <div className="admin-empty-state admin-empty-state--bordered">
                    <p className="admin-empty-state__title">Nenhum aviso ativo.</p>
                    <p className="admin-empty-state__desc">
                      Caso haja comunicados extraordinários (ex: chegada do cortejo, clima, orientações especiais), publique aqui.
                    </p>
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      onClick={openCreateNoticeModal}
                    >
                      <PlusIcon /> Criar primeiro aviso
                    </button>
                  </div>
                ) : (
                  <div className="admin-notices-grid">
                    {noticesData.notices.map((notice) => (
                      <div
                        key={notice.id}
                        className={`admin-notice-card ${!notice.active ? 'admin-notice-card--inactive' : ''}`}
                      >
                        <div className="admin-notice-card__header">
                          <div className="admin-notice-card__title-wrap">
                            <h3 className="admin-notice-card__title">{notice.title}</h3>
                            <div className="admin-notice-card__badges">
                              <span className={`admin-badge admin-badge--notice-${notice.statusLabel.toLowerCase()}`}>
                                {notice.statusLabel}
                              </span>
                              {notice.priority > 0 && (
                                <span className="admin-badge admin-badge--highlight">
                                  Prioridade {notice.priority}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="admin-notice-card__actions">
                            <button
                              type="button"
                              className="admin-btn--icon-sm"
                              onClick={() => openEditNoticeModal(notice)}
                              title="Editar aviso"
                              aria-label="Editar"
                            >
                              <EditIcon />
                            </button>

                            <button
                              type="button"
                              className={`admin-btn--icon-sm ${!notice.active ? 'admin-btn--active-toggle' : ''}`}
                              onClick={() => handleToggleNoticeActive(notice)}
                              title={notice.active ? 'Desativar aviso' : 'Ativar aviso'}
                              aria-label={notice.active ? 'Desativar' : 'Ativar'}
                            >
                              {notice.active ? <EyeIcon /> : <EyeOffIcon />}
                            </button>
                          </div>
                        </div>

                        <p className="admin-notice-card__body">{notice.body}</p>

                        {(notice.visibleFrom || notice.visibleUntil) && (
                          <div className="admin-notice-card__dates">
                            {notice.visibleFrom && (
                              <span>Exibir a partir de: {new Date(notice.visibleFrom).toLocaleString('pt-BR')}</span>
                            )}
                            {notice.visibleUntil && (
                              <span>Exibir até: {new Date(notice.visibleUntil).toLocaleString('pt-BR')}</span>
                            )}
                          </div>
                        )}

                        {/* Live Guest Preview */}
                        <div className="admin-notice-preview-box">
                          <span className="admin-notice-preview-label">Visualização do Convidado</span>
                          <div className="event-day-notice-card">
                            <strong className="event-day-notice-title">📢 {notice.title}</strong>
                            <p className="event-day-notice-body">{notice.body}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════
          MODAIS DE CADASTRO E EDIÇÃO
          ══════════════════════════════════════════════════════ */}

      {/* Modal: Programação */}
      {scheduleModalOpen && (
        <div className="admin-modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editingScheduleItem ? 'Editar Momento da Programação' : 'Novo Momento da Programação'}
              </h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setScheduleModalOpen(false)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="admin-modal-form">
              {formError && (
                <div className="admin-alert admin-alert--error">
                  <span>{formError}</span>
                </div>
              )}

              <div className="admin-form-group">
                <label className="admin-label">Título do Momento *</label>
                <input
                  type="text"
                  className="admin-input"
                  value={scheduleForm.title}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                  placeholder="Ex: Cerimônia Religiosa, Chegada dos Noivos, Jantar"
                  required
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Horário de Início *</label>
                  <input
                    type="datetime-local"
                    className="admin-input"
                    value={scheduleForm.startsAt}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startsAt: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Horário de Término (Opcional)</label>
                  <input
                    type="datetime-local"
                    className="admin-input"
                    value={scheduleForm.endsAt}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endsAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Local</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={scheduleForm.location}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                    placeholder="Ex: Santuário de Caravaggio, Salão Principal"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Ordem de Exibição</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={scheduleForm.sortOrder}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, sortOrder: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Descrição / Observações</label>
                <textarea
                  className="admin-textarea"
                  value={scheduleForm.description}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                  placeholder="Detalhes adicionais para orientar os convidados..."
                  rows={3}
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Exibir a partir de (Opcional)</label>
                  <input
                    type="datetime-local"
                    className="admin-input"
                    value={scheduleForm.visibleFrom}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, visibleFrom: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Exibir até (Opcional)</label>
                  <input
                    type="datetime-local"
                    className="admin-input"
                    value={scheduleForm.visibleUntil}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, visibleUntil: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-checkboxes">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={scheduleForm.highlight}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, highlight: e.target.checked })}
                  />
                  <span>✨ Destacar este momento na programação</span>
                </label>

                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={scheduleForm.active}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, active: e.target.checked })}
                  />
                  <span>Ativo (visível aos convidados no dia do casamento)</span>
                </label>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--outline"
                  onClick={() => setScheduleModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Salvando...' : 'Salvar Momento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Seção de Cardápio */}
      {sectionModalOpen && (
        <div className="admin-modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editingSection ? 'Editar Seção Gastronômica' : 'Nova Seção Gastronômica'}
              </h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSectionModalOpen(false)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="admin-modal-form">
              {formError && (
                <div className="admin-alert admin-alert--error">
                  <span>{formError}</span>
                </div>
              )}

              <div className="admin-form-group">
                <label className="admin-label">Título da Seção *</label>
                <input
                  type="text"
                  className="admin-input"
                  value={sectionForm.title}
                  onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                  placeholder="Ex: Boas-vindas, Entradas, Pratos Principais, Sobremesas, Bebidas"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Descrição da Seção</label>
                <textarea
                  className="admin-textarea"
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  placeholder="Ex: Seleção de antepastos italianos e pães artesanais"
                  rows={2}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Ordem de Apresentação</label>
                <input
                  type="number"
                  className="admin-input"
                  value={sectionForm.sortOrder}
                  onChange={(e) => setSectionForm({ ...sectionForm, sortOrder: parseInt(e.target.value, 10) || 0 })}
                />
              </div>

              <div className="admin-form-checkboxes">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={sectionForm.active}
                    onChange={(e) => setSectionForm({ ...sectionForm, active: e.target.checked })}
                  />
                  <span>Seção ativa no cardápio</span>
                </label>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--outline"
                  onClick={() => setSectionModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Salvando...' : 'Salvar Seção'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Item de Cardápio */}
      {itemModalOpen && (
        <div className="admin-modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editingItem ? 'Editar Item do Cardápio' : 'Novo Item do Cardápio'}
              </h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setItemModalOpen(false)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="admin-modal-form">
              {formError && (
                <div className="admin-alert admin-alert--error">
                  <span>{formError}</span>
                </div>
              )}

              <div className="admin-form-group">
                <label className="admin-label">Nome do Item / Prato *</label>
                <input
                  type="text"
                  className="admin-input"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="Ex: Risoto de Alho-Poró com Parmesão"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Descrição / Ingredientes / Harmonização</label>
                <textarea
                  className="admin-textarea"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Ex: Arroz arbóreo, alho-poró fresco e queijo parmesão maturado 12 meses"
                  rows={2}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Ordem</label>
                <input
                  type="number"
                  className="admin-input"
                  value={itemForm.sortOrder}
                  onChange={(e) => setItemForm({ ...itemForm, sortOrder: parseInt(e.target.value, 10) || 0 })}
                />
              </div>

              <div className="admin-form-checkboxes">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={itemForm.active}
                    onChange={(e) => setItemForm({ ...itemForm, active: e.target.checked })}
                  />
                  <span>Item ativo no cardápio</span>
                </label>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--outline"
                  onClick={() => setItemModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Salvando...' : 'Salvar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Aviso / Comunicado */}
      {noticeModalOpen && (
        <div className="admin-modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editingNotice ? 'Editar Aviso' : 'Novo Aviso / Comunicado'}
              </h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setNoticeModalOpen(false)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="admin-modal-form">
              {formError && (
                <div className="admin-alert admin-alert--error">
                  <span>{formError}</span>
                </div>
              )}

              <div className="admin-form-group">
                <label className="admin-label">Título do Aviso *</label>
                <input
                  type="text"
                  className="admin-input"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  placeholder="Ex: Chegada dos Noivos na Recepção"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Mensagem aos Convidados *</label>
                <textarea
                  className="admin-textarea"
                  value={noticeForm.body}
                  onChange={(e) => setNoticeForm({ ...noticeForm, body: e.target.value })}
                  placeholder="Escreva a mensagem clara que os convidados verão no topo do convite..."
                  rows={3}
                  required
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Prioridade de Exibição</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={noticeForm.priority}
                    onChange={(e) => setNoticeForm({ ...noticeForm, priority: parseInt(e.target.value, 10) || 0 })}
                    placeholder="0 = Padrão, 1+ = Prioritário"
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Exibir a partir de (Opcional)</label>
                  <input
                    type="datetime-local"
                    className="admin-input"
                    value={noticeForm.visibleFrom}
                    onChange={(e) => setNoticeForm({ ...noticeForm, visibleFrom: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Exibir até (Opcional)</label>
                  <input
                    type="datetime-local"
                    className="admin-input"
                    value={noticeForm.visibleUntil}
                    onChange={(e) => setNoticeForm({ ...noticeForm, visibleUntil: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-form-checkboxes">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={noticeForm.active}
                    onChange={(e) => setNoticeForm({ ...noticeForm, active: e.target.checked })}
                  />
                  <span>Aviso ativo (publicado)</span>
                </label>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--outline"
                  onClick={() => setNoticeModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Salvando...' : 'Salvar Aviso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
