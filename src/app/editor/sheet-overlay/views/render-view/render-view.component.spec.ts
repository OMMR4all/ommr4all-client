import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RenderViewComponent } from './render-view.component';

describe('RenderViewComponent', () => {
  let component: RenderViewComponent;
  let fixture: ComponentFixture<RenderViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RenderViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RenderViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
