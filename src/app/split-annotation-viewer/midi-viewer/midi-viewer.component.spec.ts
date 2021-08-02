import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MidiViewerComponent } from './midi-viewer.component';

describe('MidiViewerComponent', () => {
  let component: MidiViewerComponent;
  let fixture: ComponentFixture<MidiViewerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MidiViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MidiViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
