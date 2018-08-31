import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RectEditorComponent } from './rect-editor.component';

describe('RectEditorComponent', () => {
  let component: RectEditorComponent;
  let fixture: ComponentFixture<RectEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RectEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RectEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
