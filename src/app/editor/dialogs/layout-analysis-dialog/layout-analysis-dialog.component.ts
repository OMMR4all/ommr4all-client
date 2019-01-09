import {Component, ComponentRef, OnInit} from '@angular/core';
import {IModalDialog, IModalDialogButton, IModalDialogOptions} from 'ngx-modal-dialog';
import {TaskWorker} from '../../task';
import {ActionsService} from '../../actions/actions.service';
import {PageState} from '../../editor.service';
import {Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {ActionType} from '../../actions/action-types';
import {PolyLine} from '../../../geometry/geometry';
import {TextRegionType} from '../../../data-types/page/text-region';
import {objIntoEnumMap, objIntoMap} from '../../../utils/converting';

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
          const newMr = this.actions.addNewMusicRegion(this.pageState.pcgts.page);
          targetMr = this.actions.addNewMusicLine(newMr);
        }
        this.actions.changePolyLine(targetMr.coords, targetMr.coords, PolyLine.fromString(mr.coords));
      });
      objIntoEnumMap<TextRegionType, Array<{id: string, coords: string}>>(res.textRegions, new Map(), TextRegionType, false).
      forEach((trs, type) => {
        trs.forEach(tr => {
          const newTr = this.actions.addNewTextRegion(type, this.pageState.pcgts.page);
          if (type === TextRegionType.Lyrics) {
            const newTl = this.actions.addNewTextLine(newTr);
            this.actions.changePolyLine(newTl.coords, newTl.coords, PolyLine.fromString(tr.coords));
          } else {
            this.actions.changePolyLine(newTr.coords, newTr.coords, PolyLine.fromString(tr.coords));
          }
        });
      });
      this.actions.finishAction();
    }
    this.close();
  }

}
