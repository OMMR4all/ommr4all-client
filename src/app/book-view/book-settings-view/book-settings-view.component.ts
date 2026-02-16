import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {BookMeta} from '../../book-list.service';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {BookCommunication} from '../../data-types/communication';
import { MatDialog } from '@angular/material/dialog';
import {ConfirmDeleteBookDialogComponent} from './confirm-delete-book-dialog/confirm-delete-book-dialog.component';
import {Router} from '@angular/router';
import {GlobalSettingsService} from '../../global-settings.service';
import {BookStatsDialogComponent} from './book-stats-dialog/book-stats-dialog.component';

@Component({
  selector: 'app-book-settings-view',
  templateUrl: './book-settings-view.component.html',
  styleUrls: ['./book-settings-view.component.css']
})
export class BookSettingsViewComponent implements OnInit, OnDestroy {
  private _subscriptions = new Subscription();
  @Input() bookMeta: BehaviorSubject<BookMeta>;
  @Input() bookCom: BookCommunication;

  @Output() bookMetaUpdated = new EventEmitter<BookMeta>();

  currentBookMeta: BookMeta;

  constructor(
    private modalDialog: MatDialog,
    private http: HttpClient,
    private router: Router,
    public globalSettings: GlobalSettingsService,
  ) { }

  ngOnInit() {
    this._subscriptions.add(
      this.bookMeta.subscribe(() => this.resetInfo())
    );
    this.resetInfo();
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  saveInfo() {
    this.http.put(this.bookCom.meta(), this.currentBookMeta.toJson()).subscribe(
      () => {
        this.bookMetaUpdated.emit(this.currentBookMeta);
      },
      (err: HttpErrorResponse) => {
      }
    );
  }

  resetInfo() {
    this.currentBookMeta = BookMeta.copy(this.bookMeta.getValue());
  }

  showStats() {
    this.modalDialog.open(BookStatsDialogComponent, {
      data: {
        book: this.bookMeta.getValue(),
        bookCom: this.bookCom,
      }
    });
  }

  destroyBook() {
    this.modalDialog.open(ConfirmDeleteBookDialogComponent, {
      data: {
        book: this.bookMeta.getValue(),
      }
    }).afterClosed().subscribe(deleted => {
        if (deleted) { this.router.navigate(['/book']); }
      }
    );
  }

}
