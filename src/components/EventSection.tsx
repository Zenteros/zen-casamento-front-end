import React from 'react';

/* ──────────────────────────────────────────────
   SVG helper — pin icon
   ────────────────────────────────────────────── */
const PinIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const NavIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

/* ──────────────────────────────────────────────
   Floral motif SVG — inline section separator
   ────────────────────────────────────────────── */
const FloralMotif: React.FC = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="section-separator__motif"
  >
    <path d="M12 2C12 2 13.5 6.5 17 8C20.5 9.5 22 12 22 12C22 12 17.5 13.5 16 17C14.5 20.5 12 22 12 22C12 22 10.5 17.5 7 16C3.5 14.5 2 12 2 12C2 12 6.5 10.5 8 7C9.5 3.5 12 2 12 2Z" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

export const EventSection: React.FC = () => {
  const ceremonyGmaps = 'https://www.google.com/maps/search/?api=1&query=Santuario+Diocesano+Nossa+Senhora+de+Caravaggio+Nova+Veneza+SC';
  const ceremonyWaze  = 'https://waze.com/ul?q=Santuario%20Diocesano%20Nossa%20Senhora%20de%20Caravaggio%20Nova%20Veneza&navigate=yes';

  const receptionGmaps = 'https://www.google.com/maps/search/?api=1&query=Casa+de+Eventos+La+Brace+Nova+Veneza+SC';
  const receptionWaze  = 'https://waze.com/ul?q=Casa%20de%20Eventos%20La%20Brace%20Nova%20Veneza&navigate=yes';

  return (
    <>
      {/* ═══════════════════════════════════
          CERIMÔNIA — editorial, two-column on desktop
          left: time/date + narrative
          right: church name + address + nav
          ═══════════════════════════════════ */}
      <section
        className="editorial-section ceremony-section animate-fade-in"
        id="cerimonia"
        aria-labelledby="ceremony-heading"
      >
        <div className="ceremony-inner">

          {/* Left column — eyebrow + time + narrative */}
          <div>
            <span className="editorial-eyebrow">Cerimônia Religiosa</span>

            <div className="ceremony-timebadge">
              <span className="ceremony-timebadge__time">10h30</span>
              <span className="ceremony-timebadge__label">
                Sábado<br />21 Nov 2026
              </span>
            </div>

            <p className="editorial-body" style={{ maxWidth: '380px' }}>
              A celebração começa na manhã de 21 de novembro, com a cerimônia religiosa que unirá
              Patrício e Evandria diante de Deus e das pessoas que mais amam.
            </p>
          </div>

          {/* Right column — address + nav buttons */}
          <div>
            <h2 id="ceremony-heading" className="editorial-title" style={{ marginBottom: '1.5rem' }}>
              Santuário Diocesano Nossa Senhora de Caravaggio
            </h2>

            <div className="ceremony-address" style={{ marginBottom: '2rem' }}>
              <span className="ceremony-address__name">Santuário de Caravaggio</span>
              <span className="ceremony-address__line">Caravaggio — Nova Veneza / SC</span>
            </div>

            <div className="nav-buttons">
              <a
                href={ceremonyGmaps}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-btn"
                aria-label="Abrir cerimônia no Google Maps"
              >
                <PinIcon />
                Google Maps
              </a>
              <a
                href={ceremonyWaze}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-btn"
                aria-label="Navegar até a cerimônia no Waze"
              >
                <NavIcon />
                Waze
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* Section separator */}
      <div className="section-separator" aria-hidden="true">
        <div className="section-separator__line" />
        <FloralMotif />
        <div className="section-separator__line" />
      </div>

      {/* ═══════════════════════════════════
          RECEPÇÃO — alternate composition
          Large decorative ornament number
          reversed column order on desktop
          ═══════════════════════════════════ */}
      <section
        className="editorial-section reception-section animate-fade-in"
        id="recepcao"
        aria-labelledby="reception-heading"
      >
        <div className="reception-inner">

          {/* Eyebrow + title */}
          <div>
            <span className="editorial-eyebrow">Recepção & Celebração</span>
            <h2
              id="reception-heading"
              className="editorial-title"
              style={{ marginBottom: '0.75rem' }}
            >
              Casa de Eventos<br />
              <em style={{ fontStyle: 'italic', fontWeight: 400 }}>La Brace</em>
            </h2>

            {/* Pausa emocional — frase em script */}
            <p className="reception-script-phrase">
              A festa começa depois do sim.
            </p>
          </div>

          {/* Address + navigation */}
          <div>
            <div className="ceremony-address" style={{ marginBottom: '2rem' }}>
              <span className="ceremony-address__name">Casa de Eventos La Brace</span>
              <span className="ceremony-address__line">R. Frederico Marazzi, 200</span>
              <span className="ceremony-address__line">Caravaggio — Nova Veneza / SC</span>
            </div>

            <div className="nav-buttons">
              <a
                href={receptionGmaps}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-btn"
                aria-label="Abrir recepção no Google Maps"
              >
                <PinIcon />
                Google Maps
              </a>
              <a
                href={receptionWaze}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-btn"
                aria-label="Navegar até a recepção no Waze"
              >
                <NavIcon />
                Waze
              </a>
            </div>
          </div>

        </div>
      </section>
    </>
  );
};
