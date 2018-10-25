import {Command} from './commands';
import {Point} from '../../geometry/geometry';

export class CommandChangePoint extends Command {
  constructor(
    private point: Point,
    private from: Point,
    private to: Point,
  ) { super(); }

  do() { this.point.copyFrom(this.to); }
  undo() { this.point.copyFrom(this.from); }
}
