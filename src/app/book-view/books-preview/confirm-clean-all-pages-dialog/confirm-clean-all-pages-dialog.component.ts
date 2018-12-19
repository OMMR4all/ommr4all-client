import {Component, ComponentRef, OnInit, ViewContainerRef} from '@angular/core';
import {IModalDialog, IModalDialogButton, IModalDialogOptions, ModalDialogService} from 'ngx-modal-dialog';
import {ServerUrls} from '../../../server-urls';
import {HttpClient} from '@angular/common/http';
import {BookCommunication, PageCommunication} from '../../../data-types/communication';
import {forkJoin} from 'rxjs';
import {BookMeta} from '../../../book-list.service';

@Component({
  selector: 'app-confirm-clean-all-pages-dialog',
  templateUrl: './confirm-clean-all-pages-dialog.component.html',
  styleUrls: ['./confirm-clean-all-pages-dialog.component.css']
})
export class ConfirmCleanAllPagesDialogComponent implements OnInit, IModalDialog {
  public errorMessage = '';
  pages: PageCommunication[];
  bookMeta: BookMeta;
  private onDeleted;
  actionButtons: IModalDialogButton[];

  constructor(
    private http: HttpClient,
  ) {
    this.actionButtons = [
      { text: 'Clear', buttonClass: 'btn btn-danger', onAction: () => this.onConfirm()},
      { text: 'Cancel', buttonClass: 'btn btn-secondary', onAction: () => true} ,
    ];
  }

  ngOnInit() {
  }

  dialogInit(reference: ComponentRef<IModalDialog>, options: Partial<IModalDialogOptions<any>>) {
    this.pages = options.data.pages;
    this.bookMeta = options.data.bookMeta;
    this.onDeleted = options.data.onDeleted;
  }

  private onConfirm() {
    return new Promise(((resolve, reject) => {
      forkJoin(this.pages.map(page => this.http.delete(page.operation_url('clean')))).subscribe(
        next => {
          this.onDeleted();
          resolve();
        },
        error => {
          const resp = error as Response;
          if (resp.status === 304) {
            this.errorMessage = 'The book could not be cleared.';
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
