import type { KingId } from '../../data/types';
import type { Content } from '../../game/cards/registry';
import type { CalendarCell } from '../realm/calendarModel';
import { bossName } from './CalendarStrip';

/** The playing king's name, for the status row at the bottom left of the planning HUD. */
export const allyStatusText = (king: KingId, content: Content): string => content.king(king).nameVi;

/**
 * Who attacks in the year ahead, in a few words ("Địch: Thổ Phỉ"), for the bottom-right status
 * row. No health numbers: planning has no battle yet.
 */
export const foeStatusText = (next: CalendarCell | undefined, content: Content): string => {
  if (!next) return 'Địch: chưa rõ';
  switch (next.attacker) {
    case 'raiders':
      return 'Địch: Thổ Phỉ';
    case 'boss':
      return `Địch: Boss ${bossName(next.boss)}`;
    case 'coalition':
      return 'Địch: Liên Quân';
    default:
      return `Địch: ${content.enemyKing(next.attacker).nameVi}`;
  }
};
