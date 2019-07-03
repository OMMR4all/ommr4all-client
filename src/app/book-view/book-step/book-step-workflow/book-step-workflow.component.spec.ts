import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookStepWorkflowComponent } from './book-step-workflow.component';

describe('BookStepWorkflowComponent', () => {
  let component: BookStepWorkflowComponent;
  let fixture: ComponentFixture<BookStepWorkflowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BookStepWorkflowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookStepWorkflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
