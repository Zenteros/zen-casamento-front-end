export type RsvpStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';

export interface GuestRsvpItem {
  guestId: string;
  status: 'CONFIRMED' | 'DECLINED';
  dietaryRestrictions?: string | null;
}

export interface SubmitRsvpInput {
  rsvps: GuestRsvpItem[];
}

export interface GuestRsvpDTO {
  id: string;
  guestId: string;
  status: RsvpStatus;
  dietaryRestrictions?: string | null;
  confirmedAt?: string | null;
}

export interface GuestDTO {
  id: string;
  inviteId: string;
  name: string;
  isChild: boolean;
  tableId?: string | null;
  rsvp?: GuestRsvpDTO | null;
}

export interface InviteDTO {
  id: string;
  familyTitle: string;
  guests: GuestDTO[];
}
