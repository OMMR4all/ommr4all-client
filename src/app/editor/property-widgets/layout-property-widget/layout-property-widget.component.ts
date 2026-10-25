import { Component, Input, OnInit, inject } from '@angular/core';
import {BlockType, LineStartType} from '../../../data-types/page/definitions';
import {LayoutPropertyWidgetService} from './layout-property-widget.service';
import {PageLine} from '../../../data-types/page/pageLine';
import {ActionsService} from '../../actions/actions.service';
import {ActionType} from '../../actions/action-types';

@Component({
    selector: 'app-layout-property-widget',
    templateUrl: './layout-property-widget.component.html',
    styleUrls: ['./layout-property-widget.component.css'],
    standalone: false
})
export class LayoutPropertyWidgetComponent implements OnInit {
  service = inject(LayoutPropertyWidgetService);
  private actions = inject(ActionsService);

  readonly Type = BlockType;
  readonly StartType = LineStartType;
  @Input() pageLine: PageLine;

  ngOnInit() {
  }

  get reconstructed() {
    return this.pageLine.reconstructed;
  }

  set reconstructed(b: boolean) {
    this.actions.startAction(ActionType.StaffLinesHighlight, [this.pageLine]);
    this.actions.changeProperty(this.pageLine, 'reconstructed', this.pageLine.reconstructed, b);
    this.actions.finishAction();
  }

  get startType() {
    return this.pageLine.startType;
  }
  set startType(t: LineStartType) {
    this.actions.startAction(ActionType.LyricDocumentStart, [this.pageLine]);
    this.actions.changeProperty(this.pageLine, 'startType', this.pageLine.startType, t);

    this.actions.finishAction();
  }
}
