import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ImportBookDialogComponent } from './import-book-dialog.component';

describe('ImportBookDialogComponent', () => {
  let component: ImportBookDialogComponent;
  let fixture: ComponentFixture<ImportBookDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ImportBookDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportBookDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
