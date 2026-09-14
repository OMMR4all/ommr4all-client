import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {BookStyle, GlobalSettingsService} from '../../../global-settings.service';
import {ServerUrls} from '../../../server-urls';
import {ApiError, apiErrorFromHttpErrorResponse} from '../../../utils/api-error';
import {descriptorFromDef, SymbolClassDef, SymbolClassDescriptor, SYMBOL_GLYPH_PRESETS} from '../../../data-types/page/symbol-class-registry';
import {AccidentalType, ClefType, NoteType, SymbolType} from '../../../data-types/page/definitions';

export interface SymbolClassDialogData {
  /** The class to edit, or null to create a new one. */
  def: SymbolClassDef;
  /** Notation style a new class starts out with. The editor passes the style of the open book,
   *  because a class of a foreign style would never show up in its tool bar. */
  defaultStyle?: string;
}

/** `glyph_preset` value that switches the form over to the visual glyph editor. */
export const CUSTOM_GLYPH = 'custom';

interface SubTypeOption { value: string; label: string; }

@Component({
    selector: 'app-symbol-class-dialog',
    templateUrl: './symbol-class-dialog.component.html',
    styleUrls: ['./symbol-class-dialog.component.scss'],
    standalone: false
})
export class SymbolClassDialogComponent {
  private http = inject(HttpClient);
  private dialogRef = inject<MatDialogRef<SymbolClassDialogComponent>>(MatDialogRef);
  data = inject<SymbolClassDialogData>(MAT_DIALOG_DATA);
  settings = inject(GlobalSettingsService);

  readonly SymbolType = SymbolType;
  readonly glyphPresets = SYMBOL_GLYPH_PRESETS;
  readonly customGlyph = CUSTOM_GLYPH;

  apiError: ApiError;
  saving = false;

  name: string;
  /** null = available in every notation style */
  style: string;
  baseSymbolType: string;
  baseSubType: string;
  clefOffset: number;
  glyphPreset: string;
  svgPath: string;
  svgPathStroke: number;
  color: string;
  digitShortcut: number;
  hiddenByDefault: boolean;
  order: number;

  // Recomputed on every base-symbol-type change instead of in a getter, so the
  // mat-select options are stable across change detection.
  subTypes: SubTypeOption[] = [];

  private _previewKey: string = null;
  private _previewDescriptor: SymbolClassDescriptor;

  constructor() {
    const def = this.data.def;
    this.name = def ? def.name : '';
    this.style = def ? def.style : (this.data.defaultStyle || null);
    this.baseSymbolType = def ? def.base_symbol_type : SymbolType.Note;
    this.baseSubType = def ? def.base_sub_type : String(NoteType.Normal);
    this.clefOffset = def ? def.clef_offset : null;
    // An edited class that carries a raw path (no preset) opens on the custom branch.
    this.glyphPreset = def ? (def.glyph_preset || CUSTOM_GLYPH) : SYMBOL_GLYPH_PRESETS[0].id;
    this.svgPath = def ? def.svg_path : '';
    this.svgPathStroke = def ? def.svg_path_stroke : null;
    this.color = def ? def.color : '';
    this.digitShortcut = def ? def.digit_shortcut : null;
    this.hiddenByDefault = def ? def.hidden_by_default : false;
    this.order = def ? def.order : 0;
    this.subTypes = this.subTypesOf(this.baseSymbolType);
  }

  get isEdit() { return !!this.data.def; }
  get isClef() { return this.baseSymbolType === SymbolType.Clef; }
  get isNote() { return this.baseSymbolType === SymbolType.Note; }
  get isCustomGlyph() { return this.glyphPreset === CUSTOM_GLYPH; }
  get bookStyles(): BookStyle[] { return this.settings.bookStyles; }
  get valid() { return !!this.name && this.name.trim().length > 0 && !!this.baseSubType; }

  /** Switching to the drawing editor seeds the canvas from the preset that was selected, so a
   *  shipped shape can serve as the template instead of starting from an empty canvas. */
  onGlyphPresetChange(id: string) {
    const previous = this.glyphPreset;
    this.glyphPreset = id;
    if (id === CUSTOM_GLYPH && !this.svgPath) {
      const preset = SYMBOL_GLYPH_PRESETS.find(p => p.id === previous);
      if (preset) {
        this.svgPath = preset.svgPath;
        this.svgPathStroke = preset.svgPathStroke || null;
      }
    }
  }

