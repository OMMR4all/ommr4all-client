import { Component, OnInit, Input, EventEmitter, Output, AfterViewChecked, AfterViewInit, inject } from '@angular/core';
import {MusicSymbol, Clef, Note, Accidental} from '../../../../data-types/page/music-region/symbol';
import {SymbolType, NoteType, ClefType, AccidentalType} from '../../../../data-types/page/definitions';
import {SymbolClassDescriptor, symbolClassDescriptor} from '../../../../data-types/page/symbol-class-registry';
import {Point} from '../../../../geometry/geometry';
import {SheetOverlayService, SymbolConnection} from '../../sheet-overlay.service';
import {NonScalingComponentType} from '../non-scaling-component/non-scaling.component';

interface Glyph {
  cls: string;
  transform: string;
  d: string;
  /** Optional extra transform applied on the <path> itself (accid glyphs). */
  pathTransform?: string;
}

interface Box { x: number; y: number; w: number; h: number; }

interface ClefGeometry {
  cls: string;
  errorCls: string;
  /** Bounding rect in the normal view, in units of `size`. */
  box: Box;
  /** Slightly enlarged rect drawn around the clef when it has an error type. */
  errorBox: Box;
  /** Vertical marker line in the alternate view, in units of `size`. */
  altLine: { x: number, y1: number, y2: number };
}

const NOTE_GLYPHS = new Map<NoteType, Glyph>([
  [NoteType.Oriscus, {
    cls: 'note oriscus',
    transform: 'scale(0.021) scale(1,-1) translate(-218)',
    d: 'M32 -180c-54 0 -33 186 9 340c5 17 24 18 41 18c-3 -100 -8 -165 30 -165c43 0 238 168 292 168s33 -186 -9 -340c-4 -17 -24 -18 -40 -18c3 100 7 165 -30 165c-44 0 -239 -168 -293 -168z',
  }],
  [NoteType.Apostropha, {
    cls: 'note apostropha',
    transform: 'scale(0.021) scale(1,-1) translate(-129)',
    d: 'M122 108c25 0 136 -78 136 -105c0 -42 -156 -237 -202 -270c-18 -12 -48 -9 -39 7c18 32 88 149 88 174c0 26 -105 69 -105 86c0 24 93 108 122 108z',
  }],
  [NoteType.LiquescentFollowingU, {
    cls: 'note liquescent up',
    transform: 'scale(0.021) scale(1,-1) translate(-189)',
    d: 'M152 -174c-80 0 -152 54 -152 143c0 99 108 204 224 204c58 0 97 -26 117 -53l1 2c-1 12 -3 28 -4 66l-6 228c0 18 22 25 46 19v-402c0 -118 -114 -207 -226 -207z',
  }],
  [NoteType.LiquescentFollowingD, {
    cls: 'note liquescent down',
    transform: 'scale(0.021) scale(1,-1) translate(-189)',
    d: 'M378 34v-9v-440c0 -16 -16 -22 -42 -21c4 99 9 235 10 367c-41 -63 -118 -104 -194 -104c-80 0 -152 54 -152 143c0 99 108 204 224 204c102 0 154 -68 154 -140z',
  }],
]);

