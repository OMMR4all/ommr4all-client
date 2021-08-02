import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SymbolConfidenceWidgetComponent } from './symbol-confidence-widget.component';

describe('SymbolConfidenceWidgetComponent', () => {
  let component: SymbolConfidenceWidgetComponent;
  let fixture: ComponentFixture<SymbolConfidenceWidgetComponent>;

  beforeEach(waitForAsync(() => {
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
