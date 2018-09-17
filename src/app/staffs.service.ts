import {Injectable} from '@angular/core';
import {Staffs} from './musical-symbols/StaffLine';
import {Http} from '@angular/http';
import {throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {PageAnnotation, PageContent, ServerUrlsService} from './server-urls.service';
import {EditorTools, ToolBarStateService} from './tool-bar/tool-bar-state.service';

@Injectable({
  providedIn: 'root'
})
export class StaffsService {
  private _book = '';
  private _page = '';
  private _staffs = new Staffs();
  private _errorMessage = '';
  private _annotation: PageAnnotation;

  constructor(private http: Http, private serverUrls: ServerUrlsService, private toolbarStateService: ToolBarStateService) {
    this.toolbarStateService.editorToolChanged.subscribe(
      (nextTool) => {
        if (nextTool === EditorTools.AutomaticStaffDetection) {
          this.getStaffDetection(this._book, this._page).subscribe(
            staffs => {
              console.log(staffs);
              this._staffs = staffs;
            },
            error => { this._errorMessage = <any>error; });
        }
      }
    );
  }

  select(book, page) {
    this.saveStaffs(
      () => {
        this.load(book, page);
      }
    );
  }

  load(book, page) {
    this._book = book;
    this._page = page;
    this._staffs = new Staffs();
    this._annotation = null;

    this.getPageAnnotation(this._book, this._page).subscribe(
      annotation => {
        console.log(annotation);
        this._annotation = annotation as PageAnnotation;
        this._staffs = Staffs.fromJSON(annotation.data);
      },
      error => { this._errorMessage = <any>error; });
  }


  getPageAnnotation(book, page) {
    return this.http.get(this.serverUrls.page_annotation(book, page)).pipe(
      map((res: any) => res.json() as PageAnnotation),
      catchError(err => {
        console.error(err);
        return throwError(err.statusText || 'Server error');
      })
    );
  }

  getStaffDetection(book, page) {
    return this.http.get(this.serverUrls.page_content(book, page, PageContent.DETECTED_STAFFS)).pipe(
      map((res) => Staffs.fromJSON(res.json())),
      catchError(err => {
        console.error(err);
        return throwError(err.statusText || 'Server error');
      })
    );
  }

  get staffs() {
    return this._staffs;
  }

  get annotation() {
    return this._annotation;
  }

  get width() {
    return this._annotation.width;
  }

  get height() {
    return this._annotation.height;
  }

  get errorMessage() {
    return this._errorMessage;
  }

  dumps(): string {
    return JSON.stringify(this._staffs.toJSON(), null, 4);
  }

  fromJson(s: string) {
    this._staffs = Staffs.fromJSON(JSON.parse(s));
  }

  saveStaffs(onSaved) {
    if (this._annotation) {
      this.http.post(this.serverUrls.save_page_staffs(this._book, this._page), this._staffs.toJSON(),
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
