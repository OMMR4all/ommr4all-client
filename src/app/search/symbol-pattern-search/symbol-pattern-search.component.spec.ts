import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SymbolPatternSearchComponent } from './symbol-pattern-search.component';

describe('SymbolPatternSearchComponent', () => {
  let component: SymbolPatternSearchComponent;
  let fixture: ComponentFixture<SymbolPatternSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SymbolPatternSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SymbolPatternSearchComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
