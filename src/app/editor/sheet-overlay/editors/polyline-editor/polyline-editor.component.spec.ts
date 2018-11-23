import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PolylineEditorComponent } from './polyline-editor.component';

describe('PolylineEditorComponent', () => {
  let component: PolylineEditorComponent;
  let fixture: ComponentFixture<PolylineEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PolylineEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PolylineEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
