import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LoaderIconComponent } from './loader-icon.component';

describe('LoaderIconComponent', () => {
  let component: LoaderIconComponent;
  let fixture: ComponentFixture<LoaderIconComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LoaderIconComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoaderIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
