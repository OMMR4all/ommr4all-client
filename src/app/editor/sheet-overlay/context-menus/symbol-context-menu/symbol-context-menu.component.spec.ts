import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SymbolContextMenuComponent } from './symbol-context-menu.component';

describe('SymbolContextMenuComponent', () => {
  let component: SymbolContextMenuComponent;
  let fixture: ComponentFixture<SymbolContextMenuComponent>;

  beforeEach(waitForAsync(() => {
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
