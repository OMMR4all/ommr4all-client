import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HotkeyViewerComponent } from './hotkey-viewer.component';

describe('HotkeyViewerComponent', () => {
  let component: HotkeyViewerComponent;
  let fixture: ComponentFixture<HotkeyViewerComponent>;

  beforeEach(async(() => {
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
