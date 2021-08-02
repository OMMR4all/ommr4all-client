import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SymbolEditorComponent } from './symbol-editor.component';

describe('SymbolEditorComponent', () => {
  let component: SymbolEditorComponent;
  let fixture: ComponentFixture<SymbolEditorComponent>;

  beforeEach(waitForAsync(() => {
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
