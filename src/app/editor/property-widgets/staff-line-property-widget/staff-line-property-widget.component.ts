import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {StaffLine} from '../../../data-types/page/music-region/staff-line';
import {ActionsService} from '../../actions/actions.service';
import {ActionType} from '../../actions/action-types';

@Component({
  selector: 'app-staff-line-property-widget',
  templateUrl: './staff-line-property-widget.component.html',
  styleUrls: ['./staff-line-property-widget.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffLinePropertyWidgetComponent implements OnInit {
  @Input() staffLine: StaffLine;

  constructor(
    private actions: ActionsService,
  ) { }

  ngOnInit() {
  }

  get highlighted() {
    return this.staffLine.highlighted;
  }

  set highlighted(h: boolean) {
    this.actions.startAction(ActionType.StaffLinesHighlight, [this.staffLine]);
    this.actions.changeStaffLineHighlight(this.staffLine, h);
    this.actions.finishAction();
  }

  get space() {
    return this.staffLine.space;
  }

  set space(b: boolean) {
    this.actions.startAction(ActionType.StaffLinesHighlight, [this.staffLine]);
    this.actions.changeStaffLineSpace(this.staffLine, b);
    this.actions.finishAction();
  }
}
