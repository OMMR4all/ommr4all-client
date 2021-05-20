import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SymbolConfidenceWidgetComponent } from './symbol-confidence-widget.component';

describe('SymbolConfidenceWidgetComponent', () => {
  let component: SymbolConfidenceWidgetComponent;
  let fixture: ComponentFixture<SymbolConfidenceWidgetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SymbolConfidenceWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SymbolConfidenceWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
