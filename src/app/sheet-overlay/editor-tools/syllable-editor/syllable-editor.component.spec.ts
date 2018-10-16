import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SyllableEditorComponent } from './syllable-editor.component';

describe('SyllableEditorComponent', () => {
  let component: SyllableEditorComponent;
  let fixture: ComponentFixture<SyllableEditorComponent>;

  beforeEach(async(() => {
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