const ACCID_GLYPHS = new Map<AccidentalType, Glyph>([
  [AccidentalType.Flat, {
    cls: 'flat',
    transform: 'translate(-2,-11)',
    pathTransform: 'translate(-94.947,-433.75)',
    d: 'M 98.166,443.657 C 98.166,444.232 97.950425,444.78273 97.359,445.52188 C 96.732435,446.30494 96.205,446.75313 95.51,447.28013 L 95.51,443.848 C 95.668,443.449 95.901,443.126 96.21,442.878 C 96.518,442.631 96.83,442.507 97.146,442.507 C 97.668,442.507 97.999,442.803 98.142,443.393 C 98.158,443.441 98.166,443.529 98.166,443.657 z M 98.091,441.257 C 97.66,441.257 97.222,441.376 96.776,441.615 C 96.33,441.853 95.908,442.172 95.51,442.569 L 95.51,435.29733 L 94.947,435.29733 L 94.947,447.75213 C 94.947,448.10413 95.043,448.28013 95.235,448.28013 C 95.346,448.28013 95.483913,448.18713 95.69,448.06413 C 96.27334,447.71598 96.636935,447.48332 97.032,447.23788 C 97.482617,446.95792 97.99,446.631 98.661,445.991 C 99.124,445.526 99.459,445.057 99.667,444.585 C 99.874,444.112 99.978,443.644 99.978,443.179 C 99.978,442.491 99.795,442.002 99.429,441.713 C 99.015,441.409 98.568,441.257 98.091,441.257 z ',
  }],
  [AccidentalType.Sharp, {
    cls: 'sharp',
    transform: 'translate(-3,-9)',
    pathTransform: 'translate(-84.19600,-436.0680)',
    d: 'M 86.102000,447.45700 L 86.102000,442.75300 L 88.102000,442.20100 L 88.102000,446.88100 L 86.102000,447.45700 z M 90.040000,446.31900 L 88.665000,446.71300 L 88.665000,442.03300 L 90.040000,441.64900 L 90.040000,439.70500 L 88.665000,440.08900 L 88.665000,435.30723 L 88.102000,435.30723 L 88.102000,440.23400 L 86.102000,440.80900 L 86.102000,436.15923 L 85.571000,436.15923 L 85.571000,440.98600 L 84.196000,441.37100 L 84.196000,443.31900 L 85.571000,442.93500 L 85.571000,447.60600 L 84.196000,447.98900 L 84.196000,449.92900 L 85.571000,449.54500 L 85.571000,454.29977 L 86.102000,454.29977 L 86.102000,449.37500 L 88.102000,448.82500 L 88.102000,453.45077 L 88.665000,453.45077 L 88.665000,448.65100 L 90.040000,448.26600 L 90.040000,446.31900 z ',
  }],
  [AccidentalType.Natural, {
    cls: 'natural',
    transform: 'translate(-2.5,-9)',
    d: 'M 0,0 L 0,13 L 5,11 L 5,20 L 5,5 L 0,7',
  }],
]);

const CLEF_GEOMS = new Map<ClefType, ClefGeometry>([
  [ClefType.Clef_F, {
    cls: 'f_clef clef',
    errorCls: 'f_clef clef',
    box: {x: -0.9, y: -0.8, w: 1.3, h: 1.5},
    errorBox: {x: -0.99, y: -0.88, w: 1.43, h: 1.65},
    altLine: {x: -0.5, y1: -0.8, y2: 2.0},
  }],
  [ClefType.Clef_C, {
    cls: 'c_clef clef',
    errorCls: 'c_clef clef strokeOffset',
    box: {x: -0.3, y: -0.8, w: 0.6, h: 1.6},
    errorBox: {x: -0.34285714285, y: -0.91428571428, w: 0.68571428571, h: 1.82857142858},
    altLine: {x: -0.3, y1: -0.2, y2: 0.2},
  }],
]);

@Component({
    selector: 'g[app-symbol]',    templateUrl: './symbol.component.html',
    styleUrls: ['./symbol.component.css'],
    standalone: false
})
export class SymbolComponent {
  private sheetOverlay = inject(SheetOverlayService);

  @Input() symbol: MusicSymbol;
  @Input() selected: boolean;
  @Input() selectable: boolean;
  @Input() set size(s) { this._size = s; }
  @Input() connectionTo: SymbolConnection = new SymbolConnection();
  @Input() showCenterOnly: boolean;
  @Input() showAlternateSymbolView: boolean;
  @Input() showConfidence: boolean;
  @Input() debugSymbol: boolean;
  @Output() connectionMouseDown = new EventEmitter<{event: MouseEvent, symbol: MusicSymbol}>();
  @Output() connectionMouseUp = new EventEmitter<{event: MouseEvent, symbol: MusicSymbol}>();
  @Output() connectionMouseMove = new EventEmitter<{event: MouseEvent, symbol: MusicSymbol}>();

