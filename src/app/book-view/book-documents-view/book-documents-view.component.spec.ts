import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookDocumentsViewComponent } from './book-documents-view.component';

describe('BookDocumentsViewComponent', () => {
  let component: BookDocumentsViewComponent;
  let fixture: ComponentFixture<BookDocumentsViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BookDocumentsViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookDocumentsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
