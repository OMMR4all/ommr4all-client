import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SyllableEditorComponent } from './syllable-editor.component';

describe('SyllableEditorComponent', () => {
  let component: SyllableEditorComponent;
  let fixture: ComponentFixture<SyllableEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SyllableEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SyllableEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
