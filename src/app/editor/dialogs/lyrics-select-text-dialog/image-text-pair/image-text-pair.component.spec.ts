import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageTextPairComponent } from './image-text-pair.component';

describe('ImageTextPairComponent', () => {
  let component: ImageTextPairComponent;
  let fixture: ComponentFixture<ImageTextPairComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImageTextPairComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageTextPairComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
