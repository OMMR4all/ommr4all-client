import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LayoutLassoAreaComponent } from './layout-lasso-area.component';

describe('LayoutLassoAreaComponent', () => {
  let component: LayoutLassoAreaComponent;
  let fixture: ComponentFixture<LayoutLassoAreaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LayoutLassoAreaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LayoutLassoAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