  onBaseSymbolTypeChange(type: string) {
    this.baseSymbolType = type;
    this.subTypes = this.subTypesOf(type);
    // The old sub type belongs to another enum and would be rejected by the server.
    this.baseSubType = this.subTypes.length > 0 ? this.subTypes[0].value : '';
  }

  private subTypesOf(type: string): SubTypeOption[] {
    if (type === SymbolType.Note) {
      // numeric enum: enumerate the members, the wire value is the number as a string
      return [NoteType.Normal, NoteType.Oriscus, NoteType.Apostropha,
        NoteType.LiquescentFollowingU, NoteType.LiquescentFollowingD]
        .map(t => ({value: String(t), label: NoteType[t]}));
    }
    if (type === SymbolType.Clef) {
      return Object.keys(ClefType).map(k => ({value: ClefType[k], label: k}));
    }
    return Object.keys(AccidentalType).map(k => ({value: AccidentalType[k], label: k}));
  }

  /** Glyph of the current form state, mirroring `descriptorFromDef`. */
  get previewPath(): string {
    if (this.isCustomGlyph) { return this.svgPath || ''; }
    const preset = SYMBOL_GLYPH_PRESETS.find(p => p.id === this.glyphPreset);
    return preset ? preset.svgPath : '';
  }

  get previewStroke(): number {
    if (this.isCustomGlyph) { return this.svgPathStroke || null; }
    const preset = SYMBOL_GLYPH_PRESETS.find(p => p.id === this.glyphPreset);
    return preset && preset.svgPathStroke ? preset.svgPathStroke : null;
  }

  /**
   * The unsaved form state as the descriptor the sheet overlay would render it from, so the
   * preview follows every stroke of the glyph editor. Memoised on the fields that affect the
   * rendering: this runs in change detection, and a fresh object each pass would make the
   * preview rebuild its throwaway symbol (new uuid included) on every tick.
   */
  get previewDescriptor(): SymbolClassDescriptor {
    const def = this.toDef();
    const key = [def.base_symbol_type, def.base_sub_type, def.glyph_preset, def.svg_path,
      def.svg_path_stroke, def.color].join('\u0000');
    if (key !== this._previewKey) {
      this._previewKey = key;
      this._previewDescriptor = descriptorFromDef(def);
    }
    return this._previewDescriptor;
  }

  /** The form state on the wire format of `/api/symbol-classes`. */
  private toDef(): SymbolClassDef {
    const custom = this.isCustomGlyph;
    return {
      // the server derives the id of a new class from its name
      id: this.isEdit ? this.data.def.id : '',
      name: (this.name || '').trim(),
      style: this.style || null,
      base_symbol_type: this.baseSymbolType,
      base_sub_type: this.baseSubType,
      clef_offset: this.isClef ? numberOrNull(this.clefOffset) : null,
      glyph_preset: custom ? '' : this.glyphPreset,
      svg_path: custom ? (this.svgPath || '') : '',
      svg_path_stroke: custom ? numberOrNull(this.svgPathStroke) : null,
      color: this.color || '',
      digit_shortcut: numberOrNull(this.digitShortcut),
      hidden_by_default: !!this.hiddenByDefault,
      order: numberOrNull(this.order) === null ? 0 : Number(this.order),
    };
  }

  save() {
    if (!this.valid || this.saving) { return; }
    const body = this.toDef();

    this.saving = true;
    const request = this.isEdit
      ? this.http.post(ServerUrls.symbolClasses() + '/' + this.data.def.id, body)
      : this.http.put(ServerUrls.symbolClasses(), body);
    request.subscribe(
      () => {
        this.saving = false;
        this.dialogRef.close(true);
      },
      err => {
        this.saving = false;
        this.apiError = apiErrorFromHttpErrorResponse(err);
      }
    );
  }

  close() {
    this.dialogRef.close(false);
  }
}

/** An empty number input yields '' or null; both mean "not set" on the wire. */
function numberOrNull(value: number | string): number {
  if (value === null || value === undefined || value === '') { return null; }
  const n = Number(value);
  return isNaN(n) ? null : n;
}
