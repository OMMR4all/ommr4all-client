import { Component, Input, OnInit, inject } from '@angular/core';
import {BlockType} from '../../../data-types/page/definitions';
import {LayoutPropertyWidgetService} from './layout-property-widget.service';
import {PageLine} from '../../../data-types/page/pageLine';
import {ActionsService} from '../../actions/actions.service';
import {ActionType} from '../../actions/action-types';
import {BookDocumentsService} from "../../../book-documents.service";

@Component({
    selector: 'app-layout-property-widget',
    templateUrl: './layout-property-widget.component.html',
    styleUrls: ['./layout-property-widget.component.css'],
    standalone: false
})
export class LayoutPropertyWidgetComponent implements OnInit {
  service = inject(LayoutPropertyWidgetService);
  private actions = inject(ActionsService);
  documentService = inject(BookDocumentsService);

  readonly Type = BlockType;
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

  get documentstart() {
    return this.pageLine.getDocumentStart;
  }
  set documentstart(b: boolean) {
    this.actions.startAction(ActionType.LyricDocumentStart, [this.pageLine]);
    this.actions.changeProperty(this.pageLine, 'documentStart', this.pageLine.getDocumentStart, b);

    this.actions.finishAction();
  }
}
