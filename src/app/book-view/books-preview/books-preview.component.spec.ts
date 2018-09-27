import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BooksPreviewComponent } from './books-preview.component';

describe('BooksPreviewComponent', () => {
  let component: BooksPreviewComponent;
  let fixture: ComponentFixture<BooksPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BooksPreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BooksPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
