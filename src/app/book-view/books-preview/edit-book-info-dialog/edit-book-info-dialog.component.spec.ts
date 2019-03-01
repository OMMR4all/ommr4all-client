import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditBookInfoDialogComponent } from './edit-book-info-dialog.component';

describe('EditBookInfoDialogComponent', () => {
  let component: EditBookInfoDialogComponent;
  let fixture: ComponentFixture<EditBookInfoDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditBookInfoDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditBookInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
