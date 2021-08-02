import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AnnotationsViewComponent } from './annotations-view.component';

describe('AnnotationsViewComponent', () => {
  let component: AnnotationsViewComponent;
  let fixture: ComponentFixture<AnnotationsViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AnnotationsViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnotationsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
