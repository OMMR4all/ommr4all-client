import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BookStatsDialogComponent } from './book-stats-dialog.component';

describe('BookStatsDialogComponent', () => {
  let component: BookStatsDialogComponent;
  let fixture: ComponentFixture<BookStatsDialogComponent>;

  beforeEach(waitForAsync(() => {
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
