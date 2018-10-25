import {Command} from './commands';
import {Point, PolyLine} from '../../geometry/geometry';

export class CommandChangePoint extends Command {
  constructor(
    private point: Point,
    private from: Point,
    private to: Point,
  ) { super(); }

  do() { this.point.copyFrom(this.to); }
  undo() { this.point.copyFrom(this.from); }
  isIdendity() { return this.to.equals(this.from); }
}

export class CommandChangePolyLine extends Command {
  constructor(
    private polyLine: PolyLine,
    private from: PolyLine,
    private to: PolyLine,
  ) {
    super();
    this.from = new PolyLine(from.points);
    this.to = new PolyLine(to.points);
  }

  do() { this.polyLine.moveRef(this.to); }
  undo() { this.polyLine.moveRef(this.from); }
  isIdendity() { return this.to.equals(this.from); }
}
