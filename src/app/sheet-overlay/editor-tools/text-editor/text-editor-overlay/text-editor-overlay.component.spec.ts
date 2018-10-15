import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextEditorOverlayComponent } from './text-editor-overlay.component';

describe('TextEditorOverlayComponent', () => {
  let component: TextEditorOverlayComponent;
  let fixture: ComponentFixture<TextEditorOverlayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextEditorOverlayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextEditorOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
