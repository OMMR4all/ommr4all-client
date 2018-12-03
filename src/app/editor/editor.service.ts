import {EventEmitter, Injectable, Output} from '@angular/core';
import {BehaviorSubject, Observable, throwError, forkJoin} from 'rxjs';
import {ToolBarStateService} from './tool-bar/tool-bar-state.service';
import {BookCommunication, PageCommunication} from '../data-types/communication';
import {PcGts} from '../data-types/page/pcgts';
import {MusicLine} from '../data-types/page/music-region/music-line';
import {ActionsService} from './actions/actions.service';
import {Symbol} from '../data-types/page/music-region/symbol';
import {ActionStatistics} from './statistics/action-statistics';
import {ActionType} from './actions/action-types';
import {PageEditingProgress} from '../data-types/page-editing-progress';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';

enum TaskStatusCodes {
  Queued = 0,
  Running = 1,
  Finished = 2,
  Error = 3,
}

class TaskStatus {
  constructor(
    public code: TaskStatusCodes,
    public progress: number,
    public accuracy: number,
  ) {}
}

class BookState {
  constructor(
    public readonly symbolDetectionIsTraining: boolean = false,
  ) { }
}

class PageState {
  constructor(
    public readonly zero: boolean,
    public readonly pageCom: PageCommunication,
    public readonly pcgts: PcGts,
    public readonly progress: PageEditingProgress,
    public readonly statistics: ActionStatistics,
    public bookState: BookState = new BookState(),
  ) {}

