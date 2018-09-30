import { Point } from '../geometry/geometry';
import { Staff } from './StaffLine';
import {assertNumber} from '../../../node_modules/@angular/core/src/render3/assert';

export enum SymbolType {
  Note,
  C_Clef,
  F_Clef,
}

export class Symbol {
  readonly _type: SymbolType;
  private _staff: Staff;
  position: Point;
  graphicalConnected = true;

  static fromJSON(symbol, staff) {
    return new Symbol(
      symbol.type,
      staff,
      Point.fromJSON(symbol.position),
      symbol.graphicalConnected ? symbol.graphicalConnected : false,
    );
  }

  toJSON() {
    return {
      type: this._type,
      position: this.position,
      graphicalConnected: this.graphicalConnected
    };
  }

  constructor(type: SymbolType, staff: Staff, pos = new Point(0, 0), graphicalConnected = false) {
    this._type = type;
    this.position = pos;
    this.staff = staff;
    this.graphicalConnected = graphicalConnected;
  }

  clone(staff: Staff = null): Symbol {
    const s = new Symbol(this._type, staff, this.position);
    return s;
  }

  remove(): void {
    this.staff = null;
  }

  get staff() {
    return this._staff;
  }

  set staff(staff: Staff) {
    if (this._staff !== staff) {
      if (this._staff) {
        this._staff.removeSymbol(this);
      }
      this._staff = staff;
      if (this._staff) {
        this._staff.addSymbol(this);
      }
    }
  }

  get type() {
    return this._type;
  }

}

export class SymbolList {
  private _symbols: Symbol[] = [];
  readonly _staff: Staff;

  fromJSON(symbolList) {
    this._symbols.splice(0, this._symbols.length);
    if (symbolList) {
      for (const symbol of symbolList.symbols) {
        this.add(Symbol.fromJSON(symbol, this._staff));
      }
    }
  }

  toJSON() {
    return {symbols: this._symbols.map(function (symbol) {
      return symbol.toJSON();
    })};
  }

  constructor(staff: Staff) {
    this._staff = staff;
  }

  add(symbol: Symbol) {
    if (this._symbols.indexOf(symbol) < 0) {
      this._symbols.push(symbol);
      symbol.staff = this._staff;
      this.sort();
    }
  }

  sort() {
    this._symbols = this._symbols.sort((a, b) => a.position.x - b.position.x);
  }

  remove(symbol: Symbol): boolean {
    const idx = this._symbols.indexOf(symbol);
    if (idx < 0 ) {
      return false;
    }
    this._symbols.splice(idx, 1);
    return true;
  }

  filter(type: SymbolType): Symbol[] {
    return this._symbols.filter(function(symbol: Symbol): boolean {
      return symbol.type === type;
    });
  }

  get symbols() {
    return this._symbols;
  }

  closestToX(x: number, type: SymbolType, leftOnly = false): Symbol {
    let bestD = 1000000;
    let bestS = null;
    if (leftOnly) {
      this._symbols.forEach(symbol => {
        if (type === symbol.type && x - symbol.position.x < bestD && x > symbol.position.x) {
          bestD = Math.abs(x - symbol.position.x);
          bestS = symbol;
        }
      });
    } else {
      this._symbols.forEach(symbol => {
        if (type === symbol.type && Math.abs(x - symbol.position.x) < bestD) {
          bestD = Math.abs(x - symbol.position.x);
          bestS = symbol;
        }
      });
    }
    return bestS;
  }
}
