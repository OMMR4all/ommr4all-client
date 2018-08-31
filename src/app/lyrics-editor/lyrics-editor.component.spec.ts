import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LyricsEditorComponent } from './lyrics-editor.component';

describe('LyricsEditorComponent', () => {
  let component: LyricsEditorComponent;
  let fixture: ComponentFixture<LyricsEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LyricsEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LyricsEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
