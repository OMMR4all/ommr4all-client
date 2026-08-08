import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {BehaviorSubject} from 'rxjs';
import {GlobalSettingsService} from '../../../global-settings.service';
import {ServerUrls} from '../../../server-urls';
import {AlgorithmTypes} from '../../../book-view/book-step/algorithm-predictor-params';

export interface TrainingBook {
  book: string;
  name: string;
  style: string;
  pages: number;
  // pages that carry all locks this training step requires, i.e. the ones it can learn from
  usablePages: number;
}

export interface TrainingBooksResponse {
  operation: string;
  locks: string[];
  books: TrainingBook[];
}

@Component({
    selector: 'app-training-books-selection',
    templateUrl: './training-books-selection.component.html',
    styleUrls: ['./training-books-selection.component.scss'],
    standalone: false
})
export class TrainingBooksSelectionComponent implements OnInit, OnChanges {
  private http = inject(HttpClient);
  private globalSettings = inject(GlobalSettingsService);

  // the book that is trained: it always contributes its data and cannot be deselected
  @Input() currentBook: string;
  @Input() currentStyle: string;
  @Input() operation: AlgorithmTypes;
  @Input() disabled = false;

  // the additionally selected books, without the trained book
  @Output() selectedChange = new EventEmitter<string[]>();

  readonly displayedColumns = ['select', 'name', 'style', 'pages', 'usablePages'];
  books = new BehaviorSubject<TrainingBook[]>([]);
  locks = new BehaviorSubject<string[]>([]);
  loading = true;
  private selected = new Set<string>();

  ngOnInit() {
    this.refresh();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.operation && !changes.operation.firstChange) {
      // the usable page counts depend on the locks of the trained step
      this.refresh();
    }
  }

  refresh() {
    this.loading = true;
    this.http.get<TrainingBooksResponse>(ServerUrls.trainingBooks(this.operation)).subscribe(
      r => {
        this.loading = false;
        this.locks.next(r.locks);
        const books = r.books.slice().sort((a, b) => {
          if (a.book === this.currentBook) { return -1; }
          if (b.book === this.currentBook) { return 1; }
          if (a.usablePages !== b.usablePages) { return b.usablePages - a.usablePages; }
          return a.name.localeCompare(b.name);
        });
        this.selected = new Set<string>([...this.selected].filter(b => books.some(x => x.book === b)));
        this.books.next(books);
        this.emit();
      },
      () => { this.loading = false; this.books.next([]); },
    );
  }

  styleName(style: string): string {
    const s = this.globalSettings.bookStyleById(style);
    return s ? s.name : style;
  }

  isCurrentBook(b: TrainingBook) { return b.book === this.currentBook; }
  isSelectable(b: TrainingBook) { return !this.disabled && !this.isCurrentBook(b) && b.usablePages > 0; }
  isSelected(b: TrainingBook) { return this.isCurrentBook(b) || this.selected.has(b.book); }
  isForeignStyle(b: TrainingBook) { return !!this.currentStyle && b.style !== this.currentStyle; }

  toggle(b: TrainingBook) {
    if (!this.isSelectable(b)) { return; }
    if (this.selected.has(b.book)) { this.selected.delete(b.book); } else { this.selected.add(b.book); }
    this.emit();
  }

  selectAll(sameStyleOnly: boolean) {
    this.books.getValue()
      .filter(b => this.isSelectable(b) && (!sameStyleOnly || !this.isForeignStyle(b)))
      .forEach(b => this.selected.add(b.book));
    this.emit();
  }

  selectNone() {
    this.selected.clear();
    this.emit();
  }

  get selectedPages(): number {
    return this.books.getValue().filter(b => this.isSelected(b)).reduce((s, b) => s + b.usablePages, 0);
  }

  get selectedBooks(): number {
    return this.books.getValue().filter(b => this.isSelected(b)).length;
  }

  private emit() {
    this.selectedChange.emit([...this.selected]);
  }
}
