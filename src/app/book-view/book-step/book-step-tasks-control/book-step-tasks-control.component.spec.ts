import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BookStepTasksControlComponent } from './book-step-tasks-control.component';

describe('BookStepTasksControlComponent', () => {
  let component: BookStepTasksControlComponent;
  let fixture: ComponentFixture<BookStepTasksControlComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BookStepTasksControlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookStepTasksControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
