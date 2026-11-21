import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { MenuItemDTO, MenuSectionDTO } from '../contracts/index.js';
import { apiFetch } from '../lib/api.js';
import { groupMenuSections } from '../domain/menu.js';

/**
 * /festa/cardapio — Cardápio e bebidas, no desenho do centro de mesa impresso.
 *
 * Aberto pelo botão “Ver cardápio e bebidas” do /festa (QR das mesas) e pelo
 * botão Cardápio do Event Day. Os dados vêm de /api/v1/event/menu, a mesma fonte
 * do Event Day. Quem chega sem sessão (link direto) recebe o acesso do QR antes.
 */

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; sections: MenuSectionDTO[] }
  | { status: 'not-event-day' }
  | { status: 'error'; message: string };

interface BackState {
  backTo?: string;
}

async function fetchMenu(): Promise<Response> {
  return apiFetch('/api/v1/event/menu', { method: 'GET' });
}

export const CardapioPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = (location.state as BackState | null)?.backTo;
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      let res = await fetchMenu();

      if (res.status === 401) {
        // Sem sessão: pede o acesso do QR (mesmo fluxo do /festa) e tenta de novo.
        const search = typeof window !== 'undefined' ? window.location.search : '';
        const pass = await apiFetch(`/api/v1/event/guest-pass${search}`, { method: 'POST' });
        if (!pass.ok) {
          const data = await pass.json().catch(() => ({}));
          if (pass.status === 403 && data.code === 'NOT_EVENT_DAY') {
            setState({ status: 'not-event-day' });
          } else {
            setState({ status: 'error', message: data.error || 'Não conseguimos abrir o cardápio agora.' });
          }
          return;
        }
        res = await fetchMenu();
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setState({ status: 'error', message: data.error || 'Não conseguimos abrir o cardápio agora.' });
        return;
      }

      const data: { menuSections: MenuSectionDTO[] } = await res.json();
      setState({ status: 'ready', sections: data.menuSections });
    } catch {
      setState({ status: 'error', message: 'Sem conexão no momento. Verifique o sinal e tente de novo.' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const goBack = () => {
    if (backTo) navigate(backTo);
    else navigate('/festa');
  };

  const groups = state.status === 'ready' ? groupMenuSections<MenuItemDTO, MenuSectionDTO>(state.sections) : [];

  return (
    <div className="cardapio-page">
      <nav className="cardapio-page__topbar">
        <button type="button" className="cardapio-page__back" onClick={goBack}>
          <span aria-hidden="true">←</span> Voltar
        </button>
        <span className="cardapio-page__monogram" aria-label="Patrício e Evandria">
          P<span className="cardapio-page__monogram-bar" aria-hidden="true" />E
        </span>
      </nav>

      <main className="cardapio-page__main">
        {state.status === 'loading' && (
          <div className="cardapio-page__status" role="status">
            <span className="event-day-spinner" aria-hidden="true" />
            <span>Abrindo o cardápio...</span>
          </div>
        )}

        {state.status === 'not-event-day' && (
          <div className="cardapio-page__status">
            <p>O cardápio fica disponível aqui no dia da celebração, 21 de novembro.</p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="cardapio-page__status" role="alert">
            <p>{state.message}</p>
            <button type="button" className="event-day-btn event-day-btn--upload-submit" onClick={() => void load()}>
              Tentar de novo
            </button>
          </div>
        )}

        {state.status === 'ready' && groups.length === 0 && (
          <div className="cardapio-page__status">
            <p>O cardápio será apresentado em breve.</p>
          </div>
        )}

        {state.status === 'ready' && groups.length > 1 && (
          <div className="cardapio-page__jump" role="navigation" aria-label="Ir para">
            {groups.map((g) => (
              <a key={g.key} href={`#cardapio-${g.key}`} className="cardapio-page__jump-link">
                {g.title}
              </a>
            ))}
          </div>
        )}

        {groups.map((group) => (
          <section
            key={group.key}
            id={`cardapio-${group.key}`}
            className="cardapio-card"
            aria-labelledby={`cardapio-${group.key}-title`}
          >
            <header className="cardapio-card__header">
              <h1 id={`cardapio-${group.key}-title`} className="cardapio-card__title">
                {group.title}
              </h1>
              {group.subtitle && <p className="cardapio-card__subtitle">{group.subtitle}</p>}
              <span className="cardapio-card__rule" aria-hidden="true" />
            </header>

            {group.sections.map((section) => {
              // Como no impresso: numa seção em que todo item tem descrição (Drinks), o nome
              // ganha destaque e os ingredientes vêm abaixo; nas demais, a descrição vai entre
              // parênteses, ex.: "Refrigerantes (Coca-Cola, Coca Zero…)".
              const detailed = section.items.length > 0 && section.items.every((i) => i.description);
              return (
                <div key={section.key} className="cardapio-section">
                  {section.heading && <h2 className="cardapio-section__title">{section.heading}</h2>}
                  {section.description && <p className="cardapio-section__desc">{section.description}</p>}
                  <ul className={`cardapio-items ${detailed ? 'cardapio-items--detailed' : ''}`}>
                    {section.items.map((item) => (
                      <li key={item.id} className="cardapio-item">
                        {detailed ? (
                          <>
                            <span className="cardapio-item__name cardapio-item__name--accent">{item.name}</span>
                            <span className="cardapio-item__desc">{item.description}</span>
                          </>
                        ) : (
                          <span className="cardapio-item__name">
                            {item.name}
                            {item.description && <span className="cardapio-item__inline-desc"> ({item.description})</span>}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        ))}

        {state.status === 'ready' && groups.length > 0 && (
          <footer className="cardapio-page__footer">
            <p className="cardapio-page__thanks">
              Obrigado por fazerem parte deste dia.
              <br />
              Cada abraço, sorriso e brinde de vocês torna a nossa história ainda mais bonita.
            </p>
            <p className="cardapio-page__signature">Patrício &amp; Evandria</p>
          </footer>
        )}
      </main>
    </div>
  );
};
