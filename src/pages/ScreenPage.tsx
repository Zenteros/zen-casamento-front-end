import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ScreenMediaItemDTO } from '../contracts/index.js';
import { Monogram } from '../components/Monogram.js';
import { buildApiUrl, apiFetch } from '../lib/api.js';
const SLIDE_DURATION_MS = 10000; // 10 segundos por foto
const POLLING_INTERVAL_MS = 10000; // 10 segundos de polling
const CURSOR_HIDE_DELAY_MS = 3000; // 3 segundos para ocultar cursor

const FullscreenIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

const ExitFullscreenIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
  </svg>
);

export const ScreenPage: React.FC = () => {
  const [items, setItems] = useState<ScreenMediaItemDTO[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isCursorHidden, setIsCursorHidden] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const cursorTimerRef = useRef<number | null>(null);
  const slideTimerRef = useRef<number | null>(null);
  const itemsRef = useRef<ScreenMediaItemDTO[]>([]);
  const currentIndexRef = useRef<number>(0);

  itemsRef.current = items;
  currentIndexRef.current = currentIndex;

  const getMediaUrl = useCallback((mediaId: string) => {
    return buildApiUrl(`/api/v1/screen/media/${mediaId}/file`);
  }, []);

  // 1. Polling do Feed do Telão via cookie zen_screen_session
  const fetchFeed = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/screen/media?limit=150', {
        method: 'GET',
      });

      if (res.status === 401) {
        setAuthError('Acesso não autorizado ao telão. Utilize o link oficial do evento.');
        return;
      }

      if (res.ok) {
        setAuthError(null);
        const data = await res.json();
        const newItems: ScreenMediaItemDTO[] = data.items || [];

        setItems((prevItems) => {
          // Se lista de itens mudou
          const prevIds = prevItems.map((i) => i.id).join(',');
          const newIds = newItems.map((i) => i.id).join(',');

          if (prevIds !== newIds) {
            // Se o item atualmente ativo foi revogado/removido, reajusta índice com segurança
            const currentItem = prevItems[currentIndexRef.current];
            if (currentItem && !newItems.some((i) => i.id === currentItem.id)) {
              setCurrentIndex(0);
            }
            return newItems;
          }
          return prevItems;
        });
      }
    } catch {
      // Falhas de rede transitórias são silenciadas para manter a última foto válida na tela
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fluxo de Inicialização e Bootstrap Seguro
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryToken = urlParams.get('token');

    const initializeScreen = async () => {
      if (queryToken) {
        try {
          // Realiza bootstrap seguro de sessão via POST
          const bootstrapRes = await apiFetch('/api/v1/screen/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: queryToken }),
          });

          if (!bootstrapRes.ok) {
            setAuthError('Token de acesso ao telão inválido ou não autorizado.');
            setLoading(false);
            return;
          }

          // Limpeza imediata do token da URL visível do navegador
          window.history.replaceState({}, document.title, window.location.pathname);
          setAuthError(null);
        } catch {
          setAuthError('Falha ao conectar com o servidor para autenticar o telão.');
          setLoading(false);
          return;
        }
      }

      // Carrega o feed inicial e inicia loop de polling
      await fetchFeed();
    };

    initializeScreen();
    const interval = setInterval(fetchFeed, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  // 3. Transição automática de slides (Slideshow a cada 10 segundos)
  useEffect(() => {
    if (items.length <= 1) return;

    // Pré-carrega a próxima imagem
    const nextIdx = (currentIndex + 1) % items.length;
    const nextItem = items[nextIdx];
    if (nextItem) {
      const img = new Image();
      img.crossOrigin = 'use-credentials';
      img.src = getMediaUrl(nextItem.id);
    }

    if (slideTimerRef.current) {
      clearTimeout(slideTimerRef.current);
    }

    slideTimerRef.current = window.setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % itemsRef.current.length);
        setIsTransitioning(false);
      }, 600); // Duração do fade de transição
    }, SLIDE_DURATION_MS);

    return () => {
      if (slideTimerRef.current) {
        clearTimeout(slideTimerRef.current);
      }
    };
  }, [currentIndex, items, getMediaUrl]);

  // 4. Controle de Inatividade do Cursor
  const handleMouseMove = useCallback(() => {
    setIsCursorHidden(false);
    if (cursorTimerRef.current) {
      clearTimeout(cursorTimerRef.current);
    }
    cursorTimerRef.current = window.setTimeout(() => {
      setIsCursorHidden(true);
    }, CURSOR_HIDE_DELAY_MS);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleMouseMove);
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
    };
  }, [handleMouseMove]);

  // 5. Controle de Fullscreen API
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Ignora erro se bloqueado pelo browser
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const activeItem = items[currentIndex];

  return (
    <div
      className={`screen-page ${isCursorHidden ? 'screen-page--hide-cursor' : ''}`}
      onMouseMove={handleMouseMove}
    >
      {/* Botão discreto de Fullscreen */}
      <button
        type="button"
        className={`screen-fullscreen-btn ${isFullscreen && isCursorHidden ? 'screen-fullscreen-btn--hidden' : ''}`}
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia'}
        aria-label={isFullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia'}
      >
        {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
        <span>{isFullscreen ? 'Sair de tela cheia' : 'Tela cheia'}</span>
      </button>

      {/* ══════════════════════════════════════════════════════════════
          ESTADO DE ERRO DE AUTENTICAÇÃO
          ══════════════════════════════════════════════════════════════ */}
      {authError ? (
        <div className="screen-empty-state animate-fade-in">
          <div className="screen-empty-state__inner">
            <div className="screen-empty-state__monogram-wrap">
              <Monogram variant="hero" size="lg" />
            </div>
            <span className="screen-empty-state__eyebrow">Acesso Restrito</span>
            <h1 className="screen-empty-state__names">Telão da Celebração</h1>
            <div className="screen-empty-state__divider" />
            <p className="screen-empty-state__message" style={{ color: '#d9534f' }}>
              {authError}
            </p>
            <p className="screen-empty-state__hint">
              Utilize o link com a chave de acesso autorizada para inicializar este telão.
            </p>
          </div>
        </div>
      ) : loading ? (
        /* ══════════════════════════════════════════════════════════════
            ESTADO DE CARREGAMENTO
            ══════════════════════════════════════════════════════════════ */
        <div className="screen-empty-state animate-fade-in">
          <div className="screen-empty-state__inner">
            <Monogram variant="hero" size="lg" />
            <div className="screen-empty-state__spinner" />
            <p className="screen-empty-state__subtitle">Conectando ao telão da celebração...</p>
          </div>
        </div>
      ) : items.length === 0 ? (
        /* ══════════════════════════════════════════════════════════════
            ESTADO VAZIO: Nenhuma foto aprovada ainda
            ══════════════════════════════════════════════════════════════ */
        <div className="screen-empty-state animate-fade-in">
          <div className="screen-empty-state__backdrop" />
          <div className="screen-empty-state__inner">
            <div className="screen-empty-state__monogram-wrap">
              <Monogram variant="hero" size="lg" />
            </div>
            <span className="screen-empty-state__eyebrow">Celebração de Casamento</span>
            <h1 className="screen-empty-state__names">Patrício &amp; Evandria</h1>
            <p className="screen-empty-state__date">21 de Novembro de 2026</p>
            <div className="screen-empty-state__divider" />
            <p className="screen-empty-state__message">
              Compartilhe seus registros conosco ❤️
            </p>
            <p className="screen-empty-state__hint">
              As fotos enviadas pelos convidados aparecerão aqui após moderação.
            </p>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════
           SLIDESHOW CONTÍNUO DE FOTOS APROVADAS
           ══════════════════════════════════════════════════════════════ */
        <div className="screen-stage">
          {/* Fundo derivado da própria foto com blur suave para proporções não-16:9 */}
          {activeItem && (
            <div
              className={`screen-backdrop ${isTransitioning ? 'screen-backdrop--fading' : ''}`}
              style={{
                backgroundImage: `url(${getMediaUrl(activeItem.id)})`,
              }}
              aria-hidden="true"
            />
          )}

          {/* Imagem Principal Centralizada (object-fit: contain) */}
          {activeItem && (
            <div className={`screen-photo-container ${isTransitioning ? 'screen-photo-container--fading' : ''}`}>
              <img
                key={activeItem.id}
                src={getMediaUrl(activeItem.id)}
                alt="Registro da celebração de Patrício & Evandria"
                className="screen-photo"
                crossOrigin="use-credentials"
              />
            </div>
          )}

          {/* Monograma discreto no canto superior esquerdo */}
          <div className="screen-brand-watermark" aria-hidden="true">
            <span className="screen-brand-watermark__letters">P &amp; E</span>
            <span className="screen-brand-watermark__date">21.11.2026</span>
          </div>
        </div>
      )}
    </div>
  );
};

