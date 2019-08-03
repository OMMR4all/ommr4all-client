import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookStepViewComponent } from './book-step-view.component';

describe('BookStepViewComponent', () => {
  let component: BookStepViewComponent;
  let fixture: ComponentFixture<BookStepViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BookStepViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookStepViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
