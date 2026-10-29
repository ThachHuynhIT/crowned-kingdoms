import { describe, expect, it } from 'vitest';
import { ALL_KINGS } from '../data/rules';
import { UI_KIT_FILES, uiFrameDef } from '../render/uiKit';
import { skinFrame } from './skin';

const FAMILIES = [
  ['button', 'buttonHover', 'buttonDown', 'buttonActive'],
  ['card', 'cardUncommon', 'cardRare', 'cardSelected'],
] as const;

describe('skinFrame', () => {
  it('neutral_compatibility: neutral and non-skinnable frames keep their own name', () => {
    expect(skinFrame('panel', 'neutral')).toBe('panel');
    expect(skinFrame('slot', 'arcane')).toBe('slot');
    expect(skinFrame('tooltip', 'wheat')).toBe('tooltip');
  });

  it('maps a skinnable frame to the king frame', () => {
    expect(skinFrame('button', 'arcane')).toBe('button@arcane');
    expect(skinFrame('cardSelected', 'wheat')).toBe('cardSelected@wheat');
  });

  it('skin_frame_states_have_equal_metadata: the states of one family swap without a size jump', () => {
    for (const skin of ALL_KINGS) {
      for (const family of FAMILIES) {
        const defs = family.map((f) => uiFrameDef(skinFrame(f, skin)));
        for (const d of defs) {
          expect(d.w).toBe(defs[0]!.w);
          expect(d.h).toBe(defs[0]!.h);
          expect(d.slice).toBe(defs[0]!.slice);
        }
      }
    }
  });

  it('kit_does_not_override_themed_frames: no Kenney file is mapped onto a king frame', () => {
    for (const id of Object.keys(UI_KIT_FILES)) expect(id).not.toContain('@');
  });
});
