import {Component, ComponentRef, Inject, OnDestroy, OnInit} from '@angular/core';
import {TaskProgressCodes, TaskWorker} from '../../task';
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
    this.task = new TaskWorker('layout', this.http, this.data.pageState);
  }

  ngOnInit() {
    this._subscriptions.add(this.task.taskFinished.subscribe(res => this.onTaskFinished(res)));
    this.task.putTask();
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
    this.cancel();
  }

  cancel() {
    this.task.cancelTask().then(() => this.close());
  }

  private close() {
    if (this.data.onClosed) { this.data.onClosed(); }
    this.dialogRef.close();
  }

  private onTaskFinished(res: {textRegions: any, musicRegions: Array<{id: string, coords: string}> }) {
    if (!res.textRegions || !res.musicRegions) {
      console.error('No symbols transmitted.');
    } else {
      this.actions.startAction(ActionType.LayoutAutomatic);
      res.musicRegions.forEach(mr => {
        let targetMr = this.data.pageState.pcgts.page.musicLineById(mr.id);
        if (!targetMr) {
          const newMr = this.actions.addNewBlock(this.data.pageState.pcgts.page, BlockType.Music);
          targetMr = this.actions.addNewLine(newMr);
        }
        this.actions.changePolyLine(targetMr.coords, targetMr.coords, PolyLine.fromString(mr.coords));
        this.actions.caller.pushChangedViewElement(targetMr);
      });
      objIntoEnumMap<BlockType, Array<{id: string, coords: string}>>(res.textRegions, new Map(), BlockType, false).
      forEach((trs, type) => {
        trs.forEach(tr => {
          const newTr = this.actions.addNewBlock(this.data.pageState.pcgts.page, type);
          const newTl = this.actions.addNewLine(newTr);
          this.actions.changePolyLine(newTl.coords, newTl.coords, PolyLine.fromString(tr.coords));
        });
      });
      this.actions.finishAction();
    }
    this.close();
  }

}
