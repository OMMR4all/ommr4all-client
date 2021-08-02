import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TextEditorOverlayComponent } from './text-editor-overlay.component';

describe('TextEditorOverlayComponent', () => {
  let component: TextEditorOverlayComponent;
  let fixture: ComponentFixture<TextEditorOverlayComponent>;

  beforeEach(waitForAsync(() => {
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
