import React from 'react';

/**
 * Botanical SVG decorations — eucalyptus branches and delicate leaves
 * Used as corner ornaments on the hero section.
 *
 * Variant determines which corner/position the element occupies.
 */

interface BotanicalFrameProps {
  variant: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const BotanicalFrame: React.FC<BotanicalFrameProps> = ({ variant }) => {
  return (
    <svg
      className={`botanical botanical--${variant} botanical-enter`}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Main branch */}
      <path
        d="M 20 180 Q 40 140 60 120 Q 80 100 100 80 Q 120 60 140 40 Q 160 25 175 15"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Eucalyptus leaves along the main branch */}
      <ellipse cx="45" cy="155" rx="12" ry="7" transform="rotate(-35 45 155)"
        stroke="currentColor" strokeWidth="0.8" fill="none" />
      <ellipse cx="55" cy="140" rx="10" ry="6" transform="rotate(-50 55 140)"
        stroke="currentColor" strokeWidth="0.8" fill="none" />
      <ellipse cx="70" cy="118" rx="13" ry="7" transform="rotate(-40 70 118)"
        stroke="currentColor" strokeWidth="0.8" fill="none" />
      <ellipse cx="82" cy="105" rx="10" ry="5.5" transform="rotate(-55 82 105)"
        stroke="currentColor" strokeWidth="0.8" fill="none" />
      <ellipse cx="100" cy="85" rx="14" ry="7.5" transform="rotate(-30 100 85)"
        stroke="currentColor" strokeWidth="0.8" fill="none" />
      <ellipse cx="118" cy="65" rx="11" ry="6" transform="rotate(-50 118 65)"
        stroke="currentColor" strokeWidth="0.8" fill="none" />
      <ellipse cx="135" cy="48" rx="12" ry="6.5" transform="rotate(-35 135 48)"
        stroke="currentColor" strokeWidth="0.8" fill="none" />
      <ellipse cx="158" cy="28" rx="10" ry="5.5" transform="rotate(-45 158 28)"
        stroke="currentColor" strokeWidth="0.8" fill="none" />

      {/* Opposite-side leaves */}
      <ellipse cx="35" cy="165" rx="11" ry="6" transform="rotate(25 35 165)"
        stroke="currentColor" strokeWidth="0.8" fill="none" />
      <ellipse cx="60" cy="130" rx="9" ry="5" transform="rotate(35 60 130)"
        stroke="currentColor" strokeWidth="0.8" fill="none" />
      <ellipse cx="88" cy="95" rx="12" ry="6" transform="rotate(30 88 95)"
        stroke="currentColor" strokeWidth="0.8" fill="none" />
      <ellipse cx="110" cy="75" rx="10" ry="5.5" transform="rotate(40 110 75)"
        stroke="currentColor" strokeWidth="0.8" fill="none" />
      <ellipse cx="145" cy="38" rx="11" ry="6" transform="rotate(30 145 38)"
        stroke="currentColor" strokeWidth="0.8" fill="none" />

      {/* Secondary branch */}
      <path
        d="M 30 170 Q 25 150 30 130 Q 35 110 45 95"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        fill="none"
      />

      {/* Small leaves on secondary branch */}
      <ellipse cx="28" cy="150" rx="8" ry="4.5" transform="rotate(-70 28 150)"
        stroke="currentColor" strokeWidth="0.7" fill="none" />
      <ellipse cx="33" cy="130" rx="7" ry="4" transform="rotate(-60 33 130)"
        stroke="currentColor" strokeWidth="0.7" fill="none" />
      <ellipse cx="38" cy="112" rx="9" ry="5" transform="rotate(-45 38 112)"
        stroke="currentColor" strokeWidth="0.7" fill="none" />

      {/* Small berries / buds */}
      <circle cx="42" cy="100" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="170" cy="20" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="95" cy="90" r="1.5" fill="currentColor" opacity="0.25" />
    </svg>
  );
};
