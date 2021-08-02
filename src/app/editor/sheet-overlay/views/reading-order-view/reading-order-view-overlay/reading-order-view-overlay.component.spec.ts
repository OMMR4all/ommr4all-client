import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReadingOrderViewOverlayComponent } from './reading-order-view-overlay.component';

describe('ReadingOrderViewOverlayComponent', () => {
  let component: ReadingOrderViewOverlayComponent;
  let fixture: ComponentFixture<ReadingOrderViewOverlayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReadingOrderViewOverlayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReadingOrderViewOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
