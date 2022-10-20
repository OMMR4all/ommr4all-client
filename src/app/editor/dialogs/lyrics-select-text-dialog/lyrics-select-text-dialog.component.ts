import {Component, Inject, OnInit} from '@angular/core';
import {ActionsService} from '../../actions/actions.service';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatTabChangeEvent} from '@angular/material/tabs';
import {LyricsPasteToolDialogComponent} from '../lyrics-paste-tool-dialog/lyrics-paste-tool-dialog.component';
import {EditorService} from '../../editor.service';
import {Document} from "../../../book-documents";
import {BehaviorSubject, forkJoin} from "rxjs";
import {BookCommunication, DocumentCommunication} from "../../../data-types/communication";
import {SheetOverlayService} from "../../sheet-overlay/sheet-overlay.service";
import {HttpClient} from "@angular/common/http";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";

export class LyricsSelectTextResultData {
  result: boolean;
  text: string = null;
}

export class LyricsSelectTextData {
  docs: string;
  docId: string;
  doc: Document;
}

@Component({
  selector: 'app-lyrics-select-text-dialog',
  templateUrl: './lyrics-select-text-dialog.component.html',
  styleUrls: ['./lyrics-select-text-dialog.component.scss']
})


export class LyricsSelectTextDialogComponent implements OnInit {
  currentIndex = 0;
  book = new BehaviorSubject<BookCommunication>(undefined);
  line_texts: string[] = [];
  line_images: SafeResourceUrl[] | string[] = [];
  textImagePair: [string, SafeResourceUrl | string, string][] = [];
  public documentCommunication = new DocumentCommunication(this.bookCom, '');

  constructor(public actions: ActionsService,
              protected sheetOverlayService: SheetOverlayService,
              private modalDialog: MatDialog,
              private editorService: EditorService,
              private dialogRef: MatDialogRef<LyricsSelectTextDialogComponent>,
              private http: HttpClient,
              private _sanitizer: DomSanitizer,
              @Inject(MAT_DIALOG_DATA) public data: LyricsSelectTextData, ) {
  }

  getDocs() {
    return this.data.docs;
  }

  getLineCount() {
    return Array.from(Array(this.data.doc.textline_count).keys());
  }

  tabChanged(tabChangeEvent: MatTabChangeEvent): void {
    this.currentIndex = tabChangeEvent.index;
  }

  get bookCom() {
    return this.book.getValue();
  }
  getAlignedLine(index) {
    if (this.data.docs.length > 0) {
      const lines = this.data.docs.split(/\r?\n/);
      if (index < lines.length) {
        return lines[index];

      }
      }
    return '';
    }



  ngOnInit() {
    if (this.data.docs.length <= 0) {
      close();
    }
    this.documentCommunication = new DocumentCommunication(this.sheetOverlayService.editorService.bookCom, this.data.doc.doc_id);
    // tslint:disable-next-line:max-line-length
    Array.from(Array(this.data.doc.textline_count).keys()).forEach(index => {
      let image: any;
      let text: string;
      forkJoin(this.http.get(this.documentCommunication.document_line_image(index.toString()), {responseType: 'blob'}),
        // tslint:disable-next-line:variable-name
        this.http.get<string>(this.documentCommunication.document_line_text(index.toString()))).subscribe(([res, res2]) => {
          // let objectURL = URL.createObjectURL(res);
          res.text().then(imageText => {
            // @ts-ignore
            image = this._sanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,' + imageText);
            text = res2;
            this.textImagePair.push([text, image, this.getAlignedLine(index)]);
          });
        });


    },
      );
    //this.line_images.forEach(el => console.log(el));
  }

  getDocumentLineImage(index) {
    this.documentCommunication.document_line_image(index.toString());
    //console.log(this.documentCommunication.document_line_image(index.toString()));
  }

  getDocumentLineText(index) {
    var text = '';
    this.http.get<string>(this.documentCommunication.document_line_text(index.toString())).subscribe(res => text = res);
    //console.log(this.documentCommunication.document_line_text(index.toString()));
    //console.log(text);
    return text;
  }

  close(r: any = false) {
    this.dialogRef.close(r);
  }

  select() {
    const data = new LyricsSelectTextResultData();
    data.result = true;
    this.close(data);
    this.modalDialog.open(LyricsPasteToolDialogComponent, {
      disableClose: false,
      width: '600px',
      data: {
        page: this.editorService.pcgts.page,
        preData: this.getDocs()[this.currentIndex]

      }
    });
  }

  insertDocument() {
    const data = new LyricsSelectTextResultData();
    data.result = true;
    data.text = this.getDocs()[this.currentIndex];
    this.close(data);
  }
}
