import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BookStepPageSelectorComponent } from './book-step-page-selector.component';

describe('BookStepPageSelectorComponent', () => {
  let component: BookStepPageSelectorComponent;
  let fixture: ComponentFixture<BookStepPageSelectorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BookStepPageSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookStepPageSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
