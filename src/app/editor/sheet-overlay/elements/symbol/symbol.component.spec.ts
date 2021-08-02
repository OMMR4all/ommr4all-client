import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SymbolComponent } from './symbol.component';

describe('SymbolComponent', () => {
  let component: SymbolComponent;
  let fixture: ComponentFixture<SymbolComponent>;

  beforeEach(waitForAsync(() => {
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
