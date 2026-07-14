import {SYMBOL_CLASS_REGISTRY} from '../../data-types/page/symbol-class-registry';

/**
 * Declarative catalog of all customizable editor tool-bar buttons.
 *
 * Each button has a stable id `<section>.<name>` that the user's tool-bar
 * customization (UserConfigSettings.toolbarHiddenButtons) refers to. Buttons
 * marked `forced` (all delete/trash and lock buttons) can never be hidden.
 * The symbol-class buttons of the Symbols section are derived from the
 * symbol-class-registry and are customizable individually.
 */
export interface ToolBarButtonDef {
  id: string;
  section: ToolBarSectionId;
  label: string;
  /** Material ligature icon name (mutually exclusive with svgIcon/svgPath). */
  matIcon?: string;
  /** Registered material svgIcon name. */
  svgIcon?: string;
  /** Inline glyph path (100x100 viewBox), used by registry-defined symbol classes. */
  svgPath?: string;
  svgPathStroke?: number;
  /** Forced buttons are always visible and cannot be hidden. */
  forced?: boolean;
  /** Start in the section's overflow menu instead of the tool bar (until the
   *  user customizes the section). */
  hiddenByDefault?: boolean;
}

export type ToolBarSectionId = 'general' | 'staffLines' | 'layout' | 'symbols' | 'text';

export const TOOLBAR_SECTION_TITLES: Record<ToolBarSectionId, string> = {
  general: $localize`General`,
  staffLines: $localize`Staff Lines`,
  layout: $localize`Layout`,
  symbols: $localize`Symbols`,
  text: $localize`Text`,
};

const STATIC_TOOLBAR_BUTTONS: ToolBarButtonDef[] = [
  // General
  {id: 'general.save', section: 'general', label: $localize`Save the annotations`, matIcon: 'save'},
  {id: 'general.undo', section: 'general', label: $localize`Undo the last action`, matIcon: 'undo'},
  {id: 'general.redo', section: 'general', label: $localize`Redo an undone action`, matIcon: 'redo'},
  {id: 'general.clearPage', section: 'general', label: $localize`Clear all page annotations`, matIcon: 'delete', forced: true},
  {id: 'general.view', section: 'general', label: $localize`View different annotations without editing`, matIcon: 'remove_red_eye'},
  {id: 'general.lockAll', section: 'general', label: $localize`Mark all steps as finished`, matIcon: 'lock', forced: true},
  {id: 'general.help', section: 'general', label: $localize`Open the cheat sheet`, matIcon: 'help_outline'},

  // Staff lines
  {id: 'staffLines.autoDetect', section: 'staffLines', label: $localize`Run the automatic staff line detection`, matIcon: 'developer_board'},
  {id: 'staffLines.edit', section: 'staffLines', label: $localize`Create, edit, or delete single staff lines`, svgIcon: 'edit_stafflines'},
  {id: 'staffLines.group', section: 'staffLines', label: $localize`Group single staff lines into staffs`, svgIcon: 'group_stafflines'},
  {id: 'staffLines.split', section: 'staffLines', label: $localize`Split or shrink staff lines`, svgIcon: 'split_stafflines'},
  {id: 'staffLines.clearAll', section: 'staffLines', label: $localize`Remove all staves`, matIcon: 'delete', forced: true},
  {id: 'staffLines.lock', section: 'staffLines', label: $localize`Mark the staff line editing progress as finished`, matIcon: 'lock', forced: true},

  // Layout
  {id: 'layout.autoDetect', section: 'layout', label: $localize`Run the automatic layout detection`, matIcon: 'developer_board'},
  {id: 'layout.edit', section: 'layout', label: $localize`Create, edit or delete the layout`, matIcon: 'edit'},
  {id: 'layout.connectedComponents', section: 'layout', label: $localize`Extract a region based on connected components`, svgIcon: 'connected_component'},
  {id: 'layout.lasso', section: 'layout', label: $localize`Draw a lasso to create or extend a region`, svgIcon: 'lasso'},
  {id: 'layout.splitLines', section: 'layout', label: $localize`Split text lines in a region`, svgIcon: 'split_stafflines'},
  {id: 'layout.mergeLines', section: 'layout', label: $localize`Merge text lines`, matIcon: 'call_merge'},
  {id: 'layout.clearAll', section: 'layout', label: $localize`Remove all layout`, matIcon: 'delete', forced: true},
  {id: 'layout.lock', section: 'layout', label: $localize`Mark the layout as finished`, matIcon: 'lock', forced: true},

  // Symbols (the symbol-class buttons are appended from the registry below)
  {id: 'symbols.autoDetect', section: 'symbols', label: $localize`Run the automatic symbol detection`, matIcon: 'developer_board'},
  {id: 'symbols.end2end', section: 'symbols', label: $localize`Run the end-to-end transcription`, matIcon: 'auto_awesome', hiddenByDefault: true},
  {id: 'symbols.logicalConnection', section: 'symbols', label: $localize`Add, move or delete logical connections`, svgIcon: 'note_separator'},
  {id: 'symbols.copyArea', section: 'symbols', label: $localize`Copy and Paste Symbol Area`, svgIcon: 'split_stafflines'},
  {id: 'symbols.lock', section: 'symbols', label: $localize`Mark the symbols as finished`, matIcon: 'lock', forced: true},

  // Text
  {id: 'text.autoReadingOrder', section: 'text', label: $localize`Compute the reading order automatically`, svgIcon: 'reading_order_auto'},
  {id: 'text.pasteTool', section: 'text', label: $localize`Paste from existing transcribed text`, matIcon: 'import_contacts'},
  {id: 'text.ocr', section: 'text', label: $localize`Run the automatic character recognition`, matIcon: 'developer_board'},
  {id: 'text.editLyrics', section: 'text', label: $localize`Edit lyrics and other texts`, matIcon: 'edit'},
  {id: 'text.autoSyllables', section: 'text', label: $localize`Assign syllables to neumes automatically`, svgIcon: 'syllable_auto'},
  {id: 'text.syllables', section: 'text', label: $localize`Assign syllables to neumes`, matIcon: 'link'},
  {id: 'text.lock', section: 'text', label: $localize`Mark text editing as finished`, matIcon: 'lock', forced: true},
];

function symbolClassButtons(): ToolBarButtonDef[] {
  return SYMBOL_CLASS_REGISTRY.map(sc => ({
    id: sc.id,
    section: 'symbols' as ToolBarSectionId,
    label: sc.label,
    svgIcon: sc.svgIcon,
    svgPath: sc.svgPath,
    svgPathStroke: sc.svgPathStroke,
    hiddenByDefault: sc.hiddenByDefault,
  }));
}

export function toolbarButtonsOfSection(section: ToolBarSectionId): ToolBarButtonDef[] {
  const buttons = STATIC_TOOLBAR_BUTTONS.concat(symbolClassButtons());
  return buttons.filter(b => b.section === section);
}

export function toolbarButton(id: string): ToolBarButtonDef {
  return STATIC_TOOLBAR_BUTTONS.concat(symbolClassButtons()).find(b => b.id === id);
}

export function isForcedToolbarButton(id: string): boolean {
  const b = toolbarButton(id);
  return !!(b && b.forced);
}

/** Ids hidden in the overflow menu when the user has not customized the section. */
export function defaultHiddenToolbarButtons(section: ToolBarSectionId): string[] {
  return toolbarButtonsOfSection(section).filter(b => b.hiddenByDefault && !b.forced).map(b => b.id);
}
