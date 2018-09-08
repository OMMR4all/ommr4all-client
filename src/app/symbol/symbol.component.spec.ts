import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SymbolComponent } from './symbol.component';

describe('SymbolComponent', () => {
  let component: SymbolComponent;
  let fixture: ComponentFixture<SymbolComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SymbolComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SymbolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
