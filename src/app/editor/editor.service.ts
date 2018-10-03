import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {throwError} from 'rxjs';
import {ToolBarStateService} from '../tool-bar/tool-bar-state.service';
import {BookCommunication, PageCommunication} from '../data-types/communication';
import {PcGts} from '../data-types/page/pcgts';
import {EquivIndex} from '../data-types/page/definitions';
import {StaffEquiv} from '../data-types/page/music-region/staff-equiv';

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  private _bookCom = new BookCommunication('');
  private _pageCom = new PageCommunication(this._bookCom, '');
  private _pcgts = new PcGts();
  private _automaticStaffsLoading = false;
  private _errorMessage = '';

  constructor(private http: Http, private toolbarStateService: ToolBarStateService) {
    this.toolbarStateService.runStaffDetection.subscribe(
      () => this.runStaffDetection()
    );
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

  runStaffDetection() {
    this._automaticStaffsLoading = true;
    this.http.post(this._pageCom.operation_url('staffs'), '').subscribe(
      res => {
        const ai_staffs = (res.json().staffs as Array<any>).map(json => StaffEquiv.fromJson(json));
        const ed_staffs = (res.json().staffs as Array<any>).map(json => StaffEquiv.fromJson(json));
        this._pcgts.page.removeStaffEquivs(EquivIndex.AI);
        for (let i = 0; i < ai_staffs.length; i++) {
          const ms = this._pcgts.page.addNewMusicRegion();
          ai_staffs[i].index = EquivIndex.AI;
          ed_staffs[i].index = EquivIndex.Corrected;
          ms.setStaffEquiv(ai_staffs[i]);
          ms.setStaffEquiv(ed_staffs[i]);
        }
        this._automaticStaffsLoading = false;
      },
      err => {
        console.error(err);
        return throwError(err.statusText || 'Server error');
      }
    );
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

  get automaticStaffsLoading() {
    return this._automaticStaffsLoading;
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
