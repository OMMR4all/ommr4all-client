import { Injectable } from '@angular/core';
import { Staffs } from './musical-symbols/StaffLine';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { throwError } from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import { ServerUrlsService, PageAnnotation } from './server-urls.service';

@Injectable({
  providedIn: 'root'
})
export class StaffsService {
  private _book = '';
  private _page = '';
  private _staffs = new Staffs();
  private _errorMessage = '';
  private _annotation: PageAnnotation;

  constructor(private http: Http, private serverUrls: ServerUrlsService) {
    // TODO: remove dummy
    this.fromJson(`
{"staffs":[{"lines":[{"line":{"points":[{"x":99.25,"y":30},{"x":683,"y":25}]}},{"line":{"points":[{"x":109.25,"y":60},{"x":671.75,"y":53.75}]}},{"line":{"points":[{"x":116.75,"y":87.5},{"x":683,"y":82.5}]}},{"line":{"points":[{"x":113,"y":112.5},{"x":684.25,"y":106.25}]}}],"symbolList":{"symbols":[{"type":0,"position":{"x":161.75,"y":73.25965783664459}},{"type":0,"position":{"x":224.25,"y":72.63649742457689}},{"type":0,"position":{"x":240.5,"y":58.541666666666664}},{"type":0,"position":{"x":301.75,"y":85.86644591611478}},{"type":0,"position":{"x":360.5,"y":97.56990232874927}},{"type":0,"position":{"x":425.5,"y":109.08096280087527}},{"type":0,"position":{"x":483,"y":108.45185995623632}},{"type":0,"position":{"x":498,"y":96.21065012728178}},{"type":0,"position":{"x":540.5,"y":83.75827814569537}},{"type":0,"position":{"x":581.75,"y":107.37144420131291}},{"type":0,"position":{"x":645.5,"y":120.23275419089522}}]}},{"lines":[{"line":{"points":[{"x":106.75,"y":200},{"x":673,"y":196.25}]}},{"line":{"points":[{"x":111.75,"y":226.25},{"x":680.5,"y":221.25}]}},{"line":{"points":[{"x":109.25,"y":255},{"x":680.5,"y":247.5}]}},{"line":{"points":[{"x":680.5,"y":278.75},{"x":109.25,"y":278.75}]}}],"symbolList":{"symbols":[{"type":0,"position":{"x":146.75,"y":254.50765864332604}},{"type":0,"position":{"x":198,"y":239.66327518214825}},{"type":0,"position":{"x":254.25,"y":224.99725274725276}},{"type":0,"position":{"x":305.5,"y":224.5467032967033}},{"type":0,"position":{"x":335.5,"y":224.28296703296704}},{"type":0,"position":{"x":381.75,"y":211.02759078669675}},{"type":0,"position":{"x":396.5,"y":198.08774834437085}},{"type":0,"position":{"x":431.75,"y":223.4368131868132}},{"type":0,"position":{"x":444.25,"y":236.9643368119845}},{"type":0,"position":{"x":483,"y":250.0929978118162}},{"type":0,"position":{"x":498,"y":264.3230306345733}},{"type":0,"position":{"x":541.75,"y":235.89572161973695}},{"type":0,"position":{"x":556.75,"y":222.3379120879121}},{"type":0,"position":{"x":603,"y":235.22441207588912}},{"type":0,"position":{"x":654.25,"y":247.84463894967178}}]}},{"lines":[{"line":{"points":[{"x":466.75,"y":372.5},{"x":685.5,"y":371.25}]}},{"line":{"points":[{"x":468,"y":401.25},{"x":680.5,"y":398.75}]}},{"line":{"points":[{"x":468,"y":428.75},{"x":681.75,"y":427.5}]}},{"line":{"points":[{"x":469.25,"y":456.25},{"x":680.5,"y":456.25}]}}],"symbolList":{"symbols":[{"type":0,"position":{"x":525.5,"y":400.5735294117647}},{"type":0,"position":{"x":545.5,"y":386.1941176470588}},{"type":0,"position":{"x":626.75,"y":399.38235294117646}}]}},{"lines":[{"line":{"points":[{"x":471.75,"y":547.5},{"x":678,"y":545}]}},{"line":{"points":[{"x":476.75,"y":575},{"x":678,"y":575}]}},{"line":{"points":[{"x":479.25,"y":601.25},{"x":681.75,"y":602.5}]}},{"line":{"points":[{"x":478,"y":628.75},{"x":676.75,"y":628.75}]}}],"symbolList":{"symbols":[{"type":0,"position":{"x":513,"y":575}},{"type":0,"position":{"x":570.5,"y":588.406635802469}},{"type":0,"position":{"x":648,"y":602.2916666666666}}]}}]}
  `);
  }

  select(book, page) {
    this.saveStaffs(
      function () {
        this.load(book, page);
      }.bind(this)
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
      error => {this._errorMessage = <any>error;});
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

  get staffs() {
    return this._staffs;
  }

  get annotation() {
    return this._annotation;
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
