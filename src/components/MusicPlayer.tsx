import React, { useState, useRef, useEffect } from 'react';

declare global {
  interface Window {
    SC?: {
      Widget: {
        (element: HTMLIFrameElement | string): SCWidget;
        Events: {
          LOAD_PROGRESS: string;
          PLAY_PROGRESS: string;
          PLAY: string;
          PAUSE: string;
          FINISH: string;
          SEEK: string;
          READY: string;
          OPEN_SHARE_PANEL: string;
          CLICK_DOWNLOAD: string;
          CLICK_BUY: string;
          ERROR: string;
        };
      };
    };
  }
}

interface SCWidget {
  bind(event: string, callback: (...args: unknown[]) => void): void;
  unbind(event: string): void;
  load(url: string, options?: Record<string, unknown>): void;
  play(): void;
  pause(): void;
  toggle(): void;
  seekTo(milliseconds: number): void;
  setVolume(volume: number): void;
  isPaused(callback: (paused: boolean) => void): void;
}

export interface MusicPlayerProps {
  /** URL da faixa no SoundCloud */
  soundCloudUrl?: string;
  /** Fallback para áudio direto em HTML5 se necessário */
  audioSrc?: string;
}

const DEFAULT_SOUNDCLOUD_URL =
  'https://soundcloud.com/user-943762251-273454811/goo-goo-dolls-iris-slowed';

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  soundCloudUrl = DEFAULT_SOUNDCLOUD_URL,
  audioSrc,
}) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const widgetRef = useRef<SCWidget | null>(null);
  const isReadyRef = useRef<boolean>(false);
  const pendingPlayRef = useRef<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Carrega o script da Widget API oficial do SoundCloud dinamicamente se necessário
  useEffect(() => {
    if (!soundCloudUrl) return;

    let isMounted = true;
    const SCRIPT_ID = 'soundcloud-widget-api-script';

    const initWidget = () => {
      if (!isMounted || !iframeRef.current || !window.SC?.Widget) return;

      try {
        const widget = window.SC.Widget(iframeRef.current);
        widgetRef.current = widget;

        widget.bind(window.SC.Widget.Events.READY, () => {
          if (!isMounted) return;
          isReadyRef.current = true;
          if (pendingPlayRef.current) {
            widget.play();
          }
        });

        widget.bind(window.SC.Widget.Events.PLAY, () => {
          if (!isMounted) return;
          setIsPlaying(true);
          setHasStarted(true);
          pendingPlayRef.current = false;
        });

        widget.bind(window.SC.Widget.Events.PAUSE, () => {
          if (!isMounted) return;
          setIsPlaying(false);
        });

        widget.bind(window.SC.Widget.Events.FINISH, () => {
          if (!isMounted) return;
          setIsPlaying(false);
        });

        widget.bind(window.SC.Widget.Events.ERROR, (err) => {
          console.warn('[MusicPlayer] Erro no widget do SoundCloud:', err);
          if (!isMounted) return;
          setIsPlaying(false);
          pendingPlayRef.current = false;
        });
      } catch (err) {
        console.warn('[MusicPlayer] Falha ao inicializar SC.Widget:', err);
      }
    };

    // Listener global de mensagens postMessage para redundância do SoundCloud
    const handleWindowMessage = (event: MessageEvent) => {
      if (!isMounted) return;
      if (typeof event.origin === 'string' && event.origin.includes('soundcloud.com')) {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data && typeof data === 'object') {
            if (data.method === 'ready') {
              isReadyRef.current = true;
              if (pendingPlayRef.current && widgetRef.current) {
                widgetRef.current.play();
              }
            } else if (data.method === 'play' || data.method === 'playProgress') {
              setIsPlaying(true);
              setHasStarted(true);
              pendingPlayRef.current = false;
            } else if (data.method === 'pause') {
              setIsPlaying(false);
            } else if (data.method === 'finish') {
              setIsPlaying(false);
            }
          }
        } catch {
          // ignora mensagens não-JSON de outras origens
        }
      }
    };

    window.addEventListener('message', handleWindowMessage);

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!window.SC) {
      if (!script) {
        script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = 'https://w.soundcloud.com/player/api.js';
        script.async = true;
        document.body.appendChild(script);
      }
      script.addEventListener('load', initWidget);
    } else {
      initWidget();
    }

    return () => {
      isMounted = false;
      window.removeEventListener('message', handleWindowMessage);
      if (script) {
        script.removeEventListener('load', initWidget);
      }
      if (widgetRef.current) {
        try {
          widgetRef.current.pause();
        } catch {
          // ignore
        }
      }
    };
  }, [soundCloudUrl]);

  // Fallback caso use HTML5 áudio direto
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[MusicPlayer] Não foi possível reproduzir o áudio:', err);
          setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, audioSrc]);

  const handleClick = () => {
    if (soundCloudUrl) {
      const widget = widgetRef.current;
      if (isPlaying) {
        // Pausar
        pendingPlayRef.current = false;
        setIsPlaying(false);
        if (widget) {
          try {
            widget.pause();
          } catch {
            // fallback
          }
        }
        if (iframeRef.current?.contentWindow) {
          try {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ method: 'pause' }),
              'https://w.soundcloud.com'
            );
          } catch {
            // ignore
          }
        }
      } else {
        // Iniciar / Tocar: dispara play no contexto do clique do usuário
        pendingPlayRef.current = true;
        if (widget) {
          try {
            widget.play();
          } catch {
            // fallback
          }
        }
        if (iframeRef.current?.contentWindow) {
          try {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ method: 'play' }),
              'https://w.soundcloud.com'
            );
          } catch {
            // ignore
          }
        }
        // NÃO definimos isPlaying/hasStarted aqui: aguardamos o evento PLAY real do SoundCloud
      }
      return;
    }

    // Fallback com HTML5 <audio>
    if (!hasStarted) {
      setHasStarted(true);
    }
    setIsPlaying((prev) => !prev);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const soundCloudEmbedSrc = soundCloudUrl
    ? `https://w.soundcloud.com/player/?url=${encodeURIComponent(
        soundCloudUrl
      )}&color=%23c86d51&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`
    : undefined;

  return (
    <aside
      className="invite-sound-container"
      aria-label="Controle de áudio do convite"
    >
      {/* Widget oficial do SoundCloud (oculto visualmente mantendo integração e API) */}
      {soundCloudEmbedSrc && (
        <iframe
          ref={iframeRef}
          id="sc-widget-player"
          title="SoundCloud Player"
          allow="autoplay; encrypted-media"
          src={soundCloudEmbedSrc}
          style={{
            position: 'fixed',
            width: '1px',
            height: '1px',
            opacity: 0,
            pointerEvents: 'none',
            border: 'none',
            bottom: 0,
            right: 0,
          }}
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Fallback de áudio direto se configurado */}
      {!soundCloudUrl && audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="none"
          onEnded={handleEnded}
        />
      )}

      {/* Botão de controle minimalista flutuante */}
      <button
        type="button"
        onClick={handleClick}
        className={`invite-sound-control ${
          !hasStarted
            ? 'invite-sound-control--prompt'
            : `invite-sound-control--compact ${isPlaying ? 'invite-sound-control--playing' : ''}`
        }`}
        aria-label={
          !hasStarted
            ? 'Ativar o som do convite'
            : isPlaying
            ? 'Pausar som'
            : 'Ativar som'
        }
        title={
          !hasStarted
            ? 'Ativar o som'
            : isPlaying
            ? 'Pausar som'
            : 'Ativar som'
        }
      >
        <span className="invite-sound-control__icon" aria-hidden="true">
          {!hasStarted || isPlaying ? (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon
                points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"
                fill="currentColor"
                stroke="none"
              />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          ) : (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon
                points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"
                fill="currentColor"
                stroke="none"
              />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </span>

        {!hasStarted && (
          <span className="invite-sound-control__label">Ative o som</span>
        )}
      </button>
    </aside>
  );
};
