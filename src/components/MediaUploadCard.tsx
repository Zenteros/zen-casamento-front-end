import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { MediaMineItemDTO, MediaVisibility } from '../contracts/index.js';
import { buildApiUrl, apiFetch } from '../lib/api.js';

/* ──────────────────────────────────────────────
   Central de envio de fotos e vídeos.
   Usada na Home do dia (convite da família) e na página /festa (QR das mesas).
   O convidado tira na hora ou escolhe várias da galeria; os arquivos sobem um por vez.
   ────────────────────────────────────────────── */

const CheckIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const CameraIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const VideoIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_FILES_PER_BATCH = 20;

function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || /\.(mp4|mov)$/i.test(file.name);
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(file.name);
}

/** Valida o arquivo no celular antes de gastar dados enviando. Retorna o motivo da recusa ou null. */
function validateFile(file: File): string | null {
  const isImage = isImageFile(file);
  const isVideo = isVideoFile(file);
  if (!isImage && !isVideo) return `"${file.name}" não é foto (JPEG, PNG, WebP) nem vídeo (MP4, MOV).`;
  if (isImage && file.size > MAX_PHOTO_BYTES) return `A foto "${file.name}" passa de 15 MB.`;
  if (isVideo && file.size > MAX_VIDEO_BYTES) return `O vídeo "${file.name}" passa de 100 MB. Escolha um trecho mais curto.`;
  return null;
}

/** Envia um arquivo, repetindo sozinho quando o servidor está momentaneamente ocupado. */
async function uploadOne(file: File, visibility: MediaVisibility): Promise<void> {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const MAX_ATTEMPTS = 4;
  let res: Response | null = null;
  let data: { error?: string; code?: string } = {};

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const formData = new FormData();
    // O campo precisa vir antes do arquivo para o servidor ler junto com o upload
    formData.append('visibility', visibility);
    formData.append('file', file);

    res = await apiFetch(`/api/v1/event/media${search}`, {
      method: 'POST',
      body: formData,
    });
    data = await res.json().catch(() => ({}));

    // Servidor momentaneamente ocupado processando fotos (pico de envios):
    // tenta de novo sozinho com espera crescente, sem o convidado perceber.
    const isCapacityBusy =
      res.status === 429 &&
      (data.code === 'PHOTO_CAPACITY_EXCEEDED' || /ao mesmo tempo/i.test(data.error || ''));
    if (!isCapacityBusy || attempt === MAX_ATTEMPTS) break;
    await new Promise((resolve) => setTimeout(resolve, 2000 * attempt + Math.random() * 1500));
  }

  if (!res || !res.ok) {
    throw new Error(data.error || 'Não foi possível enviar a mídia no momento. Tente novamente.');
  }
}

interface MediaUploadCardProps {
  /** Variante visual: dentro da Home do dia ou como destaque único da página /festa. */
  variant?: 'event-day' | 'standalone';
}

