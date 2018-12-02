import {Component, ComponentRef, OnInit} from '@angular/core';
import {ServerUrls} from '../../../server-urls';
import {IModalDialog, IModalDialogButton, IModalDialogOptions} from 'ngx-modal-dialog';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-confirm-delete-book-dialog',
  templateUrl: './confirm-delete-book-dialog.component.html',
  styleUrls: ['./confirm-delete-book-dialog.component.css']
})
export class ConfirmDeleteBookDialogComponent implements OnInit, IModalDialog {
  public errorMessage = '';
  bookMeta;
  private onDeleted;
  actionButtons: IModalDialogButton[];

  constructor(
    private http: HttpClient,
  ) {
    this.actionButtons = [
      { text: 'Delete', onAction: () => this.onConfirm()},
      { text: 'Cancel', onAction: () => true} ,
    ];
  }

  ngOnInit() {
  }

  dialogInit(reference: ComponentRef<IModalDialog>, options: Partial<IModalDialogOptions<any>>) {
    this.bookMeta = options.data.book;
    this.onDeleted = options.data.onDeleted;
  }

  private onConfirm() {
    return new Promise(((resolve, reject) => {
      this.http.post(ServerUrls.deleteBook(), {'id': this.bookMeta.id}).subscribe(
        next => {
          this.onDeleted();
          resolve();
        },
        error => {
          const resp = error as Response;
          if (resp.status === 304) {
            this.errorMessage = 'The book could not be deleted.';
          } else if (resp.status === 504) {
            this.errorMessage = 'Server is unavailable.';
          } else {
            this.errorMessage = 'Unknown server error (' + resp.status + ').';
          }
          reject();
        }
      );
    }));
  }
}
