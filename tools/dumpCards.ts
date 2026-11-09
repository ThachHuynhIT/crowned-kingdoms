/** Regenerate docs/art-review/g3e/cards/cards.json (the card-art catalogue) from the registry: `npx tsx tools/dumpCards.ts`. */
import { writeFileSync } from 'node:fs';
import { CONTENT } from '../src/game/cards/registry';
import { describeCard } from '../src/game/cards/describe';

const ownerOf = (id: string): string => id.split('_', 1)[0]!;
const cards = CONTENT.allCards()
  .map((c) => ({
    id: c.id,
    nameVi: c.nameVi,
    owner: ownerOf(c.id),
    kind: c.kind,
    rarity: c.rarity,
    summary: `${c.nameVi} | ${describeCard(c).lines.join(' ')}`,
  }))
  .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
writeFileSync('docs/art-review/g3e/cards/cards.json', JSON.stringify(cards, null, 2) + '\n');
console.log(`${cards.length} cards`);
