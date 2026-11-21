export interface ScreenMediaItemDTO {
  id: string;
  type: 'PHOTO' | 'VIDEO';
  uploadedAt: string;
  reviewedAt?: string | null;
  /** Presente apenas em vídeos: MIME do original (video/mp4 ou video/quicktime). */
  mimeType?: string;
}

export interface ScreenMediaFeedResponseDTO {
  items: ScreenMediaItemDTO[];
}

export interface ScreenFeedQueryDTO {
  limit?: number;
  /** Tipos separados por vírgula. Sem o parâmetro, a API devolve só fotos. */
  types?: string;
}

export interface ScreenBootstrapBodyDTO {
  token: string;
}

export interface ScreenBootstrapResponseDTO {
  success: boolean;
  message: string;
}
