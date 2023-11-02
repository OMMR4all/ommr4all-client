import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SymbolCopyAreaComponent } from './symbol-copy-area.component';

describe('SymbolCopyAreaComponent', () => {
  let component: SymbolCopyAreaComponent;
  let fixture: ComponentFixture<SymbolCopyAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SymbolCopyAreaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SymbolCopyAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
