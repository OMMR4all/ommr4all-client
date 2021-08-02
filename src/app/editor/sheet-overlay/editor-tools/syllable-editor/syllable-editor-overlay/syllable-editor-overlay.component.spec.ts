import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SyllableEditorOverlayComponent } from './syllable-editor-overlay.component';

describe('SyllableEditorOverlayComponent', () => {
  let component: SyllableEditorOverlayComponent;
  let fixture: ComponentFixture<SyllableEditorOverlayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SyllableEditorOverlayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SyllableEditorOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
