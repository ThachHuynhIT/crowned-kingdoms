/** A king's name split for the two-colour heading: plain prefix, then the coloured title. */
export interface KingTitleParts {
  prefix: string;
  title: string;
}

const OF = 'Vua của ';
const KING = 'Vua ';

/** "Vua Lúa Mì" → "Vua của " + "Lúa Mì"; a name that already says "Vua của" is not doubled; others stay whole. */
export const kingTitleParts = (nameVi: string): KingTitleParts => {
  if (nameVi.startsWith(OF)) return { prefix: OF, title: nameVi.slice(OF.length) };
  if (nameVi.startsWith(KING)) return { prefix: OF, title: nameVi.slice(KING.length) };
  return { prefix: '', title: nameVi };
};

/** The heading of a king the player has not unlocked: the title stays a mystery. */
export const LOCKED_KING_TITLE: KingTitleParts = { prefix: OF, title: '?' };
