import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PageUploaderComponent } from './page-uploader.component';

describe('PageUploaderComponent', () => {
  let component: PageUploaderComponent;
  let fixture: ComponentFixture<PageUploaderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PageUploaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PageUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
