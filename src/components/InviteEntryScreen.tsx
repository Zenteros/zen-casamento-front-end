import React, { useState, useEffect } from 'react';
import { Monogram } from './Monogram.js';
import { BotanicalFrame } from './BotanicalFrame.js';

interface InviteEntryScreenProps {
  familyTitle?: string;
  isOpened: boolean;
  onOpenInvite: () => void;
}

export const InviteEntryScreen: React.FC<InviteEntryScreenProps> = ({
  familyTitle,
  isOpened,
  onOpenInvite,
}) => {
  const [shouldRender, setShouldRender] = useState(!isOpened);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpened) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 700); // tempo correspondente à transição de fade-out suave
      return () => clearTimeout(timer);
    } else {
      setShouldRender(true);
      setIsClosing(false);
    }
  }, [isOpened]);

  if (!shouldRender) {
    return null;
  }

  const handleOpenClick = () => {
    onOpenInvite();
  };

  return (
    <div
      className={`invite-entry ${isClosing ? 'invite-entry--closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Tela inicial de abertura do convite"
    >
      {/* Decorações Botânicas nos 4 cantos da tela */}
      <BotanicalFrame variant="top-left" />
      <BotanicalFrame variant="top-right" />
      <BotanicalFrame variant="bottom-left" />
      <BotanicalFrame variant="bottom-right" />

      {/* Cartão Central Editorial */}
      <div className="invite-entry__card">
        {/* Monograma dos Noivos */}
        <div className="invite-entry__monogram">
          <Monogram variant="hero" />
        </div>

        {/* Nomes dos noivos */}
        <div className="invite-entry__names">
          <span className="invite-entry__name">Patrício</span>
          <span className="invite-entry__ampersand">&amp;</span>
          <span className="invite-entry__name">Evandria</span>
        </div>

        {/* Mensagem de boas-vindas */}
        <p className="invite-entry__subtitle">
          Temos um convite especial para você.
        </p>

        {/* Título da Família / Convidado (se disponível) */}
        {familyTitle && (
          <div className="invite-entry__family-badge">
            <span className="invite-entry__family-label">Destinado a</span>
            <span className="invite-entry__family-title">{familyTitle}</span>
          </div>
        )}

        {/* Linha divisória fina */}
        <div className="invite-entry__divider" aria-hidden="true" />

        {/* Data e Local */}
        <div className="invite-entry__meta">
          <span className="invite-entry__date">21 &bull; 11 &bull; 2026</span>
          <span className="invite-entry__location">Nova Veneza &bull; Santa Catarina</span>
        </div>

        {/* Botão de Ação Principal */}
        <div className="invite-entry__action">
          <button
            type="button"
            onClick={handleOpenClick}
            className="invite-entry__btn"
            autoFocus
            aria-label="Abrir nosso convite de casamento"
          >
            <span className="invite-entry__btn-text">ABRIR NOSSO CONVITE</span>
            <svg
              className="invite-entry__btn-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
