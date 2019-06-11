import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookStepPreprocessingViewComponent } from './book-step-preprocessing-view.component';

describe('BookStepPreprocessingViewComponent', () => {
  let component: BookStepPreprocessingViewComponent;
  let fixture: ComponentFixture<BookStepPreprocessingViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BookStepPreprocessingViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookStepPreprocessingViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
