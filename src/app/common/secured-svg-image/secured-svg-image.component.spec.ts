import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecuredSvgImageComponent } from './secured-svg-image.component';

describe('SecuredSvgImageComponent', () => {
  let component: SecuredSvgImageComponent;
  let fixture: ComponentFixture<SecuredSvgImageComponent>;

  beforeEach(async(() => {
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
