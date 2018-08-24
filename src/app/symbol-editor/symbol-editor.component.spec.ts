import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SymbolEditorComponent } from './symbol-editor.component';

describe('SymbolEditorComponent', () => {
  let component: SymbolEditorComponent;
  let fixture: ComponentFixture<SymbolEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SymbolEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SymbolEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
