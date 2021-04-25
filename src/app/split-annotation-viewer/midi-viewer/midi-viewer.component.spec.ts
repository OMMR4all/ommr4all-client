import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MidiViewerComponent } from './midi-viewer.component';

describe('MidiViewerComponent', () => {
  let component: MidiViewerComponent;
  let fixture: ComponentFixture<MidiViewerComponent>;

  beforeEach(async(() => {
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
