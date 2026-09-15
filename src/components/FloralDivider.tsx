import React from 'react';

interface FloralDividerProps {
  className?: string;
  style?: React.CSSProperties;
}

export const FloralDivider: React.FC<FloralDividerProps> = ({ style }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        margin: '1.25rem 0',
        width: '100%',
        color: 'var(--color-rose)',
        ...style,
      }}
    >
      <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2C12 2 13.5 6.5 17 8C20.5 9.5 22 12 22 12C22 12 17.5 13.5 16 17C14.5 20.5 12 22 12 22C12 22 10.5 17.5 7 16C3.5 14.5 2 12 2 12C2 12 6.5 10.5 8 7C9.5 3.5 12 2 12 2Z" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
      <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
    </div>
  );
};
