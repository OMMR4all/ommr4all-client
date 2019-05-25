import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookCommentsViewComponent } from './book-comments-view.component';

describe('BookCommentsViewComponent', () => {
  let component: BookCommentsViewComponent;
  let fixture: ComponentFixture<BookCommentsViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BookCommentsViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookCommentsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
