import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainSymbolsDialogComponent } from './train-symbols-dialog.component';

describe('TrainSymbolsDialogComponent', () => {
  let component: TrainSymbolsDialogComponent;
  let fixture: ComponentFixture<TrainSymbolsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrainSymbolsDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrainSymbolsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
