import {EventEmitter, Injectable, Output} from '@angular/core';
import {Http} from '@angular/http';
import {BehaviorSubject, throwError} from 'rxjs';
import {ToolBarStateService} from '../tool-bar/tool-bar-state.service';
import {BookCommunication, PageCommunication} from '../data-types/communication';
import {PcGts} from '../data-types/page/pcgts';
import {MusicLine} from '../data-types/page/music-region/music-line';
import {ActionsService} from './actions/actions.service';
import {Symbol} from '../data-types/page/music-region/symbol';
import {ActionStatistics} from './statistics/action-statistics';
import {ActionType} from './actions/action-types';

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  @Output() currentPageChanged = new EventEmitter<PcGts>();
  private _bookCom = new BookCommunication('');
  private _pageCom = new PageCommunication(this._bookCom, '');
  private _pcgts = new BehaviorSubject<PcGts>(null);
  private _pageLoading = true;
  private _automaticStaffsLoading = false;
  private _automaticSymbolsLoading = false;
  private _errorMessage = '';
  private _actionStatistics = new ActionStatistics(this.toolbarStateService.currentEditorTool);


  constructor(private http: Http,
              private toolbarStateService: ToolBarStateService,
              private actions: ActionsService) {
    this.toolbarStateService.runStaffDetection.subscribe(
      () => this.runStaffDetection()
    );
    this.toolbarStateService.runSymbolDetection.subscribe(
      () => this.runSymbolDetection()
    );
    this.actions.actionCalled.subscribe(type => this._actionStatistics.actionCalled(type));
    this.toolbarStateService.editorToolChanged.subscribe(tool => this._actionStatistics.editorToolActivated(tool.prev, tool.next));
  }

  select(book: string, page: string) {
    this.savePcGts(
      () => {
        this.load(book, page);
      }
    );
  }

  load(book: string, page: string) {
    this._pageLoading = true;
    this._bookCom = new BookCommunication(book);
    this._pageCom = new PageCommunication(this._bookCom, page);
    this.http.get(this._pageCom.content_url('pcgts')).subscribe(
      pcgts => {
        this._pcgts.next(PcGts.fromJson(pcgts.json()));
        this._actionStatistics = new ActionStatistics(this.toolbarStateService.currentEditorTool);
        this._pageLoading = false;
        },
      error => { this._errorMessage = <any>error; }
      );
    this.actions.reset();
  }

  runStaffDetection() {
    this._automaticStaffsLoading = true;
    this.http.post(this._pageCom.operation_url('staffs'), '').subscribe(
      res => {
        this.actions.startAction(ActionType.StaffLinesAutomatic);
        const staffs = (res.json().staffs as Array<any>).map(json => MusicLine.fromJson(json, null));
        staffs.forEach(staff => {
          const mr = this.actions.addNewMusicRegion(this.pcgts.page);
          this.actions.attachMusicLine(mr, staff);
        });
        this._automaticStaffsLoading = false;
        this.actions.finishAction();
      },
      err => {
        console.error(err);
        this._automaticStaffsLoading = false;
        return throwError(err.statusText || 'Server error');
      }
    );
  }

  runSymbolDetection() {
    this._automaticSymbolsLoading = true;
    // save page first, current regions/ids are required
    this.savePcGts(() => {
      this.http.post(this._pageCom.operation_url('symbols'), '').subscribe(
        res => {
          this.actions.startAction(ActionType.SymbolsAutomatic);
          (res.json().musicLines as Array<any>).forEach(
            ml => {
              const music_line = this.pcgts.page.musicLineById(ml.id);
              const symbols = Symbol.symbolsFromJson(ml.symbols, null);
              symbols.forEach(s => {
                this.actions.attachSymbol(music_line, s);
                s.snappedCoord = s.computeSnappedCoord();
              });
            }
          );
          this._automaticSymbolsLoading = false;
          this.actions.finishAction();
        },
        err => {
          this._automaticSymbolsLoading = false;
          console.error(err);
          return throwError(err.statusText || 'Server error');
        }
      );
    });

  }

  get pageCom(): PageCommunication { return this._pageCom; }
  get bookCom(): BookCommunication { return this._bookCom; }
  get pcgtsObservable() { return this._pcgts.asObservable(); }
  get pcgts(): PcGts { return this._pcgts.getValue(); }
  get width() { return this.pcgts.page.imageWidth; }
  get height() { return this.pcgts.page.imageHeight; }
  get errorMessage() { return this._errorMessage; }
  get pageLoading() { return this._pageLoading; }
  get isLoading() { return this._automaticStaffsLoading || this._automaticSymbolsLoading; }
  get actionStatistics() { return this._actionStatistics; }

  dumps(): string {
    if (!this.pcgts) { return ''; }
    return JSON.stringify(this.pcgts.toJson(), null, 2);
  }

  savePcGts(onSaved = null) {
    if (this._pcgts) {
      this.http.post(this._pageCom.operation_url('save'), this.pcgts.toJson(),
        {}).subscribe(
        result => {
          console.log('saved');
          if (onSaved) { onSaved(); }
        },
        error => {
          console.log(error);
        },
      );
    } else {
      onSaved();
    }
  }

}
