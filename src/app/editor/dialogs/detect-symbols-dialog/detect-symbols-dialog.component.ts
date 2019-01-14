import {Component, ComponentRef, OnInit} from '@angular/core';
import {ActionType} from '../../actions/action-types';
import {TaskStatus, TaskStatusCodes, TaskWorker} from '../../task';
import {IModalDialog, IModalDialogButton, IModalDialogOptions} from 'ngx-modal-dialog';
import {Subject} from 'rxjs';
import {ActionsService} from '../../actions/actions.service';
import {PageState} from '../../editor.service';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Symbol} from '../../../data-types/page/music-region/symbol';

@Component({
  selector: 'app-detect-symbols-dialog',
  templateUrl: './detect-symbols-dialog.component.html',
  styleUrls: ['./detect-symbols-dialog.component.css']
})
export class DetectSymbolsDialogComponent implements OnInit, IModalDialog {
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
    this.task = new TaskWorker('symbols', this.http, this.pageState);
    this.task.taskFinished.subscribe(res => this.onTaskFinished(res));
  }

  private onTaskFinished(res: {musicLines: Array<any>}) {
    if (!res.musicLines) {
      console.error('No symbols transmitted.');
    } else {
      this.actions.startAction(ActionType.SymbolsAutomatic);
      res.musicLines.forEach(
        ml => {
          const music_line = this.pageState.pcgts.page.musicLineById(ml.id);
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
