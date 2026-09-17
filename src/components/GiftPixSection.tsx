import React, { useState, useRef, useEffect } from 'react';
import { PIX_CONFIG, PIX_KEY } from '../domain/index.js';

/* ──────────────────────────────────────────────
   SVG Icons
   ────────────────────────────────────────────── */
const GiftIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" rx="1" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

const CopyIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ──────────────────────────────────────────────
   GiftPixSection Component
   ────────────────────────────────────────────── */
export const GiftPixSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    let success = false;

    // 1. Tentar Clipboard API nativa
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(PIX_KEY);
        success = true;
      } catch {
        success = false;
      }
    }

    // 2. Fallback caso a API falhe ou não tenha suporte
    if (!success && typeof document !== 'undefined') {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = PIX_KEY;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        textArea.style.opacity = '0';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch {
        success = false;
      }
    }

    // Feedback visual amigável e acessível
    setCopied(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  return (
    <section
      className="editorial-section gift-pix-section animate-fade-in"
      id="presente"
      aria-labelledby="gift-pix-heading"
    >
      <div className="gift-pix-inner">
        {/* Cabeçalho Editorial com Ícone Discreto */}
        <div className="gift-pix-header">
          <div className="gift-pix-icon-wrap" aria-hidden="true">
            <GiftIcon />
          </div>

          <span className="editorial-eyebrow">Presente aos Noivos</span>

          <h2 id="gift-pix-heading" className="editorial-title gift-pix-title">
            Um carinho, se você desejar
          </h2>

          <div className="gift-pix-text">
            <p>Sua presença é o nosso maior presente.</p>
            <p>
              Mas, se desejar nos agraciar de alguma forma, disponibilizamos uma opção de presente via Pix.
            </p>
          </div>
        </div>

        {/* Card Suave com Chave e Ação */}
        <div className="gift-pix-card">
          <div className="gift-pix-badge">
            <span className="gift-pix-badge__dot" aria-hidden="true" />
            <span>Pix &bull; {PIX_CONFIG.keyType}</span>
          </div>

          <div className="gift-pix-key-wrap">
            <span className="gift-pix-key-display">{PIX_CONFIG.displayKey}</span>
          </div>

          <div className="gift-pix-action-wrap">
            <button
              type="button"
              className={`gift-pix-copy-btn ${copied ? 'gift-pix-copy-btn--copied' : ''}`}
              onClick={handleCopy}
              aria-label={copied ? 'Chave Pix copiada: 48991567999' : 'Copiar chave Pix 48991567999'}
              aria-live="polite"
            >
              {copied ? (
                <>
                  <CheckIcon />
                  <span>Chave copiada ✓</span>
                </>
              ) : (
                <>
                  <CopyIcon />
                  <span>Copiar chave Pix</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Assinatura Afetiva */}
        <p className="gift-pix-signature">
          Com carinho, Patrício &amp; Evandria.
        </p>
      </div>
    </section>
  );
};
