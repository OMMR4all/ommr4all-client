import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BookListViewComponent } from './book-list-view.component';

describe('BookListViewComponent', () => {
  let component: BookListViewComponent;
  let fixture: ComponentFixture<BookListViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BookListViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookListViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
