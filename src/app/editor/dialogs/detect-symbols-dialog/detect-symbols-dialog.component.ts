import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {ActionType} from '../../actions/action-types';
import {TaskWorker} from '../../task';
import {Subscription} from 'rxjs';
import {ActionsService} from '../../actions/actions.service';
import {PageState} from '../../editor.service';
import {HttpClient} from '@angular/common/http';
import {Symbol} from '../../../data-types/page/music-region/symbol';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

export interface DetectSymbolsDialogData {
  pageState: PageState;
  onClosed: any;
}

@Component({
  selector: 'app-detect-symbols-dialog',
  templateUrl: './detect-symbols-dialog.component.html',
  styleUrls: ['./detect-symbols-dialog.component.css']
})
export class DetectSymbolsDialogComponent implements OnInit, OnDestroy {
  private readonly _subscriptions = new Subscription();
  task: TaskWorker;

  constructor(
    private http: HttpClient,
    private actions: ActionsService,
    private dialogRef: MatDialogRef<DetectSymbolsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DetectSymbolsDialogData,
  ) {
    this.task = new TaskWorker('symbols', this.http, this.data.pageState.pageCom);
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

  private onTaskFinished(res: {musicLines: Array<any>}) {
    if (!res.musicLines) {
      console.error('No symbols transmitted.');
    } else {
      this.actions.startAction(ActionType.SymbolsAutomatic);
      res.musicLines.forEach(
        ml => {
          const music_line = this.data.pageState.pcgts.page.musicLineById(ml.id);
          const symbols = Symbol.symbolsFromJson(ml.symbols, null);
          symbols.forEach(s => {
            this.actions.attachSymbol(music_line, s);
            s.snappedCoord = s.computeSnappedCoord();
          });
        }
      );
      this.actions.finishAction();
    }
    this.close();
  }

}