export const MediaUploadCard: React.FC<MediaUploadCardProps> = ({ variant = 'event-day' }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoCaptureRef = useRef<HTMLInputElement | null>(null);
  const videoCaptureRef = useRef<HTMLInputElement | null>(null);
  const [visibility, setVisibility] = useState<MediaVisibility>('PUBLIC');
  const [lastSentVisibility, setLastSentVisibility] = useState<MediaVisibility>('PUBLIC');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [mineMediaList, setMineMediaList] = useState<MediaMineItemDTO[]>([]);

  const fetchMineMedia = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/event/media/mine', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setMineMediaList(data.mediaItems || []);
      }
    } catch {
      // Falha silenciosa: a lista é complementar ao envio
    }
  }, []);

  useEffect(() => {
    fetchMineMedia();
  }, [fetchMineMedia]);

  // Libera a URL de pré-visualização ao trocar de seleção ou desmontar
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const resetInput = () => {
    for (const input of [fileInputRef.current, photoCaptureRef.current, videoCaptureRef.current]) {
      if (input) input.value = '';
    }
  };

  const applySelection = (files: File[]) => {
    setSelectedFiles(files);
    const single = files.length === 1 ? files[0] : null;
    setPreviewUrl(single && !isVideoFile(single) ? URL.createObjectURL(single) : null);
  };

  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    resetInput();
    if (picked.length === 0) return;

    setUploadError(null);
    setUploadSuccess(null);

    const rejections: string[] = [];
    const valid: File[] = [];
    for (const file of picked) {
      const reason = validateFile(file);
      if (reason) rejections.push(reason);
      else valid.push(file);
    }

    if (valid.length > MAX_FILES_PER_BATCH) {
      rejections.push(`Envie até ${MAX_FILES_PER_BATCH} arquivos por vez. Separamos os ${MAX_FILES_PER_BATCH} primeiros.`);
      valid.length = MAX_FILES_PER_BATCH;
    }

    if (rejections.length > 0) setUploadError(rejections.join(' '));
    applySelection(valid);
  };

  const handleCancelSelection = () => {
    setSelectedFiles([]);
    setPreviewUrl(null);
    setUploadError(null);
    resetInput();
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || isUploading) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const failed: File[] = [];
    let lastError = '';
    let sent = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      setProgress({ current: i + 1, total: selectedFiles.length });
      try {
        await uploadOne(selectedFiles[i], visibility);
        sent++;
      } catch (err: unknown) {
        failed.push(selectedFiles[i]);
        lastError = (err as Error).message || 'Erro ao enviar foto ou vídeo.';
      }
    }

    setProgress(null);
    setIsUploading(false);
    await fetchMineMedia();

    if (sent > 0) {
      setLastSentVisibility(visibility);
      setUploadSuccess(sent === 1 ? 'Recebemos seu registro ❤️' : `Recebemos seus ${sent} registros ❤️`);
      setTimeout(() => setUploadSuccess(null), 7000);
    }

    if (failed.length > 0) {
      // Mantém só o que falhou selecionado, para tentar de novo com um toque
      applySelection(failed);
      setUploadError(
        failed.length === 1
          ? lastError
          : `${failed.length} arquivos não foram enviados. ${lastError} Toque em enviar para tentar de novo.`
      );
    } else {
      handleCancelSelection();
    }
  };

  const totalMb = selectedFiles.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);
  const single = selectedFiles.length === 1 ? selectedFiles[0] : null;

  return (
    <div className={`event-day-card event-day-card--media${variant === 'standalone' ? ' event-day-card--media-standalone' : ''}`}>
      <div className="event-day-media-callout">
        <div className="event-day-media-callout__icon">
          <CameraIcon />
        </div>
        <h2 id="heading-media" className="event-day-media-callout__title">
          Registre Esse Momento
        </h2>
        <p className="event-day-media-callout__text">
          Tire fotos e grave vídeos aqui mesmo, na hora. Escolha se vai para o telão da festa ou fica só para os noivos.
        </p>

        {/* Câmera direto: abre a câmera do celular sem passar pela galeria */}
        <input
          ref={photoCaptureRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleSelectFiles}
          aria-label="Tirar foto com a câmera"
        />
        <input
          ref={videoCaptureRef}
          type="file"
          accept="video/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleSelectFiles}
          aria-label="Gravar vídeo com a câmera"
        />

        {/* Galeria (opção secundária). Sem image/heic no accept de propósito: assim o iOS converte para JPEG (o servidor não gera a versão do telão a partir de HEIC). */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          style={{ display: 'none' }}
          onChange={handleSelectFiles}
          aria-label="Selecionar fotos ou vídeos"
        />

        <div className="event-day-visibility" role="radiogroup" aria-label="Onde seu registro vai aparecer">
          <button
            type="button"
            role="radio"
            aria-checked={visibility === 'PUBLIC'}
            className={`event-day-visibility__opt${visibility === 'PUBLIC' ? ' event-day-visibility__opt--active' : ''}`}
            onClick={() => setVisibility('PUBLIC')}
            disabled={isUploading}
          >
            <strong>📺 Telão</strong>
            <span>Todos veem na festa</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={visibility === 'PRIVATE'}
            className={`event-day-visibility__opt${visibility === 'PRIVATE' ? ' event-day-visibility__opt--active' : ''}`}
            onClick={() => setVisibility('PRIVATE')}
            disabled={isUploading}
          >
            <strong>🔒 Só para os noivos</strong>
            <span>Fica na galeria deles</span>
          </button>
        </div>

        {selectedFiles.length === 0 && (
          <div className="event-day-media-callout__action">
            <div className="event-day-capture-row">
              <button
                type="button"
                className="event-day-cta-btn event-day-cta-btn--photo"
                onClick={() => photoCaptureRef.current?.click()}
              >
                <CameraIcon />
                <span>Tirar foto</span>
              </button>
              <button
                type="button"
                className="event-day-cta-btn event-day-cta-btn--photo"
                onClick={() => videoCaptureRef.current?.click()}
              >
                <VideoIcon />
                <span>Gravar vídeo</span>
              </button>
            </div>
            <button
              type="button"
              className="event-day-gallery-link"
              onClick={() => fileInputRef.current?.click()}
            >
              ou escolher da galeria
            </button>
            <p className="event-day-media-callout__hint">
              Fotos até 15 MB • Vídeos até 100 MB
            </p>
          </div>
        )}

        {uploadError && (
          <div className="event-day-media-error animate-fade-in" role="alert">
            <span>{uploadError}</span>
            <button
              type="button"
              className="event-day-media-error__close"
              onClick={() => setUploadError(null)}
              aria-label="Fechar aviso de erro"
            >
              ✕
            </button>
          </div>
        )}

        {uploadSuccess && (
          <div className="event-day-media-success animate-fade-in" role="status">
            <div className="event-day-media-success__title">
              <CheckIcon /> {uploadSuccess}
            </div>
            <p className="event-day-media-success__text">
              {lastSentVisibility === 'PRIVATE'
                ? 'Guardado na galeria dos noivos.'
                : 'As fotos já entram na fila do telão.'}
            </p>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="event-day-media-preview-card animate-fade-in">
            <div className="event-day-media-preview-header">
              <span className="event-day-media-preview-header__tag">
                {single
                  ? isVideoFile(single) ? '🎬 Vídeo Selecionado' : '📷 Foto Selecionada'
                  : `📷 ${selectedFiles.length} arquivos selecionados`}
              </span>
              <span className="event-day-media-preview-header__size">
                {totalMb.toFixed(1)} MB
              </span>
            </div>

            {previewUrl ? (
              <div className="event-day-media-preview-img-wrap">
                <img
                  src={previewUrl}
                  alt="Pré-visualização da foto selecionada"
                  className="event-day-media-preview-img"
                />
              </div>
            ) : (
              <div className="event-day-media-preview-video-box">
                <div className="event-day-media-preview-video-box__icon">{single ? '🎬' : '🎞️'}</div>
                <strong className="event-day-media-preview-video-box__name">
                  {single ? single.name : `${selectedFiles.filter(isVideoFile).length} vídeo(s) e ${selectedFiles.filter((f) => !isVideoFile(f)).length} foto(s)`}
                </strong>
              </div>
            )}

            <div className="event-day-media-preview-actions">
              <button
                type="button"
                className="event-day-btn event-day-btn--upload-submit"
                disabled={isUploading}
                onClick={handleUpload}
              >
                {isUploading ? (
                  <>
                    <span className="event-day-spinner" aria-hidden="true" />
                    <span>
                      {progress && progress.total > 1
                        ? `Enviando ${progress.current} de ${progress.total}...`
                        : 'Enviando registro...'}
                    </span>
                  </>
                ) : (
                  'Enviar para o Casamento ❤️'
                )}
              </button>

              <button
                type="button"
                className="event-day-btn event-day-btn--upload-cancel"
                disabled={isUploading}
                onClick={handleCancelSelection}
              >
                Trocar seleção
              </button>
            </div>
          </div>
        )}

        {mineMediaList.length > 0 && (
          <div className="event-day-mine-media-wrap">
            <div className="event-day-mine-media-header">
              <h3 className="event-day-mine-media-title">
                Seus Registros Enviados ({mineMediaList.length})
              </h3>
            </div>

            <div className="event-day-mine-media-list">
              {mineMediaList.map((item) => (
                <div key={item.id} className="event-day-mine-media-item">
                  <div className="event-day-mine-media-item__info">
                    {item.type === 'PHOTO' && item.hasThumb ? (
                      <div className="event-day-mine-media-thumb-wrap">
                        <img
                          src={buildApiUrl(`/api/v1/event/media/${item.id}/file?variant=thumb`)}
                          alt={item.originalFileName}
                          className="event-day-mine-media-thumb"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="event-day-mine-media-thumb-wrap event-day-mine-media-thumb-wrap--placeholder">
                        <span>{item.type === 'VIDEO' ? '🎬' : '📷'}</span>
                      </div>
                    )}
                    <span className="event-day-mine-media-item__name">
                      {item.originalFileName}
                    </span>
                  </div>
                  <span
                    className={`event-day-status-pill ${
                      item.visibility === 'PRIVATE' ? 'event-day-status-pill--pending' : 'event-day-status-pill--present'
                    }`}
                  >
                    {item.status === 'HIDDEN' || item.status === 'REJECTED'
                      ? 'Oculto'
                      : item.visibility === 'PRIVATE'
                        ? '🔒 Só noivos'
                        : item.type === 'VIDEO'
                          ? '🎬 Compartilhado'
                          : '📺 No telão'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
