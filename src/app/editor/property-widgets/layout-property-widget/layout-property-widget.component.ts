import {Component, Input, OnInit} from '@angular/core';
import {BlockType} from '../../../data-types/page/definitions';
import {LayoutPropertyWidgetService} from './layout-property-widget.service';
import {PageLine} from '../../../data-types/page/pageLine';
import {ActionsService} from '../../actions/actions.service';
import {ActionType} from '../../actions/action-types';

@Component({
  selector: 'app-layout-property-widget',
  templateUrl: './layout-property-widget.component.html',
  styleUrls: ['./layout-property-widget.component.css']
})
export class LayoutPropertyWidgetComponent implements OnInit {
  readonly Type = BlockType;
  @Input() pageLine: PageLine;

  constructor(
    public service: LayoutPropertyWidgetService,
    private actions: ActionsService,
  ) { }

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

}
