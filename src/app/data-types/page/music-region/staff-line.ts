import {PolyLine, Rect} from 'src/app/geometry/geometry';
import {Region} from '../region';
import {IdType} from '../id-generator';
import {PageLine} from '../pageLine';

export class StaffLine extends Region {
  static create(
    staff: Region,
    coords = new PolyLine([]),
    highlighted = false,
    blindPrintLine = false,
    space = false,  // denotes if this staff line is space and not an actual line
    id: string = null,
  ) {
    const ml = new StaffLine(id, highlighted, blindPrintLine, space);
    ml.coords = coords;
    ml.attachToParent(staff);
    ml.updateSorting();
    ml._updateAABB();
    return ml;
  }

  static fromJson(json, staffEquiv: Region): StaffLine {
    return StaffLine.create(
      staffEquiv,
      PolyLine.fromString(json.coords),
      json.highlighted || false,
      json.blind_print_line || false,
      json.space || false,
      json.id,
    );
  }

  constructor(
    protected _id = '',
    public highlighted = false,
    public blindPrintLine = false,
    public space = false,
  ) {
    super(IdType.StaffLine);
    if (!this._id || this._id.length === 0) { this.refreshIds(); }
  }


  toJson() {
    return {
      id: this._id,
      coords: this.coords.toString(),
      highlighted: this.highlighted,
      blind_print_line : this.blindPrintLine,
      space: this.space,
    };
  }

  updateSorting() {
    this.coords.sort((a, b) => a.x - b.x);
  }

  getPath() {
    return this.coords.getPath();
  }

  get staff() {
    return this.parent as PageLine;
  }

}
