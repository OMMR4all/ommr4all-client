import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportPagesDialogComponent } from './export-pages-dialog.component';

describe('ExportPagesDialogComponent', () => {
  let component: ExportPagesDialogComponent;
  let fixture: ComponentFixture<ExportPagesDialogComponent>;

  beforeEach(async(() => {
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
