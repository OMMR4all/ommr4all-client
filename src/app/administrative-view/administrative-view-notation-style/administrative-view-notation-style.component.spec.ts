import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AdministrativeViewNotationStyleComponent } from './administrative-view-notation-style.component';

describe('AdministrativeViewNotationStyleComponent', () => {
  let component: AdministrativeViewNotationStyleComponent;
  let fixture: ComponentFixture<AdministrativeViewNotationStyleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AdministrativeViewNotationStyleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdministrativeViewNotationStyleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
