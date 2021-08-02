import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BookDocumentsViewComponent } from './book-documents-view.component';

describe('BookDocumentsViewComponent', () => {
  let component: BookDocumentsViewComponent;
  let fixture: ComponentFixture<BookDocumentsViewComponent>;

  beforeEach(waitForAsync(() => {
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
