import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookListViewComponent } from './book-list-view.component';

describe('BookListViewComponent', () => {
  let component: BookListViewComponent;
  let fixture: ComponentFixture<BookListViewComponent>;

  beforeEach(async(() => {
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
