import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SymbolsViewComponent } from './symbols-view.component';

describe('SymbolsViewComponent', () => {
  let component: SymbolsViewComponent;
  let fixture: ComponentFixture<SymbolsViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SymbolsViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SymbolsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
