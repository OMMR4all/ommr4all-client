import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SecuredSvgImageComponent } from './secured-svg-image.component';

describe('SecuredSvgImageComponent', () => {
  let component: SecuredSvgImageComponent;
  let fixture: ComponentFixture<SecuredSvgImageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SecuredSvgImageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecuredSvgImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
