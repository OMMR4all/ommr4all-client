import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectSymbolsDialogComponent } from './detect-symbols-dialog.component';

describe('DetectSymbolsDialogComponent', () => {
  let component: DetectSymbolsDialogComponent;
  let fixture: ComponentFixture<DetectSymbolsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetectSymbolsDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectSymbolsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
