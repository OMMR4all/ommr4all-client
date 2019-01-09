import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutAnalysisDialogComponent } from './layout-analysis-dialog.component';

describe('LayoutAnalysisDialogComponent', () => {
  let component: LayoutAnalysisDialogComponent;
  let fixture: ComponentFixture<LayoutAnalysisDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LayoutAnalysisDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LayoutAnalysisDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
