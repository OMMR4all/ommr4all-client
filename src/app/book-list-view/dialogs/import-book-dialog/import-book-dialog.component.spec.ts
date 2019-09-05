import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportBookDialogComponent } from './import-book-dialog.component';

describe('ImportBookDialogComponent', () => {
  let component: ImportBookDialogComponent;
  let fixture: ComponentFixture<ImportBookDialogComponent>;

  beforeEach(async(() => {
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
