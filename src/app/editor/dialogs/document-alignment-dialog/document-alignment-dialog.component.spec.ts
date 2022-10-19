import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentAlignmentDialogComponent } from './document-alignment-dialog.component';

describe('DocumentAlignmentDialogComponent', () => {
  let component: DocumentAlignmentDialogComponent;
  let fixture: ComponentFixture<DocumentAlignmentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DocumentAlignmentDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentAlignmentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
