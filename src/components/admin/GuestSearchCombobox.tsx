import React, { useState, useEffect, useRef, useMemo, useId } from 'react';
import type { AdminTableGuestSummaryDTO } from '../../contracts/index.js';

interface GuestSearchComboboxProps {
  guests: AdminTableGuestSummaryDTO[];
  selectedGuestId: string;
  onSelect: (guestId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const SearchIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const UserCheckIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
);

export const GuestSearchCombobox: React.FC<GuestSearchComboboxProps> = ({
  guests,
  selectedGuestId,
  onSelect,
  placeholder = 'Buscar convidado ou família...',
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const listboxId = useId();
  const inputId = useId();

  // Localizar o convidado atualmente selecionado
  const selectedGuest = useMemo(() => {
    if (!selectedGuestId) return null;
    return guests.find((g) => g.id === selectedGuestId) || null;
  }, [guests, selectedGuestId]);

  // Filtragem insensível a maiúsculas/minúsculas e acentos
  const filteredGuests = useMemo(() => {
    const term = normalizeText(searchTerm);
    if (!term) return guests;

    return guests.filter((g) => {
      const nameNorm = normalizeText(g.name);
      const famNorm = normalizeText(g.familyTitle || '');
      return nameNorm.includes(term) || famNorm.includes(term);
    });
  }, [guests, searchTerm]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Garantir que o item ativo esteja visível ao navegar pelo teclado
  useEffect(() => {
    if (highlightedIndex >= 0 && listboxRef.current) {
      const itemElement = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (itemElement) {
        itemElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex]);

  const handleSelectOption = (guest: AdminTableGuestSummaryDTO) => {
    onSelect(guest.id);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClearSelection = () => {
    onSelect('');
    setSearchTerm('');
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(filteredGuests.length > 0 ? 0 : -1);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredGuests.length === 0) return;
      setHighlightedIndex((prev) => (prev < filteredGuests.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredGuests.length === 0) return;
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredGuests.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredGuests.length) {
        handleSelectOption(filteredGuests[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    } else if (e.key === 'Tab') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const renderStatusBadge = (status: string, isChild?: boolean) => {
    const isConfirmed = status === 'CONFIRMED';
    return (
      <div className="admin-combobox-tags">
        <span
          className={`admin-guest-tag ${
            isConfirmed ? 'admin-guest-tag--confirmed' : 'admin-guest-tag--pending'
          }`}
        >
          {isConfirmed ? 'Confirmado' : 'Pendente'}
        </span>
        {isChild && <span className="admin-badge admin-badge--child">Criança</span>}
      </div>
    );
  };

  return (
    <div className="admin-combobox" ref={containerRef}>
      {/* ── CARD DE CONVIDADO SELECIONADO ── */}
      {selectedGuest ? (
        <div className="admin-selected-guest-card">
          <div className="admin-selected-guest-card__left">
            <span className="admin-selected-guest-card__icon" aria-hidden="true">
              <UserCheckIcon />
            </span>
            <div className="admin-selected-guest-card__info">
              <div className="admin-selected-guest-card__name-row">
                <strong className="admin-selected-guest-card__name">{selectedGuest.name}</strong>
                {selectedGuest.isChild && (
                  <span className="admin-badge admin-badge--child">Criança</span>
                )}
              </div>
              <span className="admin-selected-guest-card__family">
                {selectedGuest.familyTitle || 'Sem família especificada'}
              </span>
              <div className="admin-selected-guest-card__tags">
                <span
                  className={`admin-guest-tag ${
                    selectedGuest.rsvpStatus === 'CONFIRMED'
                      ? 'admin-guest-tag--confirmed'
                      : 'admin-guest-tag--pending'
                  }`}
                >
                  {selectedGuest.rsvpStatus === 'CONFIRMED' ? 'Confirmado' : 'Pendente'}
                </span>
                {selectedGuest.dietaryRestrictions && (
                  <span className="admin-tag-sub admin-tag-sub--dietary" title={selectedGuest.dietaryRestrictions}>
                    {selectedGuest.dietaryRestrictions}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="admin-selected-guest-card__actions">
            <button
              type="button"
              className="admin-btn admin-btn--outline admin-btn--sm"
              onClick={handleClearSelection}
              disabled={disabled}
              title="Trocar convidado selecionado"
            >
              Trocar
            </button>
          </div>
        </div>
      ) : (
        /* ── CAMPO DE BUSCA COM AUTOCOMPLETE ── */
        <div className="admin-combobox__input-container">
          <div className="admin-combobox__input-wrap">
            <span className="admin-combobox__icon" aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              role="combobox"
              className="admin-input admin-combobox__input"
              placeholder={placeholder}
              value={searchTerm}
              disabled={disabled}
              aria-expanded={isOpen}
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={
                isOpen && highlightedIndex >= 0
                  ? `${listboxId}-option-${highlightedIndex}`
                  : undefined
              }
              onFocus={() => {
                setIsOpen(true);
                if (highlightedIndex === -1 && filteredGuests.length > 0) {
                  setHighlightedIndex(0);
                }
              }}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
            />
            {searchTerm && (
              <button
                type="button"
                className="admin-combobox__clear-btn"
                onClick={() => {
                  setSearchTerm('');
                  inputRef.current?.focus();
                }}
                aria-label="Limpar texto da busca"
              >
                &times;
              </button>
            )}
          </div>

          {/* ── DROPDOWN LISTBOX COM SCROLL PRÓPRIO ── */}
          {isOpen && (
            <div className="admin-combobox__dropdown">
              {filteredGuests.length === 0 ? (
                <div className="admin-combobox__empty" role="status">
                  Nenhum convidado elegível encontrado.
                </div>
              ) : (
                <ul
                  ref={listboxRef}
                  id={listboxId}
                  role="listbox"
                  className="admin-combobox__list"
                  aria-label="Lista de convidados elegíveis sem mesa"
                >
                  {filteredGuests.map((guest, index) => {
                    const isHighlighted = index === highlightedIndex;
                    return (
                      <li
                        key={guest.id}
                        id={`${listboxId}-option-${index}`}
                        role="option"
                        aria-selected={isHighlighted}
                        className={`admin-combobox__option ${
                          isHighlighted ? 'admin-combobox__option--highlighted' : ''
                        }`}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => handleSelectOption(guest)}
                      >
                        <div className="admin-combobox__option-main">
                          <strong className="admin-combobox__option-name">{guest.name}</strong>
                          <span className="admin-combobox__option-family">
                            {guest.familyTitle || 'Sem família especificada'}
                          </span>
                        </div>
                        {renderStatusBadge(guest.rsvpStatus, guest.isChild)}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
