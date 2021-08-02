import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HotkeyViewerComponent } from './hotkey-viewer.component';

describe('HotkeyViewerComponent', () => {
  let component: HotkeyViewerComponent;
  let fixture: ComponentFixture<HotkeyViewerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HotkeyViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HotkeyViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
