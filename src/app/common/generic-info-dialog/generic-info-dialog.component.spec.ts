import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GenericInfoDialogComponent } from './generic-info-dialog.component';

describe('GenericInfoDialogComponent', () => {
  let component: GenericInfoDialogComponent;
  let fixture: ComponentFixture<GenericInfoDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GenericInfoDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenericInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
