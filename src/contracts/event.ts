export type EventPhase = 'PRE_EVENT' | 'EVENT_DAY' | 'POST_EVENT';

export interface EventStateDTO {
  phase: EventPhase;
  now: string;
  timezone: string;
  weddingDate: string;
  ceremonyAt: string;
  receptionAt?: string | null;
  eventEndsAt?: string | null;
  nextTransitionAt?: string | null;
}

export type MediaType = 'PHOTO' | 'VIDEO';

export type MediaStatus =
  | 'PENDING_VALIDATION'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'HIDDEN';

export type MediaProcessingStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'UNSUPPORTED';

export type MediaVariant = 'thumb' | 'display' | 'original';

export interface WeddingEventDTO {
  id: string;
  coupleDisplayName: string;
  weddingDate: string;
  timezone: string;
  ceremonyAt: string;
  receptionAt?: string | null;
  eventEndsAt?: string | null;
  ceremonyVenue: string;
  ceremonyAddress: string;
  receptionVenue: string;
  receptionAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface TableDTO {
  id: string;
  name: string;
  capacity: number;
  locationHint?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInDTO {
  id: string;
  guestId: string;
  checkedInAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInRequestDTO {
  guestId: string;
}

export interface CheckInResponseDTO {
  success: boolean;
  message?: string;
  checkIn: CheckInDTO;
}

export interface MenuItemDTO {
  id: string;
  menuSectionId: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuSectionDTO {
  id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  active: boolean;
  items?: MenuItemDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleItemDTO {
  id: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  visibleFrom?: string | null;
  visibleUntil?: string | null;
  location?: string | null;
  sortOrder: number;
  active: boolean;
  highlight: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItemDTO {
  id: string;
  inviteId: string;
  uploadedByGuestId?: string | null;
  type: MediaType;
  status: MediaStatus;
  processingStatus: MediaProcessingStatus;
  featured: boolean;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
  caption?: string | null;
  capturedAt?: string | null;
  uploadedAt: string;
  reviewedAt?: string | null;
  displayedAt?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
] as const;

export const ALLOWED_MEDIA_MIME_TYPES = [
  ...PHOTO_MIME_TYPES,
  ...VIDEO_MIME_TYPES,
] as const;

export type AllowedMediaMimeType = typeof ALLOWED_MEDIA_MIME_TYPES[number];

export const MAX_PHOTO_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export interface MediaUploadResponseDTO {
  success: boolean;
  message?: string;
  media: {
    id: string;
    type: MediaType;
    status: MediaStatus;
    processingStatus: MediaProcessingStatus;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    width?: number | null;
    height?: number | null;
    hasThumb: boolean;
    hasDisplay: boolean;
    createdAt: string;
  };
}

export interface MediaMineItemDTO {
  id: string;
  type: MediaType;
  status: MediaStatus;
  processingStatus: MediaProcessingStatus;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  hasThumb: boolean;
  hasDisplay: boolean;
  uploadedAt: string;
  createdAt: string;
}

export interface MediaMineListResponseDTO {
  mediaItems: MediaMineItemDTO[];
}

export interface NoticeDTO {
  id: string;
  title: string;
  body: string;
  visibleFrom?: string | null;
  visibleUntil?: string | null;
  priority: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDTO {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GuestTableInfoDTO {
  guestId: string;
  guestName: string;
  table: TableDTO | null;
}

export interface GuestCheckInInfoDTO {
  guestId: string;
  guestName: string;
  checkedIn: boolean;
  checkedInAt: string | null;
}

export interface GuestDietaryInfoDTO {
  guestId: string;
  guestName: string;
  dietaryRestrictions: string | null;
}

export interface EventDayContextDTO {
  weddingEvent: WeddingEventDTO;
  notices: NoticeDTO[];
  currentScheduleItem?: ScheduleItemDTO | null;
  nextScheduleItem: ScheduleItemDTO | null;
  scheduleItems: ScheduleItemDTO[];
  menuSections: MenuSectionDTO[];
  guestsTableInfo: GuestTableInfoDTO[];
  guestsCheckInInfo: GuestCheckInInfoDTO[];
  guestsDietaryInfo: GuestDietaryInfoDTO[];
  isDevelopmentPlaceholder?: boolean;
}
