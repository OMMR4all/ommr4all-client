import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LineViewComponent } from './line-view.component';

describe('LineViewComponent', () => {
  let component: LineViewComponent;
  let fixture: ComponentFixture<LineViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LineViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LineViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
