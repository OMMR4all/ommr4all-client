import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookStepLayoutViewComponent } from './book-step-layout-view.component';

describe('BookStepLayoutViewComponent', () => {
  let component: BookStepLayoutViewComponent;
  let fixture: ComponentFixture<BookStepLayoutViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BookStepLayoutViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookStepLayoutViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
