import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  meta?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'guests' | 'confirm';
  className?: string;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  ariaLabel?: string;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  title,
  meta,
  children,
  size = 'md',
  className = '',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  ariaLabel,
}) => {
  // Bloqueia scroll do body enquanto o modal estiver aberto e restaura ao desmontar/fechar
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Compensar largura da scrollbar para evitar layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  const modalSizeClass = size ? `admin-modal--${size}` : '';

  const modalContent = (
    <div
      className="admin-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : ariaLabel || 'Janela modal'}
      onClick={(e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`admin-modal ${modalSizeClass} ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <div className="admin-modal-header__info">
            <h2 className="admin-modal-title">{title}</h2>
            {meta && <span className="admin-modal-meta">{meta}</span>}
          </div>
          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            &times;
          </button>
        </div>

        <div className="admin-modal-scrollable-content">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
