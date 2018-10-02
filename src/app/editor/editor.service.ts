import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {PageAnnotation, ServerUrls} from '../server-urls';
import {EditorTools, ToolBarStateService} from '../tool-bar/tool-bar-state.service';
import {BookCommunication, PageCommunication} from '../data-types/communication';
import {plainToClass} from 'class-transformer';
import {PcGts} from '../data-types/page/pcgts';

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  private _bookCom = new BookCommunication('');
  private _pageCom = new PageCommunication(this._bookCom, '');
  private _pcgts = new PcGts();
  private _automaticStaffsLoaded = false;
  private _errorMessage = '';

  constructor(private http: Http, private toolbarStateService: ToolBarStateService) {
    this.toolbarStateService.editorToolChanged.subscribe(
      (nextTool) => this._updateForTool(nextTool)
    );
  }

  private _updateForTool(nextTool) {
    if (nextTool === EditorTools.AutomaticStaffDetection) {
    } else {
    }
  }

  select(book: string, page: string) {
    this.saveStaffs(
      () => {
        this.load(book, page);
      }
    );
  }

  load(book: string, page: string) {
    this._bookCom = new BookCommunication(book);
    this._pageCom = new PageCommunication(this._bookCom, page);
    this.http.get(this._pageCom.content_url('pcgts')).subscribe(
      pcgts => { this._pcgts = PcGts.fromJson(pcgts.json()); },
      error => { this._errorMessage = <any>error; }
      );
  }

  getStaffDetection() {
    /* return this.http.get(this._pageCom.content_url('detected_staffs')).pipe(
      map((res) => Staffs.fromJSON(res.json())),
      catchError(err => {
        console.error(err);
        return throwError(err.statusText || 'Server error');
      })
    ); */
  }

  get pageCom(): PageCommunication {
    return this._pageCom;
  }

  get bookCom(): BookCommunication {
    return this._bookCom;
  }

  get pcgts() {
    return this._pcgts;
  }

  get width() {
    return this._pcgts.page.imageWidth;
  }

  get height() {
    return this._pcgts.page.imageHeight;
  }

  get errorMessage() {
    return this._errorMessage;
  }

  get automaticStaffsLoaded() {
    return this._automaticStaffsLoaded;
  }

  dumps(): string {
    return JSON.stringify(this._pcgts.toJson(), null, 2);
  }

  saveStaffs(onSaved) {
    if (this._pcgts) {
      this.http.post(this._pageCom.operation_url('save'), this._pcgts.toJson(),
        {}).subscribe(
        result => {
          console.log('saved');
          onSaved();
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
