import {EditorTools} from '../tool-bar/tool-bar-state.service';

/**
 * Declarative catalog of the sheet-overlay appearance settings.
 *
 * Each setting has a stable id `<group>.<name>` that the user's configuration
 * (UserConfigSettings.appearance) refers to. Settings carrying a `cssVar` are
 * applied by writing that custom property onto the sheet-overlay host element;
 * the overlay stylesheets read them as `var(--ommr-…, <default>)`, so an
 * unconfigured installation keeps exactly the look it had before. The few
 * settings without a `cssVar` are consumed in TypeScript (scale factors and
 * colors that are bound as SVG presentation attributes, where custom property
 * substitution does not apply).
 */
export type AppearanceGroupId = 'staffLines' | 'symbols' | 'readingOrder' | 'text' | 'regions';

export type AppearanceKind = 'color' | 'range' | 'number' | 'select';

export interface AppearanceSettingDef {
  id: string;
  group: AppearanceGroupId;
  label: string;
  kind: AppearanceKind;
  /** Custom property to write on the overlay host; absent => read in TS. */
  cssVar?: string;
  /** Unit appended when the value is written as a custom property. */
  unit?: string;
  default: string | number;
  min?: number;
  max?: number;
  step?: number;
  options?: {value: string, label: string}[];
}

export interface AppearanceGroupDef {
  title: string;
  /** Editor tools for which this group is auto-expanded. */
  tools: EditorTools[];
}

export const APPEARANCE_GROUPS: Record<AppearanceGroupId, AppearanceGroupDef> = {
  staffLines: {
    title: $localize`Staff lines`,
    tools: [EditorTools.CreateStaffLines, EditorTools.GroupStaffLines, EditorTools.SplitStaffLines],
  },
  symbols: {
    title: $localize`Symbols`,
    tools: [EditorTools.Symbol, EditorTools.SymbolCopyArea],
  },
  readingOrder: {
    title: $localize`Reading order`,
    tools: [],
  },
  text: {
    title: $localize`Text`,
    tools: [EditorTools.Lyrics, EditorTools.Syllables],
  },
  regions: {
    title: $localize`Regions`,
    tools: [EditorTools.Layout, EditorTools.LayoutExtractConnectedComponents, EditorTools.LayoutLassoArea,
            EditorTools.LayoutSplitTextLines, EditorTools.LayoutMergeTextLines],
  },
};

const DASH_OPTIONS = [
  {value: 'none', label: $localize`Solid`},
  {value: '4 2', label: $localize`Dashed`},
  {value: '1', label: $localize`Dotted`},
  {value: '8 4', label: $localize`Long dashes`},
];

