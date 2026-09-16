import React, { useState, useEffect, useRef, useMemo, useId } from 'react';
import type { AdminTableItemDTO } from '../../contracts/index.js';

export interface TableSearchComboboxProps {
  tables: AdminTableItemDTO[];
  selectedTableId: string;
  onSelect: (tableId: string) => void;
  currentTableId?: string;
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

const TableLayoutIcon: React.FC = () => (
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
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </svg>
);

export const TableSearchCombobox: React.FC<TableSearchComboboxProps> = ({
  tables,
  selectedTableId,
  onSelect,
  currentTableId,
  placeholder = 'Buscar mesa de destino...',
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

  // Localizar a mesa atualmente selecionada como destino
  const selectedTable = useMemo(() => {
    if (!selectedTableId) return null;
    return tables.find((t) => t.id === selectedTableId) || null;
  }, [tables, selectedTableId]);

  // Filtragem de mesas por nome ou localização (insensível a maiúsculas/acentos)
  const filteredTables = useMemo(() => {
    const term = normalizeText(searchTerm);
    if (!term) return tables;

    return tables.filter((t) => {
      const nameNorm = normalizeText(t.name);
      const locNorm = normalizeText(t.locationHint || '');
      return nameNorm.includes(term) || locNorm.includes(term);
    });
  }, [tables, searchTerm]);

  // Verifica se todas as mesas cadastradas estão cheias
  const areAllTablesFull = useMemo(() => {
    return tables.length > 0 && tables.every((t) => t.available <= 0 || t.isFull);
  }, [tables]);

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

  const handleSelectOption = (table: AdminTableItemDTO) => {
    const isCurrent = Boolean(currentTableId && table.id === currentTableId);
    const isFull = table.available <= 0 || table.isFull;

    if (isCurrent || isFull || disabled) {
      return;
    }

    onSelect(table.id);
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
        setHighlightedIndex(filteredTables.length > 0 ? 0 : -1);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredTables.length === 0) return;
      setHighlightedIndex((prev) => (prev < filteredTables.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredTables.length === 0) return;
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredTables.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredTables.length) {
        handleSelectOption(filteredTables[highlightedIndex]);
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

  return (
    <div className="admin-combobox" ref={containerRef}>
      {/* ── CARD DE MESA SELECIONADA ── */}
      {selectedTable ? (
        <div className="admin-selected-guest-card admin-selected-table-card">
          <div className="admin-selected-guest-card__left">
            <span className="admin-selected-guest-card__icon" aria-hidden="true">
              <TableLayoutIcon />
            </span>
            <div className="admin-selected-guest-card__info">
              <div className="admin-selected-guest-card__name-row">
                <strong className="admin-selected-guest-card__name">{selectedTable.name}</strong>
                <span className="admin-table-tag admin-table-tag--available">
                  {selectedTable.available} {selectedTable.available === 1 ? 'vaga livre' : 'vagas livres'}
                </span>
              </div>
              <span className="admin-selected-guest-card__family">
                {selectedTable.occupied}/{selectedTable.capacity} lugares ocupados
              </span>
              {selectedTable.locationHint && (
                <span className="admin-selected-table-card__location">
                  📍 {selectedTable.locationHint}
                </span>
              )}
            </div>
          </div>

          <div className="admin-selected-guest-card__actions">
            <button
              type="button"
              className="admin-btn admin-btn--outline admin-btn--sm"
              onClick={handleClearSelection}
              disabled={disabled}
              title="Trocar mesa selecionada"
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
                if (highlightedIndex === -1 && filteredTables.length > 0) {
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
              {filteredTables.length === 0 ? (
                <div className="admin-combobox__empty" role="status">
                  {areAllTablesFull
                    ? 'Todas as mesas estão lotadas.'
                    : 'Nenhuma mesa disponível encontrada.'}
                </div>
              ) : (
                <ul
                  ref={listboxRef}
                  id={listboxId}
                  role="listbox"
                  className="admin-combobox__list"
                  aria-label="Lista de mesas de destino"
                >
                  {filteredTables.map((table, index) => {
                    const isHighlighted = index === highlightedIndex;
                    const isCurrent = Boolean(currentTableId && table.id === currentTableId);
                    const isFull = table.available <= 0 || table.isFull;
                    const isSelectable = !isCurrent && !isFull && !disabled;

                    return (
                      <li
                        key={table.id}
                        id={`${listboxId}-option-${index}`}
                        role="option"
                        aria-selected={isHighlighted}
                        aria-disabled={!isSelectable}
                        className={`admin-combobox__option ${
                          isHighlighted ? 'admin-combobox__option--highlighted' : ''
                        } ${!isSelectable ? 'admin-combobox__option--disabled' : ''}`}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => {
                          if (isSelectable) {
                            handleSelectOption(table);
                          }
                        }}
                      >
                        <div className="admin-combobox__option-main">
                          <div className="admin-combobox__option-title-row">
                            <strong className="admin-combobox__option-name">{table.name}</strong>
                          </div>
                          <span className="admin-combobox__option-desc">
                            {table.occupied}/{table.capacity} lugares &bull;{' '}
                            {table.available} {table.available === 1 ? 'vaga livre' : 'vagas livres'}
                          </span>
                          {table.locationHint && (
                            <span className="admin-combobox__option-location">
                              📍 {table.locationHint}
                            </span>
                          )}
                        </div>

                        <div className="admin-combobox-tags">
                          {isCurrent ? (
                            <span
                              className="admin-table-tag admin-table-tag--current"
                              title="Mesa atual do convidado"
                            >
                              Mesa atual
                            </span>
                          ) : isFull ? (
                            <span
                              className="admin-table-tag admin-table-tag--full"
                              title="Mesa sem vagas livres"
                            >
                              Lotada
                            </span>
                          ) : (
                            <span
                              className="admin-table-tag admin-table-tag--available"
                              title={`${table.available} vagas disponíveis`}
                            >
                              {table.available} {table.available === 1 ? 'vaga' : 'vagas'}
                            </span>
                          )}
                        </div>
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
