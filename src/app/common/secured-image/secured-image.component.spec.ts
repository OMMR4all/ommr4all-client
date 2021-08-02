import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SecuredImageComponent } from './secured-image.component';

describe('SecuredImageComponent', () => {
  let component: SecuredImageComponent;
  let fixture: ComponentFixture<SecuredImageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SecuredImageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecuredImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
