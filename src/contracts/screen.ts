export interface ScreenMediaItemDTO {
  id: string;
  type: 'PHOTO';
  uploadedAt: string;
  reviewedAt?: string | null;
}

export interface ScreenMediaFeedResponseDTO {
  items: ScreenMediaItemDTO[];
}

export interface ScreenFeedQueryDTO {
  limit?: number;
}

export interface ScreenBootstrapBodyDTO {
  token: string;
}

export interface ScreenBootstrapResponseDTO {
  success: boolean;
  message: string;
}
