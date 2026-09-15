import React, { useState } from 'react';
import { ACCOMMODATION_DATA } from '../domain/accommodation.js';

/* ──────────────────────────────────────────────
   SVG Icons
   ────────────────────────────────────────────── */
const BuildingIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v8h20v-8a2 2 0 0 0-2-2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
);

const WhatsAppIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const PhoneIcon: React.FC = () => (
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
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const ChevronDownIcon: React.FC<{ rotated?: boolean }> = ({ rotated }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{
      transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.3s ease',
      flexShrink: 0,
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CoffeeIcon: React.FC = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
  </svg>
);

const UserIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const AccommodationSection: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRooms, setShowRooms] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  const toggleRooms = () => {
    setShowRooms((prev) => !prev);
  };

  return (
    <section
      className="editorial-section accommodation-section animate-fade-in"
      id="hospedagem"
      aria-labelledby="accommodation-heading"
    >
      <div className="accommodation-inner">
        {/* Cabeçalho Editorial */}
        <div className="accommodation-header">
          <span className="editorial-eyebrow">Hospedagem</span>
          <h2 id="accommodation-heading" className="editorial-title">
            Para quem vem de longe
          </h2>
          <p className="accommodation-intro">
            Para que você aproveite cada momento da nossa celebração com tranquilidade e conforto,
            reunimos informações do hotel parceiro mais próximo do evento em Nova Veneza.
          </p>
        </div>

        {/* Botão de Expansão Principal (Estado Fechado / Aberto) */}
        <div className="accommodation-toggle-wrap">
          <button
            type="button"
            className={`accommodation-toggle-btn ${isExpanded ? 'accommodation-toggle-btn--active' : ''}`}
            onClick={toggleExpanded}
            aria-expanded={isExpanded}
            aria-controls="accommodation-details"
          >
            <BuildingIcon />
            <span>{isExpanded ? 'Ocultar hotel e opções de reserva' : 'Ver hotel e opções de reserva'}</span>
            <ChevronDownIcon rotated={isExpanded} />
          </button>
        </div>

        {/* Bloco Expandido */}
        <div
          id="accommodation-details"
          className={`accommodation-content ${isExpanded ? 'accommodation-content--open' : ''}`}
          aria-hidden={!isExpanded}
        >
          {isExpanded && (
            <div className="accommodation-card animate-fade-in">
              {/* Informações do Hotel */}
              <div className="accommodation-hotel-info">
                <div className="accommodation-hotel-header">
                  <div>
                    <span className="accommodation-badge">Hotel Sugerido</span>
                    <h3 className="accommodation-hotel-name">{ACCOMMODATION_DATA.name}</h3>
                  </div>
                  {ACCOMMODATION_DATA.breakfastIncluded && (
                    <div className="accommodation-breakfast-badge">
                      <CoffeeIcon />
                      <span>Café da manhã incluso</span>
                    </div>
                  )}
                </div>

                <p className="accommodation-hotel-desc">
                  Localizado a poucos minutos da cerimônia e recepção, com estrutura completa e vista privilegiada.
                </p>

                {/* Contatos & CTA WhatsApp */}
                <div className="accommodation-contact-box">
                  <div className="accommodation-phone-row">
                    <span className="accommodation-phone-label">Telefone / WhatsApp:</span>
                    <a
                      href={`tel:${ACCOMMODATION_DATA.phoneRaw}`}
                      className="accommodation-phone-link"
                      aria-label={`Ligar para ${ACCOMMODATION_DATA.phoneDisplay}`}
                    >
                      <PhoneIcon />
                      <span>{ACCOMMODATION_DATA.phoneDisplay}</span>
                    </a>
                  </div>

                  {/* CTA Principal de Reserva */}
                  <div className="accommodation-cta-wrap">
                    <a
                      href={ACCOMMODATION_DATA.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="accommodation-whatsapp-btn"
                      aria-label="Reservar pelo WhatsApp com o Hotel Bormon"
                    >
                      <WhatsAppIcon />
                      <span>Reservar pelo WhatsApp</span>
                    </a>
                    <span className="accommodation-cta-hint">
                      Mensagem pré-preenchida informando que você é convidado do casamento.
                    </span>
                  </div>
                </div>

                {/* Política infantil */}
                <div className="accommodation-policy-box">
                  <span className="accommodation-policy-title">Política infantil:</span>
                  <p className="accommodation-policy-text">{ACCOMMODATION_DATA.childPolicy.description}</p>
                </div>
              </div>

              {/* Divisor Interno */}
              <div className="accommodation-divider" />

              {/* Nível Secundário: Acomodações e Tarifas */}
              <div className="accommodation-rooms-section">
                <button
                  type="button"
                  className={`accommodation-rooms-toggle ${showRooms ? 'accommodation-rooms-toggle--open' : ''}`}
                  onClick={toggleRooms}
                  aria-expanded={showRooms}
                  aria-controls="accommodation-rooms-list"
                >
                  <span className="accommodation-rooms-toggle__text">
                    {showRooms ? 'Ocultar acomodações e tarifas' : 'Ver acomodações e tarifas'}
                  </span>
                  <span className="accommodation-rooms-toggle__count">
                    {ACCOMMODATION_DATA.rooms.length} categorias
                  </span>
                  <ChevronDownIcon rotated={showRooms} />
                </button>

                {showRooms && (
                  <div
                    id="accommodation-rooms-list"
                    className="accommodation-rooms-grid animate-fade-in"
                  >
                    {ACCOMMODATION_DATA.rooms.map((room) => (
                      <div key={room.id} className="room-card">
                        <div className="room-card__header">
                          <h4 className="room-card__name">{room.name}</h4>
                          <span className="room-card__capacity">
                            <UserIcon />
                            {room.capacity}
                          </span>
                        </div>

                        {/* Comodidades */}
                        <ul className="room-card__amenities" aria-label={`Comodidades de ${room.name}`}>
                          {room.amenities.map((amenity, idx) => (
                            <li key={idx} className="room-card__amenity-item">
                              <span className="room-card__amenity-bullet">
                                <CheckIcon />
                              </span>
                              <span>{amenity}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Tarifas */}
                        <div className="room-card__rates">
                          <span className="room-card__rates-title">Tarifas informadas:</span>
                          <div className="room-card__rates-list">
                            {room.rates.map((rate, rIdx) => (
                              <div key={rIdx} className="room-rate-item">
                                <span className="room-rate-item__label">{rate.label}</span>
                                <div className="room-rate-item__price-wrap">
                                  <span className="room-rate-item__price">{rate.price}</span>
                                  <span className="room-rate-item__period">/{rate.period}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