  get bookCom() { return this.pageCom.book; }
}

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  @Output() currentPageChanged = new EventEmitter<PcGts>();
  @Output() staffDetectionFinished = new EventEmitter<PageState>();
  @Output() symbolDetectionFinished = new EventEmitter<PageState>();
  private _pageState = new BehaviorSubject<PageState>(null);
  private _automaticStaffsLoading = false;
  private _automaticSymbolsLoading = false;
  private _errorMessage = '';

  private _resetState() {
    const progress = new PageEditingProgress();
    this._pageState.next(
      new PageState(
        true,
        new PageCommunication(new BookCommunication(''), ''),
        new PcGts(),
        progress,
        new ActionStatistics(this.toolbarStateService.currentEditorTool, progress),
      )
    );
  }

  constructor(private http: HttpClient,
              private toolbarStateService: ToolBarStateService,
              private actions: ActionsService) {
    this._resetState();
    this.toolbarStateService.runStaffDetection.subscribe(() => this.runStaffDetection());
    this.toolbarStateService.runSymbolDetection.subscribe(() => this.runSymbolDetection());
    this.toolbarStateService.runSymbolTraining.subscribe(() => this.runSymbolTrainer());
    this.actions.actionCalled.subscribe(type => { if (this.actionStatistics) { this.actionStatistics.actionCalled(type); }});
    this.toolbarStateService.editorToolChanged.subscribe(tool => {
      if (this.actionStatistics) { this.actionStatistics.editorToolActivated(tool.prev, tool.next); }
    });
  }

  select(book: string, page: string) {
    this.save(
      () => {
        this.load(book, page);
      }
    );
  }

  runStaffDetection() {
    const state = this.pageStateVal;
    const request = () => {
      this.http.get<{ status: TaskStatus, staffs: Array<any>, error: string }>(state.pageCom.operation_url('staffs')).subscribe(
        res => {
          if (res.status.code === TaskStatusCodes.Finished) {
            if (!res.staffs) {
              console.error('No staffs transmitted.');
            } else {
              this.actions.startAction(ActionType.StaffLinesAutomatic);
              const staffs = res.staffs.map(json => MusicLine.fromJson(json, null));
              staffs.forEach(staff => {
                const mr = this.actions.addNewMusicRegion(state.pcgts.page);
                this.actions.attachMusicLine(mr, staff);
              });
              this.actions.finishAction();
            }
            this._automaticStaffsLoading = false;
            this.staffDetectionFinished.emit(state);
          } else if (res.status.code === TaskStatusCodes.Error) {
            console.error('Staff detection finished with error: ' + res.error);
            this._automaticStaffsLoading = false;
          } else {
            console.log(res.status);
            setTimeout(request, 1000);
          }
        },
        err => {
          const resp = err as HttpErrorResponse;
          if (resp.status === 500) {
            const type = resp.error.error;
            if (type === 'no-model') {
              console.log('No model found');
            } else {
              console.log('Unknown server error');
            }
          } else if (resp.status === 504) {
            console.log('Server unreachable');
          } else if (resp.status === 404) {
            console.log('File not found');
          } else {
            console.log('Unknown status');
          }
          this._automaticStaffsLoading = false;
          return throwError(err.statusText || 'Server error');
        }
      );
    };

    // put task
    if (!this._automaticStaffsLoading) {
      this._automaticStaffsLoading = true;
      this.http.put<Response>(state.pageCom.operation_url('staffs'), '').subscribe(
        res => {
          request();
        },
        err => {
          const resp = err as HttpErrorResponse;
          if (resp.status === 303) {
            request();
          } else {
            this._automaticStaffsLoading = false;
            console.error(err);
          }
        }
      );
    }
  }

  runSymbolDetection() {
    const state = this.pageStateVal;
    this._automaticSymbolsLoading = true;
    // save page first, current regions/ids are required
    this.save(() => {
      this.http.post<{musicLines: Array<any>}>(state.pageCom.operation_url('symbols'), '').subscribe(
        res => {
          this.actions.startAction(ActionType.SymbolsAutomatic);
          res.musicLines.forEach(
            ml => {
              const music_line = state.pcgts.page.musicLineById(ml.id);
              const symbols = Symbol.symbolsFromJson(ml.symbols, null);
              symbols.forEach(s => {
                this.actions.attachSymbol(music_line, s);
                s.snappedCoord = s.computeSnappedCoord();
              });
            }
          );
          this._automaticSymbolsLoading = false;
          this.actions.finishAction();
          this.symbolDetectionFinished.emit(state);
        },
        err => {
          this._automaticSymbolsLoading = false;
          console.error(err);
          return throwError(err.statusText || 'Server error');
        }
      );
    });
  }

  runSymbolTrainer() {
    const state = this.pageStateVal;
    this.http.post<{response: string, bookState: BookState}>(state.pageCom.operation_url('train_symbol_detector'), '').subscribe(
      res => {
        if (res.response === 'started') {
          state.bookState = res.bookState;
        } else if (res.response === 'running') {
          // already running...
          state.bookState = res.bookState;
        } else {
          console.error('Invalid response ' + res.response);
        }
      }
    );
  }



  get pageStateObs() { return this._pageState.asObservable(); }
  get pageStateVal() { return this._pageState.getValue(); }
  get pcgts() { return this.pageStateVal.pcgts; }
  get pageCom(): PageCommunication { return this.pageStateVal.pageCom; }
  get bookCom(): BookCommunication { return this.pageStateVal.bookCom; }
  get bookState(): BookState { return this.pageStateVal.bookState; }
  get width() { return this.pageStateVal.pcgts.page.imageWidth; }
  get height() { return this.pageStateVal.pcgts.page.imageHeight; }
  get errorMessage() { return this._errorMessage; }
  get pageLoading() { return this.pageStateVal.zero; }
  get isLoading() { return this._automaticStaffsLoading || this._automaticSymbolsLoading || this.pageLoading; }
  get actionStatistics() { return this.pageStateVal.statistics; }
  get pageEditingProgress() { return this.pageStateVal.progress; }

  dumps(): string {
    if (!this.pageStateVal) { return ''; }
    return JSON.stringify(this.pageStateVal.pcgts.toJson(), null, 2);
  }

  load(book: string, page: string) {
    this._resetState();
    this.actions.reset();
    const pageCom = new PageCommunication(new BookCommunication(book), page);
    forkJoin([
      this.http.get(pageCom.content_url('pcgts')),
      this.http.get(pageCom.content_url('page_progress')),
    ]).subscribe(
      pcgts_progress => {
        const progress = PageEditingProgress.fromJson(pcgts_progress[1]);
        this.http.get(pageCom.content_url('statistics')).subscribe(
          stats => {
            this._pageState.next(new PageState(
              false,
              pageCom,
              PcGts.fromJson(pcgts_progress[0]),
              progress,
              ActionStatistics.fromJson(stats,
                this.toolbarStateService.currentEditorTool, progress),
            ));
           },
          error => { this._errorMessage = <any>error; }
        );
      },
      error => { this._errorMessage = <any>error; }
    );
  }

  save(onSaved = null) {
    const state = this.pageStateVal;
    if (!state) { if (onSaved) { onSaved(); } return; }
    forkJoin([
        this.http.post(state.pageCom.operation_url('save_statistics'), state.statistics.toJson(), {}),
        this.http.post(state.pageCom.operation_url('save'), state.pcgts.toJson(), {}),
        this.http.post(state.pageCom.operation_url('save_page_progress'), state.progress.toJson(), {}),
    ]).subscribe(next => {
      console.log('saved');
      if (onSaved) { onSaved(); }
    });
  }

}
