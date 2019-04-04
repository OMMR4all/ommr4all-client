import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RenameAllPagesDialogComponent } from './rename-all-pages-dialog.component';

describe('RenameAllPagesDialogComponent', () => {
  let component: RenameAllPagesDialogComponent;
  let fixture: ComponentFixture<RenameAllPagesDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RenameAllPagesDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RenameAllPagesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
