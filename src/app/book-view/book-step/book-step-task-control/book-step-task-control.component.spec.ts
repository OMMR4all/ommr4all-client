import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookStepTaskControlComponent } from './book-step-task-control.component';

describe('BookStepTaskControlComponent', () => {
  let component: BookStepTaskControlComponent;
  let fixture: ComponentFixture<BookStepTaskControlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BookStepTaskControlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookStepTaskControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
