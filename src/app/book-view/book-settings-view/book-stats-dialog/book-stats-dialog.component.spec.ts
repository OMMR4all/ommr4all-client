import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookStatsDialogComponent } from './book-stats-dialog.component';

describe('BookStatsDialogComponent', () => {
  let component: BookStatsDialogComponent;
  let fixture: ComponentFixture<BookStatsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BookStatsDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookStatsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
