import {PolyLine} from '../../geometry/geometry';
import {CommandChangePolyLine} from '../undo/geometry_commands';
import {Command} from '../undo/commands';

export function sortPolyLineByX(line: PolyLine): Command {
  const init = line.copy();
  line.points.sort((a, b) => a.x - b.x);
  return new CommandChangePolyLine(line, init, line);
}
