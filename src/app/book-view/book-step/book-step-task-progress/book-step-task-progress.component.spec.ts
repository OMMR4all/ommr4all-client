import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BookStepTaskProgressComponent } from './book-step-task-progress.component';

describe('BookStepTaskProgressComponent', () => {
  let component: BookStepTaskProgressComponent;
  let fixture: ComponentFixture<BookStepTaskProgressComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BookStepTaskProgressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookStepTaskProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