  SymbolType = SymbolType;
  NonScalingType = NonScalingComponentType;

  private _size = 0;
  private _colorSymbolErrorTypeMapping = {
    0 : '#0a37ef',
    1: 'green',
    2: '#ff073a'
  };


  get size() {
    if (this._size === 0) {
      if (!this.symbol.staff) {
        console.error('MusicSymbol without staff or height definition');
      }
      return this.symbol.staff.avgStaffLineDistance;
    }
    return this._size;
  }

  get symbolColor() {
    if (this.showConfidence) {
      if (this.symbol.symbolConfidence != null ) {
        if (this.symbol.symbolConfidence.symbolErrorType != null) {
          //console.log(this.symbol.symbolConfidence.symbolErrorType);
          return this._colorSymbolErrorTypeMapping[this.symbol.symbolConfidence.symbolErrorType];
        }
      }
    }
    return 'yellow';
  }
  get hasErrorType() {
    if (this.showConfidence) {
      if (this.symbol.symbolConfidence != null ) {
        if (this.symbol.symbolConfidence.symbolErrorType != null) {
          return true;
        }
      }
    }
    return false;
  }

  get colorOfSymbol() {
    if (this.symbol.isOnStaffLine) {
      return 'yellow';
    } else {
      return '#1cff03';
    }
  }
  get symbolConfidence() {
    if (this.symbol.symbolConfidence.symbolSequenceConfidence != null) {
      if (this.symbol.symbolConfidence.symbolSequenceConfidence.confidence != null) {
        const conf = this.symbol.symbolConfidence.symbolSequenceConfidence.confidence;
        if (conf < 0.02) {
          return 1;
        }
      }
      //return this.symbol.symbolConfidence.symbolSequenceConfidence.confidence;
    }
    return 0;
  }

  /** The debug-symbol filter of the normal view does not apply to the alternate view. */
  get visible() {
    return this.showAlternateSymbolView || !this.symbol.debugSymbol || this.showConfidence;
  }

  get noteGlyph(): Glyph { return NOTE_GLYPHS.get(this.asNote().type); }
  get accidGlyph(): Glyph { return ACCID_GLYPHS.get(this.asAccid().type); }
  get clefGeom(): ClefGeometry { return CLEF_GEOMS.get(this.asClef().type); }

  /** Stroke of shaped note glyphs (oriscus, apostropha, liquescents). */
  get noteStroke() { return this.showAlternateSymbolView ? null : this.colorOfSymbol; }

  /** Stroke of box-shaped symbols (default note, clefs). */
  get boxStroke() {
    if (this.showAlternateSymbolView) {
      return this.showConfidence ? this.symbolColor : null;
    }
    return this.colorOfSymbol;
  }

  get accidStroke() { return this.showAlternateSymbolView ? 'yellow' : this.colorOfSymbol; }

  // Symbol classes declared in the symbol-class-registry without a dedicated
  // rendering branch in the template are drawn from their descriptor's svgPath.
  get genericGlyph(): SymbolClassDescriptor {
    const d = symbolClassDescriptor(this.symbol.symbol, this.symbol.subType);
    return d && !d.builtinRendering && d.svgPath ? d : undefined;
  }

  get genericGlyphTransform(): string {
    // the 100x100 viewBox of the glyph spans two staff-line distances,
    // centered on the symbol coordinate
    const s = 2 * this.size / 100;
    return 'translate(' + (-50 * s) + ',' + (-50 * s) + ') scale(' + s + ')';
  }

  asNote() { return this.symbol as Note; }
  asClef() { return this.symbol as Clef; }
  asAccid() { return this.symbol as Accidental; }
  astest() { return true; }

  s(v: number) { return this.sheetOverlay.scaleIndependentSize(v); }

}
