import {Injectable} from '@angular/core';
import {Staffs} from './musical-symbols/StaffLine';
import {Http} from '@angular/http';
import {throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {PageAnnotation, ServerUrls} from './server-urls';
import {EditorTools, ToolBarStateService} from './tool-bar/tool-bar-state.service';
import {Book, Page, PageMeta} from './data-types/page';
import {plainToClass} from 'class-transformer';

@Injectable({
  providedIn: 'root'
})
export class StaffsService {
  private _book = new Book('');
  private _page = new Page(this._book, '');
  private _staffs = new Staffs();
  private _editStaffs = new Staffs();
  private _errorMessage = '';
  private _pageMeta = new PageMeta();
  private _automaticStaffsLoaded = false;

  constructor(private http: Http, private toolbarStateService: ToolBarStateService) {
    this.toolbarStateService.editorToolChanged.subscribe(
      (nextTool) => this._updateForTool(nextTool)
    );
  }

  private _updateForTool(nextTool) {
    if (nextTool === EditorTools.AutomaticStaffDetection) {
      this._staffs = new Staffs();
      this.getStaffDetection().subscribe(
        staffs => {
          console.log(staffs);
          this._automaticStaffsLoaded = true;
          this._staffs = staffs;
        },
        error => { this._errorMessage = <any>error; });
    } else {
      this._staffs = this._editStaffs;
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
    this._book = new Book(book);
    this._page = new Page(this._book, page);
    this._editStaffs = new Staffs();
    this.http.get(this._page.content_url('meta')).subscribe(
      pageMeta => {
        this._pageMeta = plainToClass(PageMeta, pageMeta);
        this.http.get(this._page.content_url('annotation')).subscribe(
          annotation => {
            this._editStaffs = Staffs.fromJSON(annotation.json());
            this._editStaffs.cleanup();
            if (this._editStaffs._staffs.length === 0) {
              this.getStaffDetection().subscribe(
                staffs => {
                  this._editStaffs = staffs;
                  this._staffs = staffs;
                }
              );
            }
            this._updateForTool(this.toolbarStateService.currentEditorTool);
          },
          error => {
            this._errorMessage = <any>error;
          });
      }
    );
  }

  getStaffDetection() {
    return this.http.get(this._page.content_url('detected_staffs')).pipe(
      map((res) => Staffs.fromJSON(res.json())),
      catchError(err => {
        console.error(err);
        return throwError(err.statusText || 'Server error');
      })
    );
  }

  get page(): Page {
    return this._page;
  }

  get book(): Book {
    return this._book;
  }

  get staffs() {
    return this._staffs;
  }

  get width() {
    return this._pageMeta.width;
  }

  get height() {
    return this._pageMeta.height;
  }

  get errorMessage() {
    return this._errorMessage;
  }

  get automaticStaffsLoaded() {
    return this._automaticStaffsLoaded;
  }

  dumps(): string {
    return JSON.stringify(this._staffs.toJSON(), null, 4);
  }

  saveStaffs(onSaved) {
    if (this._editStaffs) {
      this.http.post(ServerUrls.save_page_staffs(this._book.book, this._page.page), this._editStaffs.toJSON(),
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
