import {Component, Inject, OnInit} from '@angular/core';
import {FormControl, FormGroupDirective, NgForm, Validators} from '@angular/forms';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {ErrorStateMatcher, MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {RenamePageDialogComponent} from '../rename-page-dialog/rename-page-dialog.component';
import {PageCommunication} from '../../../data-types/communication';
import {forkJoin} from 'rxjs/internal/observable/forkJoin';
import {ApiError} from '../../../utils/api-error';

interface Pages {
  name: string;
  pages: Array<PageCommunication>;
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
  }

  close(result: boolean|string) { this.dialogRef.close(result); }

  private renamePageRequest(pageCom: PageCommunication, newName: string) {
    return this.http.post(pageCom.rename_url(), {'name': newName});
  }

  onConfirm() {
    let folio = this.startFolio;
    let side = this.startSide;

    forkJoin(this.data.pages.map(p => {
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
      return this.renamePageRequest(p, label);
    })).subscribe(
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
