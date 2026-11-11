import Phaser from 'phaser';
import { bindSceneDisplay, logicalSize } from '../ui/displayRuntime';
import { toCss } from '../data/palette';
import { UI_PALETTE } from '../data/uiPalette';
import { crownPoints } from '../game/meta';
import type { RunState } from '../game/run/state';
import { RESULT_BUTTON, resultLayout } from '../ui/modals/modalLayout';
import {
  addUiText,
  createButton,
  createPanel,
  frameBorder,
  type Button,
  type UiBox,
} from '../ui/theme';
import { crownTally, runSummary, type RunEndTally, type TallyLine } from '../ui/info/infoLines';
import { resolveShortcut, shortcutFlags } from '../ui/input/shortcuts';
import { openHelp } from './helpLauncher';
import { SCENES } from './keys';

export interface RunEndData {
  state: RunState;
  /** What the run settled for (from `run:ended`); missing → the score is recomputed with no unlock lines. */
  tally?: RunEndTally | null;
}

/** A shown line: a warning (long, wrapped) takes two line slots. */
interface Row {
  text: Phaser.GameObjects.Text;
  slots: number;
}

const ROW_STYLE: Record<TallyLine['tone'], { color: number; size: number; bold: boolean }> = {
  plain: { color: UI_PALETTE.text, size: 18, bold: false },
  total: { color: UI_PALETTE.text, size: 20, bold: true },
  unlock: { color: UI_PALETTE.good, size: 17, bold: true },
  warning: { color: UI_PALETTE.bad, size: 14, bold: false },
};

/** Space between the panel border and its content. */
const PAD = 16;

/**
 * End of a run (§10.8, G1 subset): a big panel with the outcome, the year reached, battles
 * won/lost, enemies, conquered kings and bosses defeated, the Crown Point tally (§9.1) with the
 * new unlocks and save notices, then **Về menu** and **Ván mới** (a fresh seed). The tally comes
 * in the launch data, captured from `run:ended` by the realm.
 */
export class RunEndScene extends Phaser.Scene {
  private state: RunState | null = null;
  private panel!: UiBox;
  private title!: Phaser.GameObjects.Text;
  private rows: Row[] = [];
  private buttons: Button[] = [];

  constructor() {
    super(SCENES.runEnd);
  }

  create(data: Partial<RunEndData> = {}): void {
    bindSceneDisplay(this, () => this.layout());
    // Scene instances are reused: reset every per-run field first.
    this.state = data.state ?? null;
    this.rows = [];
    this.buttons = [];
    this.cameras.main.setBackgroundColor(toCss(UI_PALETTE.sky[3]));

    const state = this.state;
    const won = state?.won === true;
    const skin = state?.kingId ?? 'neutral';
    this.panel = createPanel(this, 'panel', 320, 240, 0, 0, skin);
    this.title = addUiText(this, 0, 0, won ? 'Chiến thắng!' : 'Vương quốc sụp đổ', 30, won ? UI_PALETTE.text : UI_PALETTE.bad)
      .setOrigin(0.5)
      .setFontStyle('bold');
    const tally = state ? (data.tally ?? fallbackTally(state)) : null;
    const lines: TallyLine[] = state && tally
      ? [...runSummary(state).map((text): TallyLine => ({ text, tone: 'plain' })), ...crownTally(state, tally)]
      : [];
    this.rows = lines.map((line) => {
      const style = ROW_STYLE[line.tone];
      const text = addUiText(this, 0, 0, line.text, style.size, style.color).setOrigin(0.5).setAlign('center');
      if (style.bold) text.setFontStyle('bold');
      return { text, slots: line.tone === 'warning' ? 2 : 1 };
    });
    this.buttons = [
      createButton(this, 0, 0, 'Về menu', {
        width: RESULT_BUTTON.w,
        height: RESULT_BUTTON.h,
        fontSize: 18,
        onClick: () => this.toMenu(),
        skin,
      }),
      createButton(this, 0, 0, 'Ván mới', {
        width: RESULT_BUTTON.w,
        height: RESULT_BUTTON.h,
        fontSize: 18,
        onClick: () => this.newRun(),
        skin,
      }),
    ];

    this.input.keyboard?.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.onKey, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.teardown, this);
    this.layout();
  }

  private toMenu(): void {
    this.scene.start(SCENES.mainMenu);
  }

  private newRun(): void {
    this.scene.start(SCENES.kingSelect);
  }

  private onKey(event: KeyboardEvent): void {
    const action = resolveShortcut(event.key, 'runEnd', shortcutFlags(event));
    if (action === 'help.toggle') {
      event.preventDefault();
      openHelp(this, null, null);
    }
    else if (action === 'newRun') this.newRun();
    else if (action === 'back') this.toMenu();
  }

  private layout(): void {
    const screen = logicalSize(this);
    const inset = frameBorder(this, 'panel') + PAD;
    const slots = this.rows.reduce((n, r) => n + r.slots, 0);
    const l = resultLayout(screen, inset, slots, this.buttons.length);
    this.panel.resize(l.panel.w, l.panel.h);
    this.panel.image.setPosition(l.panel.x, l.panel.y);
    this.title.setFontSize(screen.w >= 768 ? 30 : 26);
    this.title.setPosition(l.title.x + l.title.w / 2, l.title.y + l.title.h / 2);
    let slot = 0;
    for (const row of this.rows) {
      const first = l.lines[slot]!;
      const last = l.lines[slot + row.slots - 1]!;
      row.text.setWordWrapWidth(first.w);
      row.text.setPosition(Math.round(first.x + first.w / 2), Math.round((first.y + last.y + last.h) / 2));
      slot += row.slots;
    }
    this.buttons.forEach((b, i) => {
      const r = l.buttons[i]!;
      b.container.setPosition(r.x + r.w / 2, r.y + r.h / 2);
    });
  }

  private teardown(): void {
    this.input.keyboard?.off(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.onKey, this);
    this.state = null;
  }
}

/** No tally in the launch data (e.g. started by hand): the run's own score, nothing unlocked. */
const fallbackTally = (state: RunState): RunEndTally => {
  const breakdown = crownPoints(state);
  return { crownPoints: breakdown.total, breakdown, unlocks: [], credited: null };
};
