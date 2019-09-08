import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BookStyle, GlobalSettingsService} from '../../global-settings.service';
import {ServerUrls} from '../../server-urls';
import {ApiError, apiErrorFromHttpErrorResponse} from '../../utils/api-error';
import {ConfirmDialogComponent, ConfirmDialogModel} from '../../common/confirm-dialog/confirm-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {AuthenticationService, GlobalPermissions} from '../../authentication/authentication.service';

@Component({
  selector: 'app-administrative-view-notation-style',
  templateUrl: './administrative-view-notation-style.component.html',
  styleUrls: ['./administrative-view-notation-style.component.scss']
})
export class AdministrativeViewNotationStyleComponent implements OnInit {
  apiError: ApiError;
  displayedColumns = ['id', 'name', 'actions'];
  notationStyleToEdit: BookStyle;
  get bookStyles(): BookStyle[] { return this.settings.bookStyles; }
  get mayAdd() { return this.authentication.hasPermission(GlobalPermissions.AddBookStyle); }
  get mayEdit() { return this.authentication.hasPermission(GlobalPermissions.EditBookStyle); }
  get mayDelete() { return this.authentication.hasPermission(GlobalPermissions.DeleteBookStyle); }

  constructor(
    private http: HttpClient,
    private settings: GlobalSettingsService,
    private dialog: MatDialog,
    private authentication: AuthenticationService,
  ) {
  }

  ngOnInit() {
  }

  refresh() {
    this.settings.reloadBookStyles();
  }

  delete(id: string) {
    const message = 'Are you sure you want to delete this style?';
    const dialogData = new ConfirmDialogModel('Confirm', message);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.http.delete(ServerUrls.bookStyles() + '/' + id).subscribe(
          r => {
            this.refresh();
          },
          err => {
            this.apiError = apiErrorFromHttpErrorResponse(err);
          }
        );
      }
    });
  }
}
