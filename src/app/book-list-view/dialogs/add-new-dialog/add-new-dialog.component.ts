import {Component, ComponentRef, ElementRef, OnInit, ViewChild} from '@angular/core';
import {IModalDialog, IModalDialogButton, IModalDialogOptions} from 'ngx-modal-dialog';
import {ServerUrls} from '../../../server-urls';
import {HttpClient} from '@angular/common/http';
import {Subject} from 'rxjs';
import {last} from 'rxjs/operators';

@Component({
  selector: 'app-add-new-dialog',
  templateUrl: './add-new-dialog.component.html',
  styleUrls: ['./add-new-dialog.component.css']
})
export class AddNewDialogComponent implements OnInit, IModalDialog {
  @ViewChild('bookName') bookNameField: ElementRef;
  errorMessage: string;
  actionButtons: IModalDialogButton[];
  private added: any;
  constructor(private http: HttpClient) {
    this.actionButtons = [
      { text: 'Add', buttonClass: 'btn btn-success', onAction: () => this.onAdd()},
      { text: 'Close', buttonClass: 'btn btn-secondary', onAction: () => true} ,
    ];
  }

  dialogInit(reference: ComponentRef<IModalDialog>, options: Partial<IModalDialogOptions<any>>) {
    this.added = options.data.onAdded;
  }

  ngOnInit() {
  }

  private onAdd() {
    return new Promise(((resolve, reject) => {
      this.http.post(ServerUrls.addBook(), {'name': this.bookNameField.nativeElement.value}).subscribe(
        book => {
          this.added(book);
          resolve();
        },
        error => {
          const resp = error as Response;
          if (resp.status === 304) {
            this.errorMessage = 'A book with this name already exists.';
          } else if (resp.status === 504) {
            this.errorMessage = 'Server is unavailable.';
          } else if (resp.status === 460) {
            this.errorMessage = 'Invalid name.';
          } else {
            this.errorMessage = 'Unknown server error (' + resp.status + ').';
          }
          reject();
        }
      );
    }));
  }
}
