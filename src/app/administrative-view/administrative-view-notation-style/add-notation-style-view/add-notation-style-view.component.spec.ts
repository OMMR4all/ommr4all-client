import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNotationStyleViewComponent } from './add-notation-style-view.component';

describe('AddNotationStyleViewComponent', () => {
  let component: AddNotationStyleViewComponent;
  let fixture: ComponentFixture<AddNotationStyleViewComponent>;

  beforeEach(async(() => {
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
