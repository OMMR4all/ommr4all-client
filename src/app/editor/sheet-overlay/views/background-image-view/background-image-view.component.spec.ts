import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BackgroundImageViewComponent } from './background-image-view.component';

describe('BackgroundImageViewComponent', () => {
  let component: BackgroundImageViewComponent;
  let fixture: ComponentFixture<BackgroundImageViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BackgroundImageViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackgroundImageViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
