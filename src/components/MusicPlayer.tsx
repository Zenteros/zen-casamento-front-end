import React, { useState, useRef, useEffect } from 'react';

export interface MusicPlayerProps {
  songTitle?: string;
  artist?: string;
  audioSrc?: string;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  songTitle = 'Iris',
  artist = 'Goo Goo Dolls',
  audioSrc,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <aside
      className={`invite-music-capsule ${isPlaying ? 'invite-music-capsule--playing' : ''}`}
      aria-label="Player de música do convite"
    >
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="none"
          onEnded={handleEnded}
        />
      )}

      <button
        type="button"
        className="invite-music-capsule__btn"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pausar música' : 'Tocar música'}
        title={isPlaying ? 'Pausar música' : 'Tocar música'}
      >
        {isPlaying ? (
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="invite-music-capsule__icon"
            aria-hidden="true"
          >
            <rect x="6" y="4" width="4" height="16" rx="1.5" />
            <rect x="14" y="4" width="4" height="16" rx="1.5" />
          </svg>
        ) : (
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="invite-music-capsule__icon invite-music-capsule__icon--play"
            aria-hidden="true"
          >
            <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72L9.5 4.28a1 1 0 0 0-1.5.86z" />
          </svg>
        )}
      </button>

      <div
        className="invite-music-capsule__info"
        onClick={togglePlay}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            togglePlay();
          }
        }}
        aria-label={`${songTitle} - ${artist}`}
      >
        <div className="invite-music-capsule__title-row">
          {isPlaying ? (
            <span className="invite-music-capsule__equalizer" aria-hidden="true">
              <span className="invite-music-capsule__eq-bar invite-music-capsule__eq-bar--1" />
              <span className="invite-music-capsule__eq-bar invite-music-capsule__eq-bar--2" />
              <span className="invite-music-capsule__eq-bar invite-music-capsule__eq-bar--3" />
            </span>
          ) : (
            <span className="invite-music-capsule__note-icon" aria-hidden="true">♫</span>
          )}
          <span className="invite-music-capsule__title">{songTitle}</span>
        </div>
        <span className="invite-music-capsule__artist">{artist}</span>
      </div>
    </aside>
  );
};
