import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ExportPagesDialogComponent } from './export-pages-dialog.component';

describe('ExportPagesDialogComponent', () => {
  let component: ExportPagesDialogComponent;
  let fixture: ComponentFixture<ExportPagesDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ExportPagesDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExportPagesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
