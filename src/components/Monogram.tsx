import React from 'react';

/**
 * PE monogram with date — editorial emblem style.
 *
 * Variants:
 * - 'pill': Original compact pill shape (for footer, loading states)
 * - 'hero': Larger, open emblem without background (for hero section)
 */

interface MonogramProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'pill' | 'hero';
}

export const Monogram: React.FC<MonogramProps> = ({ size = 'md', variant = 'pill' }) => {
  const isHero = variant === 'hero';

  if (isHero) {
    return (
      <div className="monogram monogram--hero" aria-label="Monograma P | E">
        <div className="monogram__letters">
          <span>P</span>
          <span className="monogram__divider" aria-hidden="true" />
          <span>E</span>
        </div>
        <div className="monogram__rule" />
        <div className="monogram__date">21.11.2026</div>
      </div>
    );
  }

  // Pill variant (backward compatible)
  const isLg = size === 'lg';
  const isSm = size === 'sm';

  const containerPadding = isLg ? '0.75rem 1.5rem' : isSm ? '0.25rem 0.75rem' : '0.5rem 1.25rem';
  const fontMainSize = isLg ? '1.5rem' : isSm ? '0.9rem' : '1.2rem';
  const fontDateSize = isLg ? '0.85rem' : isSm ? '0.65rem' : '0.75rem';

  return (
    <div
      className="monogram monogram--pill"
      style={{ padding: containerPadding }}
      aria-label="Monograma P | E"
    >
      <div
        className="monogram__letters"
        style={{
          fontSize: fontMainSize,
          fontWeight: 600,
          lineHeight: 1.1,
        }}
      >
        <span>P</span>
        <span className="monogram__divider" aria-hidden="true" />
        <span>E</span>
      </div>
      <div
        className="monogram__date"
        style={{
          fontSize: fontDateSize,
          fontWeight: 600,
          letterSpacing: '0.12em',
          marginTop: '2px',
        }}
      >
        21.11.2026
      </div>
    </div>
  );
};
