import { describe, expect, it } from 'vitest';
import { kingTitleParts } from './kingTitle';

describe('kingTitleParts', () => {
  it('splits "Vua Lúa Mì" into the plain prefix and the coloured title', () => {
    expect(kingTitleParts('Vua Lúa Mì')).toEqual({ prefix: 'Vua của ', title: 'Lúa Mì' });
    expect(kingTitleParts('Vua Đá Núi')).toEqual({ prefix: 'Vua của ', title: 'Đá Núi' });
  });

  it('does not repeat "của" when the name already has it', () => {
    expect(kingTitleParts('Vua của Phép Thuật')).toEqual({ prefix: 'Vua của ', title: 'Phép Thuật' });
  });

  it('keeps a name without the "Vua" prefix whole as the title', () => {
    expect(kingTitleParts('Du Mục Hãn')).toEqual({ prefix: '', title: 'Du Mục Hãn' });
    expect(kingTitleParts('')).toEqual({ prefix: '', title: '' });
  });

  it('does not treat a name that merely starts with the letters "Vua" as a prefix', () => {
    expect(kingTitleParts('Vuaxyz')).toEqual({ prefix: '', title: 'Vuaxyz' });
  });
});
