import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewDialogComponent } from './add-new-dialog.component';

describe('AddNewDialogComponent', () => {
  let component: AddNewDialogComponent;
  let fixture: ComponentFixture<AddNewDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddNewDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
