import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SheetOverlayComponent } from './sheet-overlay.component';

describe('SheetOverlayComponent', () => {
  let component: SheetOverlayComponent;
  let fixture: ComponentFixture<SheetOverlayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SheetOverlayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SheetOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
