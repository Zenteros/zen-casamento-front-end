import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Monogram } from '../components/Monogram.js';
import { MediaUploadCard } from '../components/MediaUploadCard.js';
import { apiFetch } from '../lib/api.js';

/**
 * /festa — destino do QR impresso nos cartões das mesas.
 *
 * Leu o QR, abriu o botão de foto/vídeo: sem tela de entrada nem identificação.
 * Quem já tem o link da família continua enviando pela sessão da família;
 * os demais recebem um acesso anônimo válido só para enviar fotos e vídeos.
 */

type PassState =
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'not-event-day' }
  | { status: 'error'; message: string };

export const FestaPage: React.FC = () => {
  const [pass, setPass] = useState<PassState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    const requestPass = async () => {
      setPass({ status: 'loading' });
      try {
        const search = typeof window !== 'undefined' ? window.location.search : '';
        const res = await apiFetch(`/api/v1/event/guest-pass${search}`, { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.ok) {
          setPass({ status: 'ready' });
        } else if (res.status === 403 && data.code === 'NOT_EVENT_DAY') {
          setPass({ status: 'not-event-day' });
        } else {
          setPass({
            status: 'error',
            message: data.error || data.message || 'Não conseguimos abrir o envio agora.',
          });
        }
      } catch {
        if (!cancelled) {
          setPass({ status: 'error', message: 'Sem conexão no momento. Verifique o sinal e tente de novo.' });
        }
      }
    };

    requestPass();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="event-day-page festa-page">
      <header className="festa-page__header">
        <Monogram variant="hero" />
        <p className="festa-page__names">Patrício &amp; Evandria</p>
        <p className="festa-page__message">
          Obrigado por celebrar com a gente. Vamos guardar cada registro desse dia com muito carinho. ❤️
        </p>
      </header>

      <main className="festa-page__main">
        {pass.status === 'loading' && (
          <div className="festa-page__status" role="status">
            <span className="event-day-spinner" aria-hidden="true" />
            <span>Preparando o envio...</span>
          </div>
        )}

        {pass.status === 'ready' && (
          <>
            <Link to="/festa/cardapio" state={{ backTo: '/festa' }} className="festa-page__menu-link">
              <span className="festa-page__menu-link-icon" aria-hidden="true">🍽️</span>
              <span className="festa-page__menu-link-text">
                <strong>Ver cardápio e bebidas</strong>
                <span>Menu, open bar e drinks da festa</span>
              </span>
              <span className="festa-page__menu-link-arrow" aria-hidden="true">→</span>
            </Link>
            <MediaUploadCard variant="standalone" />
          </>
        )}

        {pass.status === 'not-event-day' && (
          <div className="festa-page__status">
            <p>O envio de fotos e vídeos abre no dia da celebração, 21 de novembro.</p>
            <p>Guarde este QR Code e volte durante a festa ❤️</p>
          </div>
        )}

        {pass.status === 'error' && (
          <div className="festa-page__status" role="alert">
            <p>{pass.message}</p>
            <button
              type="button"
              className="event-day-btn event-day-btn--upload-submit"
              onClick={() => window.location.reload()}
            >
              Tentar de novo
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
