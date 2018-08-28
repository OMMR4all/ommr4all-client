import { Point } from '../geometry/geometry';
import { Staff } from './StaffLine';

export enum SymbolType {
  Note,
}

export class Symbol {
  readonly _type: SymbolType;
  private _staff: Staff;
  position: Point;

  constructor(type: SymbolType, staff: Staff, pos = new Point(0, 0)) {
    this._type = type;
    this.position = pos;
    if (this._staff) {
      this._staff.symbolList.remove(this);
    }
    this._staff = staff;
    this._staff.symbolList.add(this);
  }

  get staff() {
    return this._staff;
  }

  get type() {
    return this._type;
  }

}

export class SymbolList {
  readonly _symbols: Symbol[] = [];

  add(symbol: Symbol) {
    if (this._symbols.indexOf(symbol) < 0) {
      this._symbols.push(symbol);
    }
  }

  remove(symbol: Symbol): boolean {
    const idx = this._symbols.indexOf(symbol);
    if (idx < 0 ) {
      return false;
    }
    this._symbols.splice(idx, 1);
    return true;
  }

  get symbols() {
    return this._symbols;
  }
}
