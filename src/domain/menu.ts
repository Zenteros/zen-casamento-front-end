/**
 * Agrupamento do cardápio para exibição, no mesmo desenho do centro de mesa impresso.
 *
 * Regras (sem mudar o modelo de dados):
 * - "Bebidas · Cervejas" → grupo "Bebidas", subtítulo "Cervejas".
 * - "Bebidas" (sem "·"), quando existe algum "Bebidas · …" → cabeçalho do grupo;
 *   a descrição vira a linha de destaque (ex.: "Open bar · 8 horas").
 * - Demais seções ("Entrada", "Sobremesas"…) → grupo "Menu".
 * Os grupos aparecem na ordem em que surgem nas seções.
 */

export const DEFAULT_MENU_GROUP = 'Menu';
const GROUP_SEPARATOR = /\s+·\s+/;

export interface MenuLikeItem {
  id?: string | null;
  name: string;
  description?: string | null;
}

export interface MenuLikeSection {
  id?: string | null;
  title: string;
  description?: string | null;
  items?: MenuLikeItem[];
}

export interface MenuDisplaySection<I extends MenuLikeItem = MenuLikeItem> {
  key: string;
  heading: string | null;
  description: string | null;
  items: I[];
}

export interface MenuDisplayGroup<I extends MenuLikeItem = MenuLikeItem> {
  key: string;
  title: string;
  subtitle: string | null;
  sections: MenuDisplaySection<I>[];
}

const norm = (v: string) => v.normalize('NFC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('pt-BR');

function splitTitle(title: string): [string, string] | null {
  const match = GROUP_SEPARATOR.exec(title);
  if (!match || match.index === 0) return null;
  const group = title.slice(0, match.index).trim();
  const heading = title.slice(match.index + match[0].length).trim();
  return group && heading ? [group, heading] : null;
}

export function groupMenuSections<I extends MenuLikeItem, S extends MenuLikeSection & { items?: I[] }>(
  sections: S[]
): MenuDisplayGroup<I>[] {
  const prefixes = new Set<string>();
  for (const s of sections) {
    const split = splitTitle(s.title);
    if (split) prefixes.add(norm(split[0]));
  }

  const groups: MenuDisplayGroup<I>[] = [];
  const byKey = new Map<string, MenuDisplayGroup<I>>();
  const ensureGroup = (title: string) => {
    const key = norm(title);
    let g = byKey.get(key);
    if (!g) {
      g = { key, title, subtitle: null, sections: [] };
      byKey.set(key, g);
      groups.push(g);
    }
    return g;
  };

  sections.forEach((s, idx) => {
    const items = (s.items ?? []) as I[];
    const sectionKey = s.id ?? `${idx}-${s.title}`;
    const split = splitTitle(s.title);

    if (split) {
      ensureGroup(split[0]).sections.push({
        key: sectionKey,
        heading: split[1],
        description: s.description ?? null,
        items,
      });
      return;
    }

    if (prefixes.has(norm(s.title))) {
      const g = ensureGroup(s.title);
      g.title = s.title;
      if (s.description) g.subtitle = s.description;
      if (items.length > 0) {
        g.sections.push({ key: sectionKey, heading: null, description: null, items });
      }
      return;
    }

    ensureGroup(DEFAULT_MENU_GROUP).sections.push({
      key: sectionKey,
      heading: s.title,
      description: s.description ?? null,
      items,
    });
  });

  return groups.filter((g) => g.sections.length > 0 || g.subtitle);
}
