import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReadingOrderViewOverlayComponent } from './reading-order-view-overlay.component';

describe('ReadingOrderViewOverlayComponent', () => {
  let component: ReadingOrderViewOverlayComponent;
  let fixture: ComponentFixture<ReadingOrderViewOverlayComponent>;

  beforeEach(async(() => {
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
