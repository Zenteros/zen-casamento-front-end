import React from 'react';

export const AttireSection: React.FC = () => {
  return (
    <>
      {/* Section separator */}
      <div className="section-separator" aria-hidden="true">
        <div className="section-separator__line" />
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="section-separator__motif"
          aria-hidden="true"
        >
          <path d="M12 2C12 2 13.5 6.5 17 8C20.5 9.5 22 12 22 12C22 12 17.5 13.5 16 17C14.5 20.5 12 22 12 22C12 22 10.5 17.5 7 16C3.5 14.5 2 12 2 12C2 12 6.5 10.5 8 7C9.5 3.5 12 2 12 2Z" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
        <div className="section-separator__line" />
      </div>

      <section
        className="editorial-section attire-section animate-fade-in"
        id="traje"
        aria-labelledby="attire-heading"
      >
        <span className="editorial-eyebrow">Traje</span>

        <h2 id="attire-heading" className="editorial-title" style={{ marginBottom: '0.5rem' }}>
          Passeio Completo
        </h2>

        <p className="attire-code">Social Elegante</p>

        <div className="attire-grid">

          <div className="attire-item">
            <span className="attire-item__gender">Para Elas</span>
            <p className="attire-item__description">
              Vestidos de comprimento midi ou longo, macacões sociais sofisticados
              ou tecidos leves e fluídos, ideais para uma celebração matutina refinada.
            </p>
          </div>

          <div className="attire-item">
            <span className="attire-item__gender">Para Eles</span>
            <p className="attire-item__description">
              Costume ou terno em tons elegantes, acompanhados de camisa social e sapato.
              A gravata é opcional.
            </p>
          </div>

        </div>
      </section>
    </>
  );
};
