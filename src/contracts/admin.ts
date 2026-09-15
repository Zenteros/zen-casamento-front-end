import type { MediaType, MediaStatus, MediaProcessingStatus, AdminUserDTO } from './event.js';
export type { AdminUserDTO };

export interface AdminLoginRequestDTO {
  email: string;
  password?: string;
}

export interface AdminLoginResponseDTO {
  success: boolean;
  user: AdminUserDTO;
}

export interface AdminMediaStatusUpdateRequestDTO {
  status: 'APPROVED' | 'REJECTED';
}

export interface AdminMediaItemDTO {
  id: string;
  inviteId: string;
  familyTitle: string;
  type: MediaType;
  status: MediaStatus;
  processingStatus: MediaProcessingStatus;
  featured: boolean;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  hasThumb: boolean;
  hasDisplay: boolean;
  uploadedAt: string;
  reviewedAt?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPaginationDTO {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface AdminMediaCountsDTO {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface AdminMediaListResponseDTO {
  items: AdminMediaItemDTO[];
  pagination: AdminPaginationDTO;
  counts: AdminMediaCountsDTO;
}

export interface AdminOverviewEventDTO {
  id: string;
  coupleDisplayName: string;
  weddingDate: string;
  timezone: string;
  ceremonyAt: string;
  receptionAt: string | null;
  eventEndsAt: string | null;
  ceremonyVenue: string;
  ceremonyAddress: string;
  receptionVenue: string;
  receptionAddress: string;
  phase: string;
  phaseLabel: string;
}

export interface AdminOverviewGuestsDTO {
  total: number;
  confirmed: number;
  declined: number;
  pending: number;
  checkedIn: number;
  notCheckedIn: number;
  withTable: number;
  withoutTable: number;
  childrenCount: number;
  adultsCount: number;
}

export interface AdminOverviewInvitesDTO {
  total: number;
  fullyResponded: number;
  pending: number;
}

export interface AdminOverviewMediaDTO {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  photos: number;
  videos: number;
}

export interface AdminOverviewScheduleItemDTO {
  id: string;
  title: string;
  formattedStartTime: string;
  formattedEndTime: string | null;
  location: string | null;
}

export interface AdminOverviewScheduleDTO {
  current: AdminOverviewScheduleItemDTO | null;
  next: AdminOverviewScheduleItemDTO | null;
  totalItems: number;
}

export interface AdminOverviewMenuDTO {
  sectionsCount: number;
  itemsCount: number;
  hasMenu: boolean;
}

export interface AdminOverviewNoticeItemDTO {
  id: string;
  title: string;
  body: string;
  priority: number;
  createdAt: string;
}

export interface AdminOverviewNoticesDTO {
  activeCount: number;
  recent: AdminOverviewNoticeItemDTO[];
}

export interface AdminOverviewAlertDTO {
  id: string;
  type: 'warning' | 'info';
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
}

export interface AdminOverviewDTO {
  event: AdminOverviewEventDTO;
  guests: AdminOverviewGuestsDTO;
  invites: AdminOverviewInvitesDTO;
  media: AdminOverviewMediaDTO;
  schedule: AdminOverviewScheduleDTO;
  menu: AdminOverviewMenuDTO;
  notices: AdminOverviewNoticesDTO;
  alerts: AdminOverviewAlertDTO[];
  environment: 'development' | 'production' | 'staging';
  updatedAt: string;
}

export type ConsolidatedRsvpStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';

export function calculateConsolidatedInviteStatus(
  guests: Array<{ rsvp?: { status: string } | null }>
): ConsolidatedRsvpStatus {
  if (!guests || guests.length === 0) {
    return 'PENDING';
  }
  const hasPending = guests.some((g) => !g.rsvp || g.rsvp.status === 'PENDING');
  if (hasPending) {
    return 'PENDING';
  }
  const allDeclined = guests.every((g) => g.rsvp?.status === 'DECLINED');
  if (allDeclined) {
    return 'DECLINED';
  }
  return 'CONFIRMED';
}

export interface AdminCreateGuestInputDTO {
  name: string;
  isChild?: boolean;
}

export interface AdminCreateInviteDTO {
  familyTitle: string;
  guests: AdminCreateGuestInputDTO[];
}

export interface AdminUpdateInviteDTO {
  familyTitle: string;
}

export interface AdminCreateGuestDTO {
  name: string;
  isChild?: boolean;
}

export interface AdminUpdateGuestDTO {
  name?: string;
  isChild?: boolean;
}

export interface AdminGuestItemDTO {
  id: string;
  name: string;
  isChild: boolean;
  tableId: string | null;
  tableName: string | null;
  rsvp: {
    status: 'PENDING' | 'CONFIRMED' | 'DECLINED';
    dietaryRestrictions: string | null;
    confirmedAt: string | null;
  } | null;
  checkIn: {
    checkedInAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInviteGuestSummaryDTO {
  id: string;
  name: string;
  isChild: boolean;
  rsvpStatus: 'PENDING' | 'CONFIRMED' | 'DECLINED';
  tableName: string | null;
  isCheckedIn: boolean;
}

export interface AdminInviteItemDTO {
  id: string;
  familyTitle: string;
  token: string;
  guestsCount: number;
  confirmedCount: number;
  declinedCount: number;
  pendingCount: number;
  childrenCount: number;
  adultsCount: number;
  consolidatedStatus: ConsolidatedRsvpStatus;
  tableSummary: string;
  hasTable: boolean;
  checkInSummary: 'ALL_PRESENT' | 'PARTIAL' | 'NOT_CHECKED_IN';
  checkedInCount: number;
  isDev: boolean;
  guests: AdminInviteGuestSummaryDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminInviteDetailDTO {
  id: string;
  familyTitle: string;
  token: string;
  consolidatedStatus: ConsolidatedRsvpStatus;
  guests: AdminGuestItemDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminInviteCountsDTO {
  totalInvites: number;
  totalGuests: number;
  confirmedGuests: number;
  declinedGuests: number;
  pendingGuests: number;
  checkedInGuests: number;
  childrenGuests: number;
  withoutTableGuests: number;
}

export interface AdminInviteListResponseDTO {
  items: AdminInviteItemDTO[];
  pagination: AdminPaginationDTO;
  counts: AdminInviteCountsDTO;
}

export interface AdminCreateTableDTO {
  name: string;
  capacity: number;
  locationHint?: string | null;
  sortOrder?: number;
}

export interface AdminUpdateTableDTO {
  name?: string;
  capacity?: number;
  locationHint?: string | null;
  sortOrder?: number;
}

export interface AdminAssignGuestTableDTO {
  tableId: string | null;
}

export interface AdminAssignInviteTableDTO {
  tableId: string | null;
}

export interface AdminTableGuestSummaryDTO {
  id: string;
  name: string;
  inviteId: string;
  familyTitle: string;
  rsvpStatus: 'PENDING' | 'CONFIRMED' | 'DECLINED';
  dietaryRestrictions: string | null;
  isChild: boolean;
  isCheckedIn: boolean;
}

export interface AdminTableItemDTO {
  id: string;
  name: string;
  capacity: number;
  locationHint: string | null;
  sortOrder: number;
  occupied: number;
  available: number;
  isFull: boolean;
  guests: AdminTableGuestSummaryDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminTableCountsDTO {
  totalTables: number;
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  fullTables: number;
  tablesWithAvailableSeats: number;
  emptyTables: number;
  withoutTableGuests: number;
}

export interface AdminTableListResponseDTO {
  tables: AdminTableItemDTO[];
  counts: AdminTableCountsDTO;
  unassignedGuests: AdminTableGuestSummaryDTO[];
}

export interface AdminCreateScheduleItemDTO {
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  visibleFrom?: string | null;
  visibleUntil?: string | null;
  location?: string | null;
  sortOrder?: number;
  active?: boolean;
  highlight?: boolean;
}

export interface AdminUpdateScheduleItemDTO {
  title?: string;
  description?: string | null;
  startsAt?: string;
  endsAt?: string | null;
  visibleFrom?: string | null;
  visibleUntil?: string | null;
  location?: string | null;
  sortOrder?: number;
  active?: boolean;
  highlight?: boolean;
}

export interface AdminScheduleItemDetailDTO {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  visibleFrom: string | null;
  visibleUntil: string | null;
  location: string | null;
  sortOrder: number;
  active: boolean;
  highlight: boolean;
  status: 'PAST' | 'HAPPENING_NOW' | 'NEXT' | 'FUTURE';
  statusLabel: string;
  formattedStartTime: string;
  formattedEndTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminScheduleListResponseDTO {
  items: AdminScheduleItemDetailDTO[];
  counts: {
    total: number;
    active: number;
    inactive: number;
    highlighted: number;
  };
}

export interface AdminCreateMenuSectionDTO {
  title: string;
  description?: string | null;
  sortOrder?: number;
  active?: boolean;
}

export interface AdminUpdateMenuSectionDTO {
  title?: string;
  description?: string | null;
  sortOrder?: number;
  active?: boolean;
}

export interface AdminCreateMenuItemDTO {
  name: string;
  description?: string | null;
  sortOrder?: number;
  active?: boolean;
}

export interface AdminUpdateMenuItemDTO {
  name?: string;
  description?: string | null;
  sortOrder?: number;
  active?: boolean;
}

export interface AdminMenuItemDetailDTO {
  id: string;
  menuSectionId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMenuSectionDetailDTO {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  items: AdminMenuItemDetailDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminMenuListResponseDTO {
  sections: AdminMenuSectionDetailDTO[];
  counts: {
    totalSections: number;
    activeSections: number;
    totalItems: number;
    activeItems: number;
  };
}

export interface AdminCreateNoticeDTO {
  title: string;
  body: string;
  priority?: number;
  active?: boolean;
  visibleFrom?: string | null;
  visibleUntil?: string | null;
}

export interface AdminUpdateNoticeDTO {
  title?: string;
  body?: string;
  priority?: number;
  active?: boolean;
  visibleFrom?: string | null;
  visibleUntil?: string | null;
}

export interface AdminNoticeItemDetailDTO {
  id: string;
  title: string;
  body: string;
  priority: number;
  active: boolean;
  visibleFrom: string | null;
  visibleUntil: string | null;
  isCurrentlyVisible: boolean;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNoticeListResponseDTO {
  notices: AdminNoticeItemDetailDTO[];
  counts: {
    total: number;
    active: number;
    currentlyVisible: number;
    inactive: number;
  };
}

/* ──────────────────────────────────────────────
   IMPORTAÇÃO EM LOTE DE CONVIDADOS (CSV)
   ────────────────────────────────────────────── */

export interface AdminImportPreviewRequestDTO {
  csvContent: string;
}

export interface AdminImportPreviewParsedGuestDTO {
  name: string;
  isChild: boolean;
  rowNumber: number;
}

export interface AdminImportPreviewParsedFamilyDTO {
  familyTitle: string;
  guests: AdminImportPreviewParsedGuestDTO[];
  status: 'NEW' | 'EXISTING_FAMILY_CONFLICT';
  conflicts: string[];
}

export interface AdminImportRowErrorDTO {
  rowNumber: number;
  line: string;
  reason: string;
}

export interface AdminImportRowWarningDTO {
  rowNumber: number;
  line: string;
  message: string;
}

export interface AdminImportCsvDuplicateDTO {
  familyTitle: string;
  guestName: string;
  rows: number[];
}

export interface AdminImportPreviewResponseDTO {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  familiesCount: number;
  guestsCount: number;
  childrenCount: number;
  families: AdminImportPreviewParsedFamilyDTO[];
  errors: AdminImportRowErrorDTO[];
  warnings: AdminImportRowWarningDTO[];
  duplicatesInCsv: AdminImportCsvDuplicateDTO[];
  canProceed: boolean;
}

export interface AdminImportConfirmGuestInputDTO {
  name: string;
  isChild?: boolean;
}

export interface AdminImportConfirmFamilyInputDTO {
  familyTitle: string;
  guests: AdminImportConfirmGuestInputDTO[];
}

export interface AdminImportConfirmRequestDTO {
  families: AdminImportConfirmFamilyInputDTO[];
}

export interface AdminImportConfirmResponseDTO {
  success: boolean;
  importedFamilies: number;
  importedGuests: number;
  importedChildren: number;
  message: string;
}

