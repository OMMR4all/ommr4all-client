import {Component, ComponentRef, OnInit} from '@angular/core';
import {IModalDialog, IModalDialogButton, IModalDialogOptions} from 'ngx-modal-dialog';
import {TaskWorker} from '../../task';
import {ActionsService} from '../../actions/actions.service';
import {PageState} from '../../editor.service';
import {Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {ActionType} from '../../actions/action-types';
import {PolyLine} from '../../../geometry/geometry';
import {objIntoEnumMap} from '../../../utils/converting';
import {BlockType} from '../../../data-types/page/definitions';

@Component({
  selector: 'app-layout-analysis-dialog',
  templateUrl: './layout-analysis-dialog.component.html',
  styleUrls: ['./layout-analysis-dialog.component.css']
})
export class LayoutAnalysisDialogComponent  implements OnInit, IModalDialog {
  task: TaskWorker;

  actionButtons: IModalDialogButton[];
  private closingSubject: Subject<void>;
  private pageState: PageState;
  private onClosed;
  constructor(
    private http: HttpClient,
    private actions: ActionsService,
  ) {
    this.actionButtons = [
      { text: 'Cancel', buttonClass: 'btn btn-danger', onAction: () => this.task.cancelTask()} ,
    ];
  }

  ngOnInit() {
    this.task.putTask();
  }

  private close() {
    this.closingSubject.next();
    if (this.onClosed) { this.onClosed(); }
  }

  dialogInit(reference: ComponentRef<IModalDialog>, options: Partial<IModalDialogOptions<any>>) {
    this.closingSubject = options.closeDialogSubject;
    this.pageState = options.data.pageState;
    this.onClosed = options.data.onClosed;
    this.task = new TaskWorker('layout', this.http, this.pageState);
    this.task.taskFinished.subscribe(res => this.onTaskFinished(res));
  }

  private onTaskFinished(res: {textRegions: any, musicRegions: Array<{id: string, coords: string}> }) {
    if (!res.textRegions || !res.musicRegions) {
      console.error('No symbols transmitted.');
    } else {
      this.actions.startAction(ActionType.LayoutAutomatic);
      res.musicRegions.forEach(mr => {
        let targetMr = this.pageState.pcgts.page.musicLineById(mr.id);
        if (!targetMr) {
          const newMr = this.actions.addNewBlock(this.pageState.pcgts.page, BlockType.Music);
          targetMr = this.actions.addNewLine(newMr);
        }
        this.actions.changePolyLine(targetMr.coords, targetMr.coords, PolyLine.fromString(mr.coords));
        this.actions.caller.pushChangedViewElement(targetMr);
      });
      objIntoEnumMap<BlockType, Array<{id: string, coords: string}>>(res.textRegions, new Map(), BlockType, false).
      forEach((trs, type) => {
        trs.forEach(tr => {
          const newTr = this.actions.addNewBlock(this.pageState.pcgts.page, type);
          const newTl = this.actions.addNewLine(newTr);
          this.actions.changePolyLine(newTl.coords, newTl.coords, PolyLine.fromString(tr.coords));
        });
      });
      this.actions.finishAction();
    }
    this.close();
  }

}
