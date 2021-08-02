import {Component, Inject, OnInit} from '@angular/core';
import {FormControl, FormGroupDirective, NgForm, Validators} from '@angular/forms';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import { ErrorStateMatcher } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {RenamePageDialogComponent} from '../rename-page-dialog/rename-page-dialog.component';
import {BookCommunication, PageCommunication, PageResponse} from '../../../data-types/communication';
import {forkJoin} from 'rxjs/internal/observable/forkJoin';
import {ApiError} from '../../../utils/api-error';

interface Pages {
  name: string;
  pages: Array<PageCommunication>;
  book: BookCommunication;
}

class RenameErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-rename-all-pages-dialog',
  templateUrl: './rename-all-pages-dialog.component.html',
  styleUrls: ['./rename-all-pages-dialog.component.css']
})
export class RenameAllPagesDialogComponent implements OnInit {
  public prefixFormControl: FormControl;
  public title = '';
  public errorMessage = '';
  matcher = new RenameErrorStateMatcher();
  startFolio = 1;
  startSide = 0;
  readonly allPages = this.data.pages.length = 0;
  get pagesLoaded() { return this.data.pages.length > 0; }

  constructor(
    private http: HttpClient,
    private dialogRef: MatDialogRef<RenamePageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Pages,
  ) {
    this.title = data.name;
    this.prefixFormControl = new FormControl('folio_', [
      Validators.pattern(/^\w+$/)
    ]);
  }

  ngOnInit() {
    if (this.data.pages.length === 0) {
      // rename all pages
      this.http.get<{ pages: PageResponse[], totalPages: number }>(this.data.book.listPages(), {}).subscribe(
        r => {
          this.data.pages = r.pages.map(page => new PageCommunication(this.data.book, page.label));
        },
        err => {
          if (err.error) {
            const error = err.error as ApiError;
            this.errorMessage = error.userMessage;
          } else {
            this.errorMessage = err.message;
          }
        }
      );
    }
  }

  close(result: boolean|string) { this.dialogRef.close(result); }

  onConfirm() {
    let folio = this.startFolio;
    let side = this.startSide;

    this.http.post(this.data.book.renamePagesUrl(), {
      'files': this.data.pages.map(p => {
        let label = this.prefixFormControl.value + folio.toString().padStart(4, '0');
        if (side === 1) {
          label += 'v';
        }

        if (side === 1) {
          side = 0;
          folio += 1;
        } else {
          side = 1;
        }
        return {'src': p.page, 'target': label};
      })
    }).subscribe(
      () => {
        this.close(true);
      },
      (err: HttpErrorResponse) => {
        if (err.error) {
          const error = err.error as ApiError;
          this.errorMessage = error.userMessage;
        } else {
          this.errorMessage = err.message;
        }
      }
    );
  }
}
