import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SymbolContextMenuComponent } from './symbol-context-menu.component';

describe('SymbolContextMenuComponent', () => {
  let component: SymbolContextMenuComponent;
  let fixture: ComponentFixture<SymbolContextMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SymbolContextMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SymbolContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
