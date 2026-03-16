import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatternEditDialogComponent } from './pattern-edit-dialog.component';

describe('PatternEditDialogComponent', () => {
  let component: PatternEditDialogComponent;
  let fixture: ComponentFixture<PatternEditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PatternEditDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatternEditDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
