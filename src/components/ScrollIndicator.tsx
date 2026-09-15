import React, { useState, useEffect } from 'react';

/**
 * Subtle scroll-down indicator at the bottom of the hero section.
 * Fades out once the user begins scrolling.
 */

export const ScrollIndicator: React.FC = () => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setHidden(true);
      } else {
        setHidden(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`scroll-indicator ${hidden ? 'scroll-indicator--hidden' : ''}`}>
      <span className="scroll-indicator__text">Conheça os detalhes</span>
      <svg
        className="scroll-indicator__arrow"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
};
