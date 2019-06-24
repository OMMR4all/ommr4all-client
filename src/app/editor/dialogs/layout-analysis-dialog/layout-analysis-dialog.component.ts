import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {TaskWorker} from '../../task';
import {ActionsService} from '../../actions/actions.service';
import {PageState} from '../../editor.service';
import {Subscription} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {ActionType} from '../../actions/action-types';
import {PolyLine} from '../../../geometry/geometry';
import {objIntoEnumMap} from '../../../utils/converting';
import {BlockType} from '../../../data-types/page/definitions';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

export interface LayoutAnalysisDialogData {
  pageState: PageState;
  onClosed: any;
}

@Component({
  selector: 'app-layout-analysis-dialog',
  templateUrl: './layout-analysis-dialog.component.html',
  styleUrls: ['./layout-analysis-dialog.component.css']
})
export class LayoutAnalysisDialogComponent  implements OnInit, OnDestroy {
  private readonly _subscriptions = new Subscription();
  task: TaskWorker;

  constructor(
    private http: HttpClient,
    private actions: ActionsService,
    private dialogRef: MatDialogRef<LayoutAnalysisDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LayoutAnalysisDialogData,
  ) {
    this.task = new TaskWorker('layout', this.http, this.data.pageState.pageCom);
  }

  ngOnInit() {
    this._subscriptions.add(this.task.taskFinished.subscribe(res => this.onTaskFinished(res)));
    this._subscriptions.add(this.task.taskNotFound.subscribe(res => this.close()));
    this._subscriptions.add(this.task.taskAlreadyStarted.subscribe(res => this.close()));
    this.task.putTask();
  }

  ngOnDestroy(): void {
    this.task.stopStatusPoller();
    this._subscriptions.unsubscribe();
  }

  cancel() {
    this.task.cancelTask().then(() => this.close());
  }

  private close() {
    if (this.data.onClosed) { this.data.onClosed(); }
    this.dialogRef.close();
  }

  private onTaskFinished(res: {blocks: any}) {
    if (!res.blocks) {
      console.error('No blocks transmitted.');
    } else {
      this.actions.startAction(ActionType.LayoutAutomatic);
      objIntoEnumMap<BlockType, Array<{id: string, coords: string}>>(res.blocks, new Map(), BlockType, false).
      forEach((trs, type) => {
          trs.forEach(block => {
            if (type === BlockType.Music) {
              let targetMr = this.data.pageState.pcgts.page.musicLineById(block.id);
              if (!targetMr) {
                const newMr = this.actions.addNewBlock(this.data.pageState.pcgts.page, BlockType.Music);
                targetMr = this.actions.addNewLine(newMr);
              }
              this.actions.changePolyLine(targetMr.coords, targetMr.coords, PolyLine.fromString(block.coords));
              this.actions.caller.pushChangedViewElement(targetMr);
            } else {
              const newTr = this.actions.addNewBlock(this.data.pageState.pcgts.page, type);
              const newTl = this.actions.addNewLine(newTr);
              this.actions.changePolyLine(newTl.coords, newTl.coords, PolyLine.fromString(block.coords));
            }
          });
      });
      this.actions.finishAction();
    }
    this.close();
  }

}
