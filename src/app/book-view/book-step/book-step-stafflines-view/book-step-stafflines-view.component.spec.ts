import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookStepStafflinesViewComponent } from './book-step-stafflines-view.component';

describe('BookStepStafflinesViewComponent', () => {
  let component: BookStepStafflinesViewComponent;
  let fixture: ComponentFixture<BookStepStafflinesViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BookStepStafflinesViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookStepStafflinesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