export const APPEARANCE_SETTINGS: AppearanceSettingDef[] = [
  // Staff lines
  {id: 'staffLines.color', group: 'staffLines', label: $localize`Color`, kind: 'color',
   cssVar: '--ommr-staff-line-color', default: '#000080'},
  {id: 'staffLines.width', group: 'staffLines', label: $localize`Line width`, kind: 'range',
   cssVar: '--ommr-staff-line-width', unit: 'px', default: 2, min: 0.5, max: 8, step: 0.5},
  {id: 'staffLines.highlightWidth', group: 'staffLines', label: $localize`Highlighted line width`, kind: 'range',
   cssVar: '--ommr-staff-line-highlight-width', unit: 'px', default: 5, min: 1, max: 12, step: 0.5},
  {id: 'staffLines.spaceDash', group: 'staffLines', label: $localize`Space line style`, kind: 'select',
   cssVar: '--ommr-staff-line-space-dash', default: '4 8',
   options: DASH_OPTIONS.concat([{value: '4 8', label: $localize`Wide dashes`}])},
  {id: 'staffLines.dryPointColor', group: 'staffLines', label: $localize`Dry point line color`, kind: 'color',
   cssVar: '--ommr-staff-line-dry-point-color', default: '#8b0000'},

  // Symbols
  {id: 'symbols.colorOnStaffLine', group: 'symbols', label: $localize`Color on a staff line`, kind: 'color',
   default: '#ffff00'},
  {id: 'symbols.colorOffStaffLine', group: 'symbols', label: $localize`Color between staff lines`, kind: 'color',
   default: '#1cff03'},
  {id: 'symbols.clefColor', group: 'symbols', label: $localize`Clef color`, kind: 'color',
   cssVar: '--ommr-clef-color', default: '#00ffff'},
  {id: 'symbols.accidColor', group: 'symbols', label: $localize`Accidental color`, kind: 'color',
   cssVar: '--ommr-accid-color', default: '#ffff00'},
  {id: 'symbols.sizeFactor', group: 'symbols', label: $localize`Symbol size`, kind: 'range',
   default: 1, min: 0.4, max: 2.5, step: 0.05},
  {id: 'symbols.strokeWidth', group: 'symbols', label: $localize`Symbol line width`, kind: 'range',
   cssVar: '--ommr-symbol-stroke-width', default: 2, min: 0.5, max: 6, step: 0.5},
  {id: 'symbols.connectionColor', group: 'symbols', label: $localize`Graphical connection color`, kind: 'color',
   cssVar: '--ommr-graphical-connection-color', default: '#00ffe2'},
  {id: 'symbols.connectionWidth', group: 'symbols', label: $localize`Graphical connection width`, kind: 'range',
   cssVar: '--ommr-note-connection-width', default: 2, min: 0.5, max: 8, step: 0.5},
  {id: 'symbols.connectionDash', group: 'symbols', label: $localize`Graphical connection style`, kind: 'select',
   cssVar: '--ommr-graphical-connection-dash', default: 'none', options: DASH_OPTIONS},
  {id: 'symbols.logicalConnectionColor', group: 'symbols', label: $localize`Logical connection color`, kind: 'color',
   cssVar: '--ommr-logical-connection-color', default: '#111111'},
  {id: 'symbols.logicalConnectionDash', group: 'symbols', label: $localize`Logical connection style`, kind: 'select',
   cssVar: '--ommr-logical-connection-dash', default: '4 2', options: DASH_OPTIONS},

  // Reading order
  {id: 'readingOrder.symbolColor', group: 'readingOrder', label: $localize`Symbol reading order color`, kind: 'color',
   cssVar: '--ommr-symbol-reading-order-color', default: '#000000'},
  {id: 'readingOrder.symbolWidth', group: 'readingOrder', label: $localize`Symbol reading order width`, kind: 'range',
   cssVar: '--ommr-symbol-reading-order-width', default: 1, min: 0.5, max: 8, step: 0.5},
  {id: 'readingOrder.symbolOpacity', group: 'readingOrder', label: $localize`Symbol reading order opacity`, kind: 'range',
   cssVar: '--ommr-symbol-reading-order-opacity', default: 0.5, min: 0, max: 1, step: 0.05},
  {id: 'readingOrder.symbolDash', group: 'readingOrder', label: $localize`Symbol reading order style`, kind: 'select',
   cssVar: '--ommr-symbol-reading-order-dash', default: '1', options: DASH_OPTIONS},
  {id: 'readingOrder.blockWidth', group: 'readingOrder', label: $localize`Line reading order width`, kind: 'range',
   cssVar: '--ommr-block-reading-order-width', unit: 'px', default: 2, min: 0.5, max: 8, step: 0.5},

  // Text
  {id: 'text.fontSizeFactor', group: 'text', label: $localize`Syllable font size`, kind: 'range',
   default: 1, min: 0.4, max: 3, step: 0.05},
  {id: 'text.fontFamily', group: 'text', label: $localize`Syllable font`, kind: 'select',
   cssVar: '--ommr-annotation-font-family', default: 'inherit', options: [
     {value: 'inherit', label: $localize`Browser default`},
     {value: 'Arial, sans-serif', label: 'Arial'},
     {value: '"Times New Roman", serif', label: 'Times New Roman'},
     {value: 'Georgia, serif', label: 'Georgia'},
     {value: '"Courier New", monospace', label: 'Courier New'},
   ]},
  {id: 'text.color', group: 'text', label: $localize`Syllable color`, kind: 'color',
   cssVar: '--ommr-annotation-color', default: '#f5f5f5'},
  {id: 'text.haloColor', group: 'text', label: $localize`Syllable outline color`, kind: 'color',
   cssVar: '--ommr-annotation-halo-color', default: '#000000'},
  {id: 'text.haloWidth', group: 'text', label: $localize`Syllable outline width`, kind: 'range',
   cssVar: '--ommr-annotation-halo-width', default: 4, min: 0, max: 10, step: 0.5},
  {id: 'text.editorFontSize', group: 'text', label: $localize`Lyrics editor font size`, kind: 'range',
   cssVar: '--ommr-text-editor-font-size', unit: 'px', default: 20, min: 10, max: 40, step: 1},

  // Regions
  {id: 'regions.music', group: 'regions', label: $localize`Music region`, kind: 'color',
   cssVar: '--ommr-region-music-color', default: '#228b22'},
  {id: 'regions.lyrics', group: 'regions', label: $localize`Lyrics region`, kind: 'color',
   cssVar: '--ommr-region-lyrics-color', default: '#8b0000'},
  {id: 'regions.paragraph', group: 'regions', label: $localize`Paragraph region`, kind: 'color',
   cssVar: '--ommr-region-paragraph-color', default: '#ff8c00'},
  {id: 'regions.dropCapital', group: 'regions', label: $localize`Drop capital region`, kind: 'color',
   cssVar: '--ommr-region-drop-capital-color', default: '#800080'},
  {id: 'regions.folioNumber', group: 'regions', label: $localize`Folio number region`, kind: 'color',
   cssVar: '--ommr-region-folio-number-color', default: '#87cefa'},
  {id: 'regions.documentStart', group: 'regions', label: $localize`Document start region`, kind: 'color',
   cssVar: '--ommr-document-start-color', default: '#7fff00'},
  {id: 'regions.documentStartMarker', group: 'regions', label: $localize`Document start marker`, kind: 'color',
   cssVar: '--ommr-document-start-marker-color', default: '#9902ff'},
  {id: 'regions.shadingOpacity', group: 'regions', label: $localize`Region shading opacity`, kind: 'range',
   cssVar: '--ommr-shading-opacity', default: 0.5, min: 0, max: 1, step: 0.05},
  {id: 'regions.boundingBoxOpacity', group: 'regions', label: $localize`Bounding box opacity`, kind: 'range',
   cssVar: '--ommr-aabb-opacity', default: 0.05, min: 0, max: 1, step: 0.05},
];

const BY_ID = new Map<string, AppearanceSettingDef>(APPEARANCE_SETTINGS.map(s => [s.id, s]));

export const APPEARANCE_GROUP_IDS = Object.keys(APPEARANCE_GROUPS) as AppearanceGroupId[];

export function appearanceSetting(id: string): AppearanceSettingDef {
  return BY_ID.get(id);
}

export function appearanceSettingsOfGroup(group: AppearanceGroupId): AppearanceSettingDef[] {
  return APPEARANCE_SETTINGS.filter(s => s.group === group);
}

export function appearanceDefault(id: string): string | number {
  const def = BY_ID.get(id);
  return def ? def.default : undefined;
}

/** The group to expand for an editor tool, or undefined if none matches. */
export function appearanceGroupOfTool(tool: EditorTools): AppearanceGroupId {
  return APPEARANCE_GROUP_IDS.find(g => APPEARANCE_GROUPS[g].tools.indexOf(tool) >= 0);
}

/** The value written as a CSS custom property (numbers may carry a unit). */
export function appearanceCssValue(def: AppearanceSettingDef, value: string | number): string {
  return typeof value === 'number' ? value + (def.unit || '') : String(value);
}
