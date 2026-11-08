/** Write the code-generated PWA icons to public/icons/ (`npm run icons`). */
import { mkdirSync, writeFileSync } from 'node:fs';
import { makeIcon } from './pwa';

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/crown-192.png', makeIcon(192, false));
writeFileSync('public/icons/crown-512.png', makeIcon(512, false));
writeFileSync('public/icons/crown-maskable-512.png', makeIcon(512, true));
console.log('public/icons/crown-{192,512,maskable-512}.png');
