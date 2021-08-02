import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AddNotationStyleViewComponent } from './add-notation-style-view.component';

describe('AddNotationStyleViewComponent', () => {
  let component: AddNotationStyleViewComponent;
  let fixture: ComponentFixture<AddNotationStyleViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddNotationStyleViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNotationStyleViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
