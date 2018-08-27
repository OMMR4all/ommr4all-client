import { Point } from '../geometry/geometry';

export enum SymbolType {
  Note,
}

export class Symbol {
  readonly _type: SymbolType;
  position: Point;

  constructor(type: SymbolType, pos = new Point(0, 0)) {
    this._type = type;
    this.position = pos;
  }

  get type() {
    return this._type;
  }

}

export class SymbolList {
  readonly _symbols: Symbol[] = [];

  add(symbol: Symbol) {
    this._symbols.push(symbol);
  }

  get symbols() {
    return this._symbols;
  }
}
