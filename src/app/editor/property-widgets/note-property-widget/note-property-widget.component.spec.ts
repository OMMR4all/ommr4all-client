import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NotePropertyWidgetComponent } from './note-property-widget.component';

describe('NotePropertyWidgetComponent', () => {
  let component: NotePropertyWidgetComponent;
  let fixture: ComponentFixture<NotePropertyWidgetComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NotePropertyWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotePropertyWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
