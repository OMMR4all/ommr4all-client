import {PageLine} from '../../data-types/page/pageLine';
import {Block} from '../../data-types/page/block';
import {StaffLine} from '../../data-types/page/music-region/staff-line';
import {Accidental, Clef, Note, Symbol} from '../../data-types/page/music-region/symbol';
import {Page} from '../../data-types/page/page';
import {Region} from '../../data-types/page/region';
import {Syllable} from '../../data-types/page/syllable';

export class ChangedView {
  constructor(
    public readonly checkChangesBlock = new Set<Block>(),
    public readonly checkChangesLine = new Set<PageLine>(),
    public readonly checkChangesStaffLine = new Set<StaffLine>(),
    public readonly checkChangesSymbol = new Set<Symbol>(),
    public readonly checkChangesSyllables = new Set<Syllable>(),
    public readonly updateRequired = new Set<Region>(),
  ) {}

  add(c: RequestChangedViewElement) {
    if (c instanceof Region) { this.updateRequired.add(c); }

    if (c instanceof Symbol) {
      if (c.staff) {
        this.checkChangesBlock.add(c.staff.getBlock());
        this.checkChangesLine.add(c.staff);
        this.checkChangesSymbol.add(c);
        this.updateRequired.add(c.staff);
      } else {
        console.warn('Symbol without parent in view');
      }
    } else if (c instanceof StaffLine) {
      this.checkChangesBlock.add(c.staff.getBlock());
      this.checkChangesLine.add(c.staff);
      this.checkChangesStaffLine.add(c);
    } else if (c instanceof PageLine) {
      this.checkChangesBlock.add(c.getBlock());
      this.checkChangesLine.add(c);
    } else if (c instanceof Block) {
      this.checkChangesBlock.add(c as Block);
    } else if (c instanceof Syllable) {
      this.checkChangesSyllables.add(c as Syllable);
    }
  }
}

export type RequestChangedViewElement = Region|Symbol|StaffLine|Syllable;
export type RequestChangedViewElements = Array<RequestChangedViewElement>;
