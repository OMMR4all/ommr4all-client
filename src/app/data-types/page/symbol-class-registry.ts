import {AccidentalType, ClefType, NoteType, SymbolType} from './definitions';

/**
 * Declarative registry of all annotatable symbol classes.
 *
 * The registry drives the symbol buttons of the editor tool bar, the digit
 * shortcuts of the symbol editor, and the generic glyph rendering of the
 * sheet overlay. To add a new symbol class to the editor:
 *
 *   1. If it is a new subtype, add its enum value in `definitions.ts` and the
 *      corresponding enum value on the server in
 *      `database/file_formats/pcgts/page/musicsymbol.py` (clefs additionally
 *      need their pitch offset there).
 *   2. Add a descriptor entry to `SYMBOL_CLASS_REGISTRY` below.
 *
 * Classes without a hand-crafted rendering branch in `symbol.component.html`
 * must provide `svgPath`. The path is authored in a 100x100 viewBox with the
 * visual center at (50,50); the overlay scales it such that the full viewBox
 * height corresponds to two staff-line distances. The same path is used for
 * the tool-bar button.
 *
 * See doc/adding_symbol_classes.md in the deploy repository for the full guide.
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

export function symbolClassDescriptor(symbolType: SymbolType, subType: NoteType | ClefType | AccidentalType): SymbolClassDescriptor {
  return SYMBOL_CLASS_REGISTRY.find(d => d.symbolType === symbolType && d.subType === subType);
}
