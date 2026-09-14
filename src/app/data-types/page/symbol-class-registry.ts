import {AccidentalType, ClefType, NoteType, SymbolType} from './definitions';

/**
 * Registry of the built-in annotatable symbol classes.
 *
 * The built-ins below plus the classes an administrator registered at runtime
 * (see `SymbolClassService`, backed by `/api/symbol-classes`) drive the symbol
 * buttons of the editor tool bar, the digit shortcuts of the symbol editor, and
 * the generic glyph rendering of the sheet overlay.
 *
 * Classes without a hand-crafted rendering branch in `symbol.component.html`
 * must provide `svgPath`. The path is authored in a 100x100 viewBox with the
 * visual center at (50,50); the overlay scales it such that the full viewBox
 * height corresponds to two staff-line distances. The same path is used for
 * the tool-bar button.
 */
export interface SymbolClassDescriptor {
  /** Stable identifier, also used by the tool-bar customization. */
  id: string;
  symbolType: SymbolType;
  subType: NoteType | ClefType | AccidentalType;
  /** Tooltip / menu label. */
  label: string;
  /** Name of a material svgIcon registered in app.component.ts (assets/icons/<name>.svg). */
  svgIcon?: string;
  /** Glyph path in a 100x100 viewBox, center (50,50). Required if the symbol
   *  has no hand-crafted branch in symbol.component.html. */
  svgPath?: string;
  /** Stroke width in viewBox units. If unset or 0 the path is filled instead. */
  svgPathStroke?: number;
  /** True if symbol.component.html has a dedicated rendering branch. */
  builtinRendering?: boolean;
  /** Digit key (1-9) that selects/converts to this class in the symbol editor. */
  digitShortcut?: number;
  /** Start in the section's overflow menu instead of the tool bar (until the
   *  user customizes the section). Recommended for niche classes. */
  hiddenByDefault?: boolean;
  /** `SymbolClass.id` of a runtime-registered class; unset for a built-in. */
  classId?: string;
  /** CSS colour override. Unset follows the user's appearance colour. */
  color?: string;
}

export const SYMBOL_CLASS_REGISTRY: SymbolClassDescriptor[] = [
  {
    id: 'symbols.note',
    digitShortcut: 1,
    symbolType: SymbolType.Note,
    subType: NoteType.Normal,
    label: $localize`Insert single notes`,
    svgIcon: 'notes',
    builtinRendering: true,
  },
  {
    id: 'symbols.clefC',
    digitShortcut: 2,
    symbolType: SymbolType.Clef,
    subType: ClefType.Clef_C,
    label: $localize`Insert a C clef`,
    svgIcon: 'clef_c',
    builtinRendering: true,
  },
  {
    id: 'symbols.clefF',
    digitShortcut: 3,
    symbolType: SymbolType.Clef,
    subType: ClefType.Clef_F,
    label: $localize`Insert an F clef`,
    svgIcon: 'clef_f',
    builtinRendering: true,
  },
  {
    id: 'symbols.clefG',
    digitShortcut: 7,
    symbolType: SymbolType.Clef,
    subType: ClefType.Clef_G,
    label: $localize`Insert a G clef`,
    svgPath: 'M 85 32 A 38 38 0 1 0 85 68 L 85 50 L 62 50',
    svgPathStroke: 10,
    hiddenByDefault: true,
  },
  {
    id: 'symbols.accidFlat',
    digitShortcut: 4,
    symbolType: SymbolType.Accid,
    subType: AccidentalType.Flat,
    label: $localize`Insert a flat accidental`,
    svgIcon: 'accid_flat',
    builtinRendering: true,
  },
  {
    id: 'symbols.accidSharp',
    digitShortcut: 5,
    symbolType: SymbolType.Accid,
    subType: AccidentalType.Sharp,
    label: $localize`Insert a sharp accidental`,
    svgIcon: 'accid_sharp',
    builtinRendering: true,
  },
  {
    id: 'symbols.accidNatural',
    digitShortcut: 6,
    symbolType: SymbolType.Accid,
    subType: AccidentalType.Natural,
    label: $localize`Insert a natural accidental`,
    svgIcon: 'accid_natural',
    builtinRendering: true,
  },
];

/** A symbol class registered at runtime, as returned by `/api/symbol-classes`. */
export interface SymbolClassDef {
  id: string;
  name: string;
  style: string | null;
  base_symbol_type: string;
  base_sub_type: string;
  clef_offset: number | null;
  glyph_preset: string;
  svg_path: string;
  svg_path_stroke: number | null;
  color: string;
  digit_shortcut: number | null;
  hidden_by_default: boolean;
  order: number;
}

export interface GlyphPreset { id: string; label: string; svgPath: string; svgPathStroke?: number; }

/** Shipped glyph shapes, authored in a 100x100 viewBox centred on (50,50). */
export const SYMBOL_GLYPH_PRESETS: GlyphPreset[] = [
  {id: 'circle',  label: $localize`Filled circle`, svgPath: 'M 50 20 A 30 30 0 1 0 50 80 A 30 30 0 1 0 50 20'},
  {id: 'ring',    label: $localize`Circle outline`, svgPath: 'M 50 20 A 30 30 0 1 0 50 80 A 30 30 0 1 0 50 20', svgPathStroke: 10},
  {id: 'diamond', label: $localize`Diamond`, svgPath: 'M 50 15 L 85 50 L 50 85 L 15 50 Z'},
  {id: 'square',  label: $localize`Square`, svgPath: 'M 20 20 H 80 V 80 H 20 Z'},
  {id: 'cross',   label: $localize`Cross`, svgPath: 'M 20 20 L 80 80 M 80 20 L 20 80', svgPathStroke: 12},
  {id: 'hook',    label: $localize`Hook`, svgPath: 'M 25 80 L 25 30 A 25 25 0 0 1 75 30 L 75 55', svgPathStroke: 12},
  {id: 'bar',     label: $localize`Vertical bar`, svgPath: 'M 50 10 V 90', svgPathStroke: 12},
];

/** Stable map key of a rendered symbol. */
export function symbolClassKey(symbolType: SymbolType, subType: NoteType | ClefType | AccidentalType,
                               symbolClass: string = null): string {
  return symbolClass ? 'c:' + symbolClass : symbolType + ':' + subType;
}

/** The tool-bar customization namespace requires the `symbols.` prefix. */
export function descriptorFromDef(def: SymbolClassDef): SymbolClassDescriptor {
  const preset = def.glyph_preset ? SYMBOL_GLYPH_PRESETS.find(p => p.id === def.glyph_preset) : undefined;
  const subType = def.base_symbol_type === SymbolType.Note
    ? Number(def.base_sub_type) as NoteType
    : def.base_sub_type as ClefType | AccidentalType;
  return {
    id: 'symbols.' + def.id,
    classId: def.id,
    symbolType: def.base_symbol_type as SymbolType,
    subType,
    label: def.name,
    svgPath: preset ? preset.svgPath : (def.svg_path || undefined),
    svgPathStroke: preset ? preset.svgPathStroke : (def.svg_path_stroke || undefined),
    color: def.color || undefined,
    digitShortcut: def.digit_shortcut === null ? undefined : def.digit_shortcut,
    hiddenByDefault: def.hidden_by_default,
  };
}
