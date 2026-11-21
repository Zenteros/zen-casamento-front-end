import React, { useMemo, useState } from 'react';
import type {
  AdminMenuImportItemPreviewDTO,
  AdminMenuImportResponseDTO,
  AdminMenuImportStatus,
} from '../../contracts/index.js';
import { apiFetch } from '../../lib/api.js';
import { readApiFormError } from '../../lib/apiErrors.js';
import { groupMenuSections } from '../../domain/menu.js';

interface MenuPasteModalProps {
  onClose: () => void;
  /** Chamado depois de gravar, com a mensagem de sucesso. */
  onSaved: (message: string) => void;
}

const EXAMPLE = `[Entrada]
Polentinha frita com parmesão

[Bebidas | Open bar · 8 horas]

[Bebidas · Drinks]
Negroni | Gin, Campari Bitter, vermute tinto e laranja`;

const STATUS_LABEL: Record<AdminMenuImportStatus, string> = {
  create: 'Novo',
  update: 'Atualiza',
  unchanged: 'Igual',
};

const StatusBadge: React.FC<{ status: AdminMenuImportStatus; changes: string[] }> = ({ status, changes }) => (
  <span
    className={`menu-paste-badge menu-paste-badge--${status}`}
    title={changes.length > 0 ? `Muda: ${changes.join(', ')}` : undefined}
  >
    {STATUS_LABEL[status]}
    {status === 'update' && changes.length > 0 ? ` · ${changes.join(', ')}` : ''}
  </span>
);

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export const MenuPasteModal: React.FC<MenuPasteModalProps> = ({ onClose, onSaved }) => {
  const [text, setText] = useState('');
  const [deactivateMissing, setDeactivateMissing] = useState(true);
  const [preview, setPreview] = useState<AdminMenuImportResponseDTO | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [busy, setBusy] = useState<'preview' | 'save' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentKey = `${deactivateMissing}::${text}`;
  const previewIsCurrent = preview !== null && previewKey === currentKey;

  const groups = useMemo(
    () =>
      preview
        ? groupMenuSections(preview.sections.map((sec) => ({ ...sec, id: String(sec.line) })))
        : [],
    [preview]
  );
  // Seções da prévia indexadas pela linha do texto (a chave usada no agrupamento).
  const sectionByLine = useMemo(
    () => new Map((preview?.sections ?? []).map((sec) => [String(sec.line), sec])),
    [preview]
  );
  const sectionByTitle = useMemo(
    () => new Map((preview?.sections ?? []).map((sec) => [sec.title, sec])),
    [preview]
  );

  const send = async (dryRun: boolean) => {
    setBusy(dryRun ? 'preview' : 'save');
    setError(null);
    try {
      const res = await apiFetch('/api/v1/admin/menu/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, dryRun, deactivateMissing }),
      });

      if (res.ok) {
        const data: AdminMenuImportResponseDTO = await res.json();
        if (dryRun) {
          setPreview(data);
          setPreviewKey(currentKey);
        } else {
          const s = data.summary;
          const parts = [
            s.sectionsCreated + s.itemsCreated > 0 &&
              `${plural(s.sectionsCreated, 'seção nova', 'seções novas')} e ${plural(s.itemsCreated, 'item novo', 'itens novos')}`,
            s.sectionsUpdated + s.itemsUpdated > 0 &&
              `${plural(s.sectionsUpdated + s.itemsUpdated, 'registro atualizado', 'registros atualizados')}`,
            s.sectionsDeactivated + s.itemsDeactivated > 0 &&
              `${plural(s.sectionsDeactivated + s.itemsDeactivated, 'registro desativado', 'registros desativados')}`,
          ].filter(Boolean);
          onSaved(parts.length > 0 ? `Cardápio salvo: ${parts.join(', ')}.` : 'Cardápio já estava igual ao texto. Nada mudou.');
        }
        return;
      }

      if (res.status === 400) {
        const body = (await res.clone().json().catch(() => null)) as AdminMenuImportResponseDTO | null;
        if (body && Array.isArray(body.errors) && body.sections) {
          setPreview(body);
          setPreviewKey(currentKey);
        }
      }
      const apiError = await readApiFormError(res, 'Não foi possível ler o cardápio.');
      setError(apiError.message);
    } catch {
      setError('Sem conexão com o servidor. Tente de novo.');
    } finally {
      setBusy(null);
    }
  };

  const s = preview?.summary;
  const missingCount = (preview?.missing.sections.length ?? 0) + (preview?.missing.items.length ?? 0);
  const canSave = previewIsCurrent && preview.valid && busy === null;

  return (
    <div className="admin-modal-backdrop animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="menu-paste-title">
      <div className="admin-modal-card menu-paste-modal">
        <div className="admin-modal-header">
          <h2 id="menu-paste-title" className="admin-modal-title">Colar cardápio</h2>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <div className="admin-modal-body menu-paste-body">
          <div className="menu-paste-editor">
            <label className="admin-label" htmlFor="menu-paste-text">
              Texto do cardápio
            </label>
            <p className="menu-paste-help">
              <code>[Seção]</code> abre uma seção. Cada linha seguinte é um item. Use <code>|</code> para a
              descrição: <code>Negroni | Gin, Campari…</code>. Em <code>[Bebidas · Drinks]</code>, a parte antes
              do “·” agrupa as seções. <code>[Bebidas | Open bar · 8 horas]</code> define o destaque do grupo.
              Itens e seções com o mesmo nome são reaproveitados.
            </p>
            <textarea
              id="menu-paste-text"
              className="admin-textarea menu-paste-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={EXAMPLE}
              spellCheck={false}
              rows={18}
            />
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={deactivateMissing}
                onChange={(e) => setDeactivateMissing(e.target.checked)}
              />
              <span>Desativar (sem apagar) seções e itens que não estão no texto</span>
            </label>
          </div>

          <div className="menu-paste-preview" aria-live="polite">
            {!preview && (
              <div className="menu-paste-empty">
                <p>Cole o cardápio e clique em <strong>Gerar prévia</strong>.</p>
                <p>Nada é gravado antes de você confirmar.</p>
              </div>
            )}

            {preview && (
              <>
                {!previewIsCurrent && (
                  <div className="admin-alert menu-paste-stale">O texto mudou. Gere a prévia de novo antes de salvar.</div>
                )}

                {preview.errors.length > 0 && (
                  <div className="admin-alert admin-alert--error" role="alert">
                    <strong>Corrija {plural(preview.errors.length, 'linha', 'linhas')} antes de salvar:</strong>
                    <ul className="menu-paste-errors">
                      {preview.errors.map((e, i) => (
                        <li key={i}>
                          Linha {e.line}: {e.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {s && preview.valid && (
                  <p className="menu-paste-summary">
                    {plural(s.sectionsCreated, 'seção nova', 'seções novas')},{' '}
                    {plural(s.itemsCreated, 'item novo', 'itens novos')},{' '}
                    {plural(s.sectionsUpdated + s.itemsUpdated, 'atualização', 'atualizações')},{' '}
                    {plural(s.sectionsUnchanged + s.itemsUnchanged, 'registro igual', 'registros iguais')}.
                  </p>
                )}

                <div className="menu-paste-groups">
                  {groups.map((g) => {
                    const header = sectionByTitle.get(g.title);
                    return (
                      <section key={g.key} className="menu-paste-group">
                        <h3 className="menu-paste-group__title">
                          {g.title}
                          {header && header.title === g.title && (
                            <StatusBadge status={header.status} changes={header.changes} />
                          )}
                        </h3>
                        {g.subtitle && <p className="menu-paste-group__subtitle">{g.subtitle}</p>}
                        {g.sections.map((sec) => {
                          const source = sectionByLine.get(sec.key);
                          return (
                            <div key={sec.key} className="menu-paste-section">
                              {sec.heading && (
                                <h4 className="menu-paste-section__title">
                                  {sec.heading}
                                  {source && <StatusBadge status={source.status} changes={source.changes} />}
                                </h4>
                              )}
                              {sec.description && <p className="menu-paste-section__desc">{sec.description}</p>}
                              <ul className="menu-paste-items">
                                {(sec.items as AdminMenuImportItemPreviewDTO[]).map((item) => (
                                  <li key={`${item.line}`} className="menu-paste-item">
                                    <div>
                                      <span className="menu-paste-item__name">{item.name}</span>
                                      {item.description && (
                                        <span className="menu-paste-item__desc">{item.description}</span>
                                      )}
                                    </div>
                                    <StatusBadge status={item.status} changes={item.changes} />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </section>
                    );
                  })}
                </div>

                {missingCount > 0 && (
                  <div className="menu-paste-missing">
                    <strong>
                      {deactivateMissing ? 'Serão desativados' : 'Continuam ativos'} (fora do texto):
                    </strong>
                    <ul>
                      {preview.missing.sections.map((m) => (
                        <li key={m.id}>Seção “{m.title}”</li>
                      ))}
                      {preview.missing.items.map((m) => (
                        <li key={m.id}>
                          “{m.name}” em {m.sectionTitle}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="admin-alert admin-alert--error menu-paste-footer-error" role="alert">
            {error}
          </div>
        )}

        <div className="admin-modal-actions menu-paste-actions">
          <button type="button" className="admin-btn admin-btn--outline" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--outline"
            onClick={() => send(true)}
            disabled={!text.trim() || busy !== null}
          >
            {busy === 'preview' ? 'Gerando...' : 'Gerar prévia'}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => send(false)}
            disabled={!canSave}
            title={!previewIsCurrent ? 'Gere a prévia do texto atual primeiro' : undefined}
          >
            {busy === 'save' ? 'Salvando...' : 'Salvar cardápio'}
          </button>
        </div>
      </div>
    </div>
  );
};
